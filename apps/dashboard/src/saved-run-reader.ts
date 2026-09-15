import {
  millidegreesPerSecondToRadiansPerSecond,
  milligravityToMetersPerSecondSquared,
  parseWorldCatalog,
  type RuntimePlot,
  type SynchronizedProject,
  type TargetRunState,
  type TelemetrySample,
  type WorldDefinition,
} from "@ucsb-xrp/target";

import { decodeTelemetryTiming } from "../../../packages/target/src/telemetry-timing";
import {
  autosaveDirectoryName,
  autosaveGenerations,
  type CourseDirectoryHandle,
} from "../../shared/course-folder";
import { csvRows, decodeCsvCell } from "./csv-records";
import { validatedAnnotations } from "./monitor-archive-notes";
import { verifyRunFolder } from "./monitor-run-archive";
import type {
  MonitorRunDataset,
  MonitorRunOutput,
} from "./monitor-run-dataset";

const maximumSamples = 30_000;
const maximumMetadataBytes = 16 * 1024 * 1024;
const maximumTelemetryBytes = 64 * 1024 * 1024;
const maximumOutputBytes = 16 * 1024 * 1024;
const runStates: readonly TargetRunState[] = [
  "disconnected",
  "connecting",
  "loading",
  "ready",
  "running",
  "error",
];

type JsonObject = Record<string, unknown>;
type PlotDescriptor = Omit<RuntimePlot, "value"> & {
  csvColumn?: string;
  unitColumn?: string;
};

export interface SavedRunSummary {
  runId: string;
  generation: number;
  name: string;
  startedAt: string;
  finishedAt: string;
  target: TelemetrySample["source"];
  finalState: TargetRunState;
  telemetrySamples: number;
}

interface SavedRunMetadata extends SavedRunSummary {
  project: SynchronizedProject;
  worldId: string;
  world: WorldDefinition;
  finalDetail: string;
  droppedTelemetrySamples: number;
  droppedOutputLines: number;
  outputTimeline?: MonitorRunOutput[];
  programPlots?: PlotDescriptor[];
  annotations: MonitorRunDataset["annotations"];
}

function invalid(detail: string): never {
  throw new Error(
    `The saved run ${detail}. Preserve its files and choose another run.`,
  );
}

function object(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value))
    invalid(`has invalid ${label}`);
  return value as JsonObject;
}

function string(
  value: unknown,
  label: string,
  maximum = 256,
  empty = false,
): string {
  if (
    typeof value !== "string" ||
    (!empty && !value.trim()) ||
    value.length > maximum
  )
    invalid(`has invalid ${label}`);
  return value;
}

function integer(
  value: unknown,
  label: string,
  maximum = Number.MAX_SAFE_INTEGER,
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > maximum
  )
    invalid(`has invalid ${label}`);
  return value;
}

function date(value: unknown, label: string): string {
  const result = string(value, label, 64);
  if (!Number.isFinite(Date.parse(result))) invalid(`has invalid ${label}`);
  return result;
}

function source(value: unknown): TelemetrySample["source"] {
  if (value !== "virtual" && value !== "physical")
    invalid("has an invalid target");
  return value;
}

/** Validate the stored internal world with the same geometry parser as Run. */
function savedWorld(value: unknown, worldId: string): WorldDefinition {
  const world = object(value, "world");
  if (world.id !== worldId)
    invalid("world identity does not match its metadata");
  const fieldNames: Record<string, string> = {
    minimumXmm: "minimum_x_mm",
    minimumYmm: "minimum_y_mm",
    maximumXmm: "maximum_x_mm",
    maximumYmm: "maximum_y_mm",
    initialPose: "initial_pose",
    xMm: "x_mm",
    yMm: "y_mm",
    headingRad: "heading_rad",
    x1Mm: "x1_mm",
    x2Mm: "x2_mm",
    y1Mm: "y1_mm",
    y2Mm: "y2_mm",
    widthMm: "width_mm",
  };
  const convert = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(convert);
    if (!item || typeof item !== "object") return item;
    const result: JsonObject = {};
    for (const [key, child] of Object.entries(item)) {
      if (key === "additionalProperties")
        Object.assign(result, object(child, "world marker properties"));
      else if (key === "includeArenaBoundaryInRange")
        result.range_sensor = { include_arena_boundary: child };
      else result[fieldNames[key] ?? key] = convert(child);
    }
    return result;
  };
  try {
    return parseWorldCatalog(
      JSON.stringify({ default_world: worldId, worlds: [convert(world)] }),
    ).worlds[0]!;
  } catch {
    return invalid("contains an invalid or oversized world");
  }
}

function outputs(value: unknown): MonitorRunOutput[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 2_000)
    invalid("has an invalid output timeline");
  const result = value.map((item): MonitorRunOutput => {
    const entry = object(item, "output entry");
    const stream = entry.stream;
    if (stream !== "stdout" && stream !== "stderr" && stream !== "system")
      invalid("has an invalid output stream");
    const row: MonitorRunOutput = {
      id: string(entry.id, "output identity", 512),
      stream,
      line: string(entry.line, "output text", 65_536, true),
    };
    for (const key of ["timestampMs", "targetTimeMs"] as const) {
      if (entry[key] === undefined) continue;
      if (
        typeof entry[key] !== "number" ||
        !Number.isFinite(entry[key]) ||
        entry[key] < 0
      )
        invalid("has an invalid output timestamp");
      row[key] = entry[key];
    }
    if (entry.targetClockId !== undefined)
      row.targetClockId = string(entry.targetClockId, "output clock", 512);
    return row;
  });
  if (new Set(result.map((item) => item.id)).size !== result.length)
    invalid("has duplicate output identities");
  return result;
}

function plots(value: unknown): PlotDescriptor[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 256)
    invalid("has too many program plots");
  const result = value.map((item): PlotDescriptor => {
    const entry = object(item, "program plot");
    const name = string(entry.name, "program plot name", 32);
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))
      invalid("has an invalid program plot name");
    const csvColumn =
      entry.csvColumn === undefined
        ? undefined
        : string(entry.csvColumn, "program plot column", 96);
    const unitColumn =
      entry.unitColumn === undefined
        ? undefined
        : string(entry.unitColumn, "program plot unit column", 96);
    if (
      csvColumn !== undefined &&
      !/^program_[A-Za-z_][A-Za-z0-9_]*$/.test(csvColumn)
    )
      invalid("has an invalid program plot column");
    if (
      unitColumn !== undefined &&
      !/^program_[A-Za-z_][A-Za-z0-9_]*$/.test(unitColumn)
    )
      invalid("has an invalid program plot unit column");
    return {
      name,
      label: string(entry.label, "program plot label", 80),
      ...(entry.unit === undefined
        ? {}
        : { unit: string(entry.unit, "program plot unit", 24, true) }),
      ...(csvColumn === undefined ? {} : { csvColumn }),
      ...(unitColumn === undefined ? {} : { unitColumn }),
    };
  });
  if (new Set(result.map((plot) => plot.name)).size !== result.length)
    invalid("has duplicate program plot names");
  return result;
}

function metadata(
  text: string,
  projectId: string,
  generation: number,
): SavedRunMetadata {
  let value: JsonObject;
  try {
    value = object(JSON.parse(text), "metadata");
  } catch {
    return invalid("metadata is not valid JSON");
  }
  if (value.schemaVersion !== 1 && value.schemaVersion !== 2)
    invalid("metadata format is unsupported");
  const project = object(value.project, "project");
  if (project.projectId !== projectId)
    invalid("belongs to a different Project");
  const worldId = string(value.worldId, "world identity", 32);
  const finalState = value.finalState;
  if (!runStates.includes(finalState as TargetRunState))
    invalid("has an invalid final state");
  if (typeof project.stale !== "boolean")
    invalid("has an invalid Project revision state");
  const target = source(value.target);
  const annotations = validatedAnnotations(value.annotations).map(
    ({ previousLabel: _pending, ...note }) => note,
  );
  for (const note of annotations) {
    if (
      note.source !== target ||
      note.seq < 0 ||
      (note.physicsStepSeq !== undefined &&
        (!Number.isSafeInteger(note.physicsStepSeq) || note.physicsStepSeq < 0))
    )
      invalid("has inconsistent note identities");
  }
  return {
    runId: string(value.runId, "identity"),
    generation,
    name: string(project.name, "Project name"),
    startedAt: date(value.startedAt, "start date"),
    finishedAt: date(value.finishedAt, "finish date"),
    target,
    finalState: finalState as TargetRunState,
    finalDetail: string(value.finalDetail, "result detail", 65_536, true),
    worldId,
    world: savedWorld(value.world, worldId),
    project: {
      projectId,
      name: string(project.name, "Project name"),
      entrypoint: string(project.entrypoint, "entrypoint"),
      revision: string(project.revision, "Project revision"),
      stale: project.stale,
    },
    telemetrySamples: integer(
      value.telemetrySamples,
      "observation count",
      maximumSamples,
    ),
    droppedTelemetrySamples: integer(
      value.droppedTelemetrySamples ?? 0,
      "lost observation count",
    ),
    droppedOutputLines: integer(
      value.droppedOutputLines ?? 0,
      "lost output count",
    ),
    outputTimeline: outputs(value.outputTimeline),
    programPlots: plots(value.programPlots),
    annotations,
  };
}

async function readFile(
  folder: CourseDirectoryHandle,
  name: string,
  maximum: number,
): Promise<string | null> {
  try {
    const directory = await folder.getDirectoryHandle(autosaveDirectoryName);
    const file = await (await directory.getFileHandle(name)).getFile();
    if (file.size > maximum) invalid(`${name} exceeds its supported size`);
    const text = await file.text();
    if (
      text.length > maximum ||
      new TextEncoder().encode(text).byteLength > maximum
    )
      invalid(`${name} exceeds its supported size`);
    return text;
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError")
      return null;
    throw error;
  }
}

async function assertComplete(folder: CourseDirectoryHandle): Promise<void> {
  // An existing journal is sufficient to reject; do not load its recovery body.
  try {
    const directory = await folder.getDirectoryHandle(autosaveDirectoryName);
    await directory.getFileHandle("pending-run.json");
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") return;
    throw error;
  }
  throw new Error(
    "A saved run write is incomplete. Preserve UCSB_XRP_Autosaves/pending-run.json before repairing the archive.",
  );
}

function path(
  generation: number,
  kind: "metadata" | "telemetry" | "output",
): string {
  return kind === "telemetry"
    ? `telemetry-${generation}.csv`
    : `run-${generation}.${kind === "metadata" ? "json" : "txt"}`;
}

/** Four small metadata reads; this never starts a target or changes the folder. */
export async function listSavedRuns(
  folder: CourseDirectoryHandle,
  projectId: string,
): Promise<SavedRunSummary[]> {
  await verifyRunFolder(folder, projectId);
  await assertComplete(folder);
  const observed: (string | null)[] = [];
  const result: SavedRunSummary[] = [];
  for (let generation = 1; generation <= autosaveGenerations; generation++) {
    const text = await readFile(
      folder,
      path(generation, "metadata"),
      maximumMetadataBytes,
    );
    observed.push(text);
    if (text === null) continue;
    const item = metadata(text, projectId, generation);
    const {
      runId,
      name,
      startedAt,
      finishedAt,
      target,
      finalState,
      telemetrySamples,
    } = item;
    result.push({
      runId,
      generation,
      name,
      startedAt,
      finishedAt,
      target,
      finalState,
      telemetrySamples,
    });
  }
  if (new Set(result.map((run) => run.runId)).size !== result.length)
    invalid("has duplicate run identities");
  for (let generation = 1; generation <= autosaveGenerations; generation++) {
    if (
      (await readFile(
        folder,
        path(generation, "metadata"),
        maximumMetadataBytes,
      )) !== observed[generation - 1]
    )
      invalid(
        "changed while its list was being read; reopen the saved-run list",
      );
  }
  await assertComplete(folder);
  await verifyRunFolder(folder, projectId);
  return result;
}

function checkedRows(text: string): ReturnType<typeof csvRows> {
  // Bound row allocation before asking the shared CSV parser to split fields.
  let quoted = false;
  let rows = 0;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') index++;
      else quoted = !quoted;
    } else if (!quoted && (char === "\r" || char === "\n")) {
      rows++;
      if (char === "\r" && text[index + 1] === "\n") index++;
      if (rows > maximumSamples + 1)
        invalid("contains more than 30,000 observations");
    }
  }
  const parsed = csvRows(text);
  if (parsed.length > maximumSamples + 1)
    invalid("contains more than 30,000 observations");
  return parsed;
}

function plotHeader(plot: PlotDescriptor): string {
  const unit = plot.unit
    ?.replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
  return `program_${plot.name}${unit && !plot.name.toLowerCase().endsWith(`_${unit}`) ? `_${unit}` : ""}`;
}

function samplesFromCsv(
  text: string,
  saved: SavedRunMetadata,
): TelemetrySample[] {
  const rows = checkedRows(text);
  const decoded = (raw: string): string => {
    if (raw.includes('"') && !/^"(?:[^"]|"")*"$/.test(raw))
      invalid("has malformed CSV quoting");
    return decodeCsvCell(raw);
  };
  const header = rows.shift()?.cells.map(decoded) ?? [];
  if (
    header.length < 1 ||
    // 256 signal columns can each have a companion unit column, in addition
    // to the 66 current telemetry, provenance and note columns.
    header.length > 600 ||
    new Set(header).size !== header.length
  )
    invalid("has invalid or ambiguous CSV columns");
  const columns = new Map(header.map((name, index) => [name, index]));
  for (const name of [
    "source",
    "seq",
    "t_s",
    "pose_available",
    "x_mm",
    "y_mm",
    "heading_rad",
    "left_drive_command",
    "right_drive_command",
    "left_wheel_speed_mm_s",
    "right_wheel_speed_mm_s",
    "left_encoder_count",
    "right_encoder_count",
    "collision",
    "button_pressed",
  ])
    if (!columns.has(name)) invalid(`CSV is missing ${name}`);
  const descriptors: PlotDescriptor[] =
    saved.programPlots ??
    header
      .filter((name) => name.startsWith("program_"))
      .map((name) => ({ name: name.slice(8), label: name.slice(8) }));
  const plotColumns = descriptors.map((plot) => ({
    plot,
    header: plot.csvColumn ?? plotHeader(plot),
  }));
  const describedColumns = plotColumns.flatMap(({ plot, header }) =>
    plot.unitColumn ? [header, plot.unitColumn] : [header],
  );
  if (
    new Set(describedColumns).size !== describedColumns.length ||
    describedColumns.some((column) => !columns.has(column)) ||
    header.filter((name) => name.startsWith("program_")).length !==
      describedColumns.length
  )
    invalid("program plot descriptors do not match the CSV");
  if (rows.length !== saved.telemetrySamples)
    invalid("observation count does not match its metadata");
  const notes = new Map<string, string[]>();
  for (const note of saved.annotations) {
    const key =
      note.observationSeq === undefined
        ? `seq:${note.seq}`
        : `observation:${note.observationSeq}`;
    notes.set(key, [...(notes.get(key) ?? []), note.label]);
  }
  const numbers = [
    ["leftWheelDistanceMm", "left_wheel_distance_mm"],
    ["rightWheelDistanceMm", "right_wheel_distance_mm"],
    ["estimatedXmm", "estimated_x_mm"],
    ["estimatedYmm", "estimated_y_mm"],
    ["estimatedHeadingRad", "estimated_heading_rad"],
    ["groundTruthXmm", "ground_truth_x_mm"],
    ["groundTruthYmm", "ground_truth_y_mm"],
    ["groundTruthHeadingRad", "ground_truth_heading_rad"],
    ["requestedForwardSpeedMmS", "requested_forward_speed_mm_s"],
    ["requestedTurnRateRadS", "requested_turn_rate_rad_s"],
    ["targetLeftWheelSpeedMmS", "target_left_wheel_speed_mm_s"],
    ["targetRightWheelSpeedMmS", "target_right_wheel_speed_mm_s"],
  ] as const;
  return rows.map((row): TelemetrySample => {
    if (row.cells.length !== header.length)
      invalid("contains an incomplete telemetry row");
    const cells = row.cells.map(decoded);
    const cell = (name: string): string =>
      columns.has(name) ? cells[columns.get(name)!]! : "";
    const number = (name: string, required = false): number | null => {
      const text = cell(name);
      if (text === "") {
        if (required) invalid(`is missing ${name}`);
        return null;
      }
      if (
        !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(text) ||
        !Number.isFinite(Number(text))
      )
        invalid(`has invalid numeric ${name}`);
      return Number(text);
    };
    const ms = (name: string, required = false): number | null => {
      if (number(name, required) === null) return null;
      // Scale the written decimal before binary conversion, avoiding a second
      // rounding step (for example, 4.02 * 1000 becomes 4019.9999999999995).
      const [mantissa, exponent = "0"] = cell(name).split(/[eE]/);
      const value = Number(`${mantissa}e${Number(exponent) + 3}`);
      if (!Number.isFinite(value)) invalid(`has invalid ${name}`);
      return value;
    };
    const count = (
      name: string,
      required = false,
      signed = false,
    ): number | null => {
      const value = number(name, required);
      if (
        value !== null &&
        (!Number.isSafeInteger(value) || (!signed && value < 0))
      )
        invalid(`has invalid ${name}`);
      return value;
    };
    const bool = (name: string, required = false): boolean | undefined => {
      const value = cell(name);
      if (value === "" && !required) return undefined;
      if (value !== "0" && value !== "1") invalid(`has invalid ${name}`);
      return value === "1";
    };
    const vector = (
      names: string[],
      factor: number,
    ): [number, number, number] | null => {
      const values = names.map((name) => number(name));
      if (values.every((value) => value === null)) return null;
      if (values.some((value) => value === null))
        invalid("has a partial sensor vector");
      const converted = values.map((value) => value! / factor);
      if (converted.some((value) => !Number.isFinite(value)))
        invalid("has an out-of-range sensor vector");
      return converted as [number, number, number];
    };
    const rowSource = source(cell("source"));
    if (rowSource !== saved.target)
      invalid("contains observations from a different target");
    const tMs = ms("t_s", true)!;
    if (tMs < 0) invalid("contains negative display time");
    const sample: TelemetrySample = {
      source: rowSource,
      seq: count("seq", true)!,
      tMs,
      poseAvailable: bool("pose_available", true)!,
      xMm: number("x_mm", true)!,
      yMm: number("y_mm", true)!,
      headingRad: number("heading_rad", true)!,
      leftEffort: number("left_drive_command", true)!,
      rightEffort: number("right_drive_command", true)!,
      leftWheelSpeedMmS: number("left_wheel_speed_mm_s", true)!,
      rightWheelSpeedMmS: number("right_wheel_speed_mm_s", true)!,
      leftEncoderCount: count("left_encoder_count", true, true)!,
      rightEncoderCount: count("right_encoder_count", true, true)!,
      collision: bool("collision", true)!,
      rangeMm: number("range_mm"),
      buttonPressed: bool("button_pressed", true)!,
      accelerationMg: vector(
        ["acceleration_x_m_s2", "acceleration_y_m_s2", "acceleration_z_m_s2"],
        milligravityToMetersPerSecondSquared(1),
      ),
      angularRateMdps: vector(
        [
          "angular_rate_x_rad_s",
          "angular_rate_y_rad_s",
          "angular_rate_z_rad_s",
        ],
        millidegreesPerSecondToRadiansPerSecond(1),
      ),
      temperatureC: number("temperature_c"),
      batteryV: number("battery_v"),
      sensorError: cell("sensor_error") || null,
      plotValues: plotColumns.flatMap(({ plot, header }) => {
        const value = number(header);
        const {
          csvColumn: _column,
          unitColumn,
          unit: fixedUnit,
          ...descriptor
        } = plot;
        const unit = unitColumn
          ? string(cell(unitColumn), "recorded plot unit", 24, true)
          : fixedUnit;
        return value === null
          ? []
          : [{ ...descriptor, ...(unit ? { unit } : {}), value }];
      }),
    };
    if (sample.plotValues!.length > 16)
      invalid("contains more than 16 program plot values in one observation");
    for (const [field, name] of numbers)
      if (columns.has(name)) sample[field] = number(name);
    for (const [field, name] of [
      ["estimatedPoseAvailable", "estimated_pose_available"],
      ["groundTruthPoseAvailable", "ground_truth_pose_available"],
    ] as const) {
      const value = bool(name);
      if (value !== undefined) sample[field] = value;
    }
    for (const [field, name] of [
      ["observationSeq", "observation_seq"],
      ["physicsStepSeq", "physics_step_seq"],
      ["courseSnapshotSeq", "course_snapshot_seq"],
    ] as const) {
      const value = count(name);
      if (value !== null) sample[field] = value;
    }
    if (cell("observation_kind")) {
      const kind = cell("observation_kind");
      if (
        ![
          "initial",
          "physics",
          "actuator",
          "course",
          "stop",
          "reset",
          "state",
        ].includes(kind)
      )
        invalid("has invalid observation kind");
      sample.observationKind = kind as TelemetrySample["observationKind"];
    }
    const published = ms("course_published_at_s");
    if (published !== null) {
      if (published < 0) invalid("has invalid course publication time");
      sample.coursePublishedAtMs = published;
    }
    if (cell("timing_schema_version")) {
      if (
        cell("timing_schema_version") !== "1" ||
        cell("clock_basis") !== "first-acquisition" ||
        !cell("clock_id")
      )
        invalid("has unsupported acquisition timing");
      sample.timing = decodeTelemetryTiming(
        [
          count("raw_device_time_ms"),
          ms("acquired_at_s"),
          count("acquisition_seq"),
          ms("range_acquired_at_s"),
          count("range_seq"),
          ms("diagnostics_acquired_at_s"),
          count("diagnostics_seq"),
          count("acquired_left_encoder_count", false, true),
          count("acquired_right_encoder_count", false, true),
          number("acquired_range_mm"),
          ms("published_at_s"),
          ms("sample_dt_s"),
          ms("sample_period_s"),
          ms("overrun_s"),
          cell("sample_kind"),
          bool("range_sampled", true),
        ],
        cell("clock_id"),
      );
    } else if (
      [
        "clock_id",
        "clock_basis",
        "sample_kind",
        "raw_device_time_ms",
        "acquired_at_s",
        "acquisition_seq",
        "range_acquired_at_s",
        "range_seq",
        "range_sampled",
        "diagnostics_acquired_at_s",
        "diagnostics_seq",
        "acquired_left_encoder_count",
        "acquired_right_encoder_count",
        "acquired_range_mm",
        "published_at_s",
        "sample_dt_s",
        "sample_period_s",
        "overrun_s",
      ].some((name) => cell(name))
    )
      invalid("has unversioned acquisition timing");
    const schema = count("csv_schema_version");
    if (schema !== null && ![1, 2, 3, 4].includes(schema))
      invalid("CSV format is unsupported");
    const dropped = count("recording_dropped_observations");
    if (dropped !== null && dropped !== saved.droppedTelemetrySamples)
      invalid("lost-observation count does not match its metadata");
    if (columns.has("note")) {
      const labels = [
        ...(sample.observationSeq === undefined
          ? []
          : (notes.get(`observation:${sample.observationSeq}`) ?? [])),
        ...(notes.get(`seq:${sample.seq}`) ?? []),
      ];
      if (cell("note") !== labels.join(" | "))
        invalid("note text does not match its observation metadata");
    }
    return sample;
  });
}

/** Restore only a complete, identity-checked run; never infer acquisition times. */
export async function readSavedRun(
  folder: CourseDirectoryHandle,
  projectId: string,
  runId: string,
): Promise<MonitorRunDataset> {
  const selected = (await listSavedRuns(folder, projectId)).find(
    (run) => run.runId === runId,
  );
  if (!selected)
    invalid("is no longer among this Project's four retained runs");
  const name = path(selected.generation, "metadata");
  const text = await readFile(folder, name, maximumMetadataBytes);
  if (text === null) invalid("metadata is missing");
  const saved = metadata(text, projectId, selected.generation);
  if (saved.runId !== runId) invalid("rotated while it was being opened");
  await assertComplete(folder);
  const csv = await readFile(
    folder,
    path(selected.generation, "telemetry"),
    maximumTelemetryBytes,
  );
  if (csv === null) invalid("telemetry file is missing");
  let output = saved.outputTimeline;
  if (output === undefined) {
    const transcript = await readFile(
      folder,
      path(selected.generation, "output"),
      maximumOutputBytes,
    );
    if (transcript === null) invalid("legacy output file is missing");
    output = transcript
      ? [
          {
            id: `${runId}:legacy-transcript`,
            stream: "system",
            line: transcript,
          },
        ]
      : [];
  }
  const samples = samplesFromCsv(csv, saved);
  if ((await readFile(folder, name, maximumMetadataBytes)) !== text)
    invalid(
      "changed while its files were being read; reopen the saved-run list",
    );
  await assertComplete(folder);
  await verifyRunFolder(folder, projectId);
  return {
    id: saved.runId,
    target: saved.target,
    project: saved.project,
    worldId: saved.worldId,
    world: saved.world,
    startedAt: saved.startedAt,
    finishedAt: saved.finishedAt,
    finalState: saved.finalState,
    finalDetail: saved.finalDetail,
    recording: {
      schemaVersion: 3,
      samples,
      droppedSamples: saved.droppedTelemetrySamples,
    },
    output,
    droppedOutputLines: saved.droppedOutputLines,
    annotations: saved.annotations,
  };
}
