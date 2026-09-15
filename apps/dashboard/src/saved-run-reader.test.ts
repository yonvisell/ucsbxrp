import { describe, expect, it, vi } from "vitest";
import { XrpSimulator } from "@ucsb-xrp/simulator";
import { DEFAULT_WORLD_CATALOG } from "@ucsb-xrp/target";
import { decodeTelemetryTiming } from "../../../packages/target/src/telemetry-timing";
import { virtualTelemetrySample } from "../../../packages/target/src/virtual-telemetry";
import {
  autosaveDirectoryName,
  type CourseDirectoryHandle,
} from "../../shared/course-folder";
import { archiveForRun } from "../../shared/run-archive-format";
import { csvRows, decodeCsvCell, encodeCsvCell } from "./csv-records";
import { createMonitorAnnotation } from "./monitor-export-core";
import { MonitorRunDatasetController } from "./monitor-run-dataset";
import { listSavedRuns, readSavedRun } from "./saved-run-reader";

const projectId = "project-a";
const metadataPath = `${autosaveDirectoryName}/run-1.json`;
const telemetryPath = `${autosaveDirectoryName}/telemetry-1.csv`;
const journalPath = `${autosaveDirectoryName}/pending-run.json`;

function run(id = "recorded-run") {
  const base = virtualTelemetrySample(new XrpSimulator().state, null);
  const timing = decodeTelemetryTiming(
    [
      1_073_741_800,
      0,
      1,
      0,
      1,
      7,
      1,
      -5,
      6,
      null,
      13,
      20,
      20,
      0,
      "course",
      true,
    ],
    "virtual:session:run:acquisition",
  )!;
  const controller = new MonitorRunDatasetController();
  const world = DEFAULT_WORLD_CATALOG.worlds[0]!;
  controller.begin({
    id,
    target: "virtual",
    worldId: world.id,
    world,
    project: {
      projectId,
      name: "Measured wheel run",
      entrypoint: "main.py",
      revision: "project-revision-32",
      stale: false,
    },
    startedAt: "2026-09-14T18:00:00.000Z",
  });
  const first = {
    ...base,
    seq: 8,
    observationSeq: 40,
    observationKind: "course" as const,
    physicsStepSeq: 8,
    courseSnapshotSeq: 1,
    coursePublishedAtMs: 13,
    tMs: 4_000,
    timing,
    leftEncoderCount: -5,
    rightEncoderCount: 6,
    accelerationMg: [0, -1000, 1000] as [number, number, number],
    angularRateMdps: [-180_000, 0, 90_000] as [number, number, number],
    rangeMm: null,
    temperatureC: 0,
    batteryV: null,
    plotValues: [
      { name: "error", label: "Wheel error", unit: "mm/s", value: 0 },
    ],
  };
  const second = {
    ...first,
    observationSeq: 41,
    observationKind: "actuator" as const,
    plotValues: [],
    rangeMm: 0,
    accelerationMg: null,
    angularRateMdps: null,
    sensorError: 'sensor, unavailable\nretry "later"',
  };
  const third = {
    ...first,
    seq: 9,
    observationSeq: 42,
    physicsStepSeq: 9,
    tMs: 4_020,
    courseSnapshotSeq: 2,
    coursePublishedAtMs: 45,
    timing: {
      ...timing,
      rawDeviceTimeMs: 4,
      acquiredAtMs: 28,
      acquisitionSeq: 2,
      publishedAtMs: 45,
      rangeSampled: false,
    },
    plotValues: [
      { name: "error", label: "Wheel error", unit: "mm/s", value: -2 },
    ],
  };
  for (const sample of [first, second, third]) controller.capture(sample);
  controller.reportRetainedTelemetryDropped(7);
  controller.addOutput({
    id: "output-1",
    stream: "stdout",
    line: 'zero, then "move"\nsecond line',
    timestampMs: 1_789_408_800_025,
    targetTimeMs: 25,
    targetClockId: "virtual:session:program",
  });
  controller.addOutput({
    id: "output-2",
    stream: "system",
    line: "Run stopped",
  });
  controller.reportDroppedOutput(3);
  controller.addAnnotation(
    createMonitorAnnotation(
      [second],
      second.tMs,
      'same time, distinct observation\n"wheel held"',
      123,
    )!,
  );
  return controller.complete(
    "ready",
    "Program stopped",
    "2026-09-14T18:00:02.000Z",
  )!;
}

/** Read-only file handles returning real File snapshots, with interleaving hooks. */
function memoryFolder(
  files: Map<string, string>,
  beforeRead: (path: string) => void = () => undefined,
  prefix = "",
): CourseDirectoryHandle {
  return {
    kind: "directory",
    name: prefix || "Project A",
    async *entries() {},
    getDirectoryHandle: async (name) =>
      memoryFolder(files, beforeRead, `${prefix}${name}/`),
    getFileHandle: async (name) => {
      const path = prefix + name;
      if (!files.has(path))
        throw new DOMException("Missing file", "NotFoundError");
      return {
        kind: "file",
        name,
        getFile: async () => {
          beforeRead(path);
          if (!files.has(path))
            throw new DOMException("Missing file", "NotFoundError");
          return new File([files.get(path)!], name);
        },
        createWritable: async () => {
          throw new Error("Reader attempted a write");
        },
      };
    },
    removeEntry: async () => {
      throw new Error("Reader attempted a removal");
    },
  };
}

function setup(beforeRead?: (path: string) => void) {
  const original = run();
  const archive = archiveForRun(original);
  const files = new Map([
    [".ucsb-xrp-project.json", JSON.stringify({ session: { projectId } })],
    [metadataPath, archive.metadata],
    [telemetryPath, archive.telemetry],
    [`${autosaveDirectoryName}/run-1.txt`, archive.output],
  ]);
  return { original, files, folder: memoryFolder(files, beforeRead) };
}

function changeCell(
  csv: string,
  column: string,
  value: string,
  rowIndex = 1,
): string {
  const rows = csvRows(csv);
  const index = rows[0]!.cells.map(decodeCsvCell).indexOf(column);
  if (index < 0) throw new Error(`Unknown fixture column ${column}`);
  rows[rowIndex]!.cells[index] = encodeCsvCell(value);
  return rows.map((row) => row.cells.join(",") + row.ending).join("");
}

function removeColumns(csv: string, names: (name: string) => boolean): string {
  const rows = csvRows(csv);
  const keep = rows[0]!.cells
    .map((cell, index) => (names(decodeCsvCell(cell)) ? -1 : index))
    .filter((index) => index >= 0);
  return rows
    .map((row) => keep.map((index) => row.cells[index]).join(",") + row.ending)
    .join("");
}

describe("saved run reader", () => {
  it("round-trips the real archive writer with separate clocks, wrap, repeated time, missing values and multiline notes", async () => {
    const { original, folder, files } = setup();
    const before = [...files];
    expect(await listSavedRuns(folder, projectId)).toEqual([
      {
        runId: original.id,
        generation: 1,
        name: original.project!.name,
        startedAt: original.startedAt,
        finishedAt: original.finishedAt,
        target: "virtual",
        finalState: "ready",
        telemetrySamples: 3,
      },
    ]);
    const restored = await readSavedRun(folder, projectId, original.id);
    expect(restored.project).toEqual(original.project);
    expect(restored.output).toEqual(original.output);
    expect(restored.annotations).toEqual(original.annotations);
    expect(restored.recording.droppedSamples).toBe(7);
    expect(restored.droppedOutputLines).toBe(3);
    const [first, second, third] = restored.recording.samples;
    expect(first!.tMs).toBe(second!.tMs);
    expect(first!.observationSeq).toBe(40);
    expect(second!.observationSeq).toBe(41);
    expect(restored.annotations[0]!.observationSeq).toBe(41);
    expect(first!.timing).toEqual(original.recording.samples[0]!.timing);
    expect(third!.timing!.rawDeviceTimeMs).toBe(4);
    expect(third!.timing!.acquiredAtMs).toBe(28);
    expect(third!.tMs).toBe(4020);
    expect(first!.rangeMm).toBeNull();
    expect(second!.rangeMm).toBe(0);
    expect(first!.temperatureC).toBe(0);
    expect(first!.batteryV).toBeNull();
    expect(second!.accelerationMg).toBeNull();
    expect(second!.sensorError).toBe(
      original.recording.samples[1]!.sensorError,
    );
    expect(first!.plotValues).toEqual(
      original.recording.samples[0]!.plotValues,
    );
    expect(second!.plotValues).toEqual([]);
    expect(third!.plotValues).toEqual(
      original.recording.samples[2]!.plotValues,
    );
    first!.accelerationMg!.forEach((value, index) =>
      expect(value).toBeCloseTo(
        original.recording.samples[0]!.accelerationMg![index]!,
        10,
      ),
    );
    first!.angularRateMdps!.forEach((value, index) =>
      expect(value).toBeCloseTo(
        original.recording.samples[0]!.angularRateMdps![index]!,
        10,
      ),
    );
    expect(restored.world).toMatchObject(original.world);
    expect([...files]).toEqual(before);
  });

  it("loads an older archive without inventing missing acquisition clocks, plot units or output timestamps", async () => {
    const { original, folder, files } = setup();
    const meta = JSON.parse(files.get(metadataPath)!);
    meta.schemaVersion = 1;
    delete meta.outputTimeline;
    delete meta.programPlots;
    delete meta.telemetry;
    files.set(metadataPath, JSON.stringify(meta));
    const timingStart = csvRows(files.get(telemetryPath)!)[0]!.cells.indexOf(
      "timing_schema_version",
    );
    const timingNames = new Set(
      csvRows(files.get(telemetryPath)!)[0]!.cells.slice(timingStart, -1),
    );
    files.set(
      telemetryPath,
      removeColumns(files.get(telemetryPath)!, (name) => timingNames.has(name)),
    );
    const restored = await readSavedRun(folder, projectId, original.id);
    expect(restored.recording.samples[0]!.timing).toBeUndefined();
    expect(restored.recording.samples[0]!.tMs).toBe(4000);
    expect(restored.recording.samples[0]!.plotValues).toEqual([
      { name: "error_mm_s", label: "error_mm_s", value: 0 },
    ]);
    expect(restored.output).toEqual([
      {
        id: `${original.id}:legacy-transcript`,
        stream: "system",
        line: files.get(`${autosaveDirectoryName}/run-1.txt`)!,
      },
    ]);
  });

  it("finds the selected identity in an older generation rather than assuming run-1", async () => {
    const { original, folder, files } = setup();
    for (const [kind, extension] of [
      ["run", "json"],
      ["telemetry", "csv"],
      ["run", "txt"],
    ]) {
      const old = `${autosaveDirectoryName}/${kind}-1.${extension}`;
      files.set(
        `${autosaveDirectoryName}/${kind}-4.${extension}`,
        files.get(old)!,
      );
      files.delete(old);
    }
    const fresh = archiveForRun(run("newer-run"));
    files.set(metadataPath, fresh.metadata);
    files.set(telemetryPath, fresh.telemetry);
    files.set(`${autosaveDirectoryName}/run-1.txt`, fresh.output);
    expect(
      (await listSavedRuns(folder, projectId)).map((item) => item.generation),
    ).toEqual([1, 4]);
    expect((await readSavedRun(folder, projectId, original.id)).id).toBe(
      original.id,
    );
  });

  it("preserves colliding program column names and changes in recorded units", async () => {
    const { original, folder, files } = setup();
    const samples = original.recording.samples.map((sample, index) => ({
      ...sample,
      plotValues: [
        {
          name: "distance",
          label: index ? "Later label" : "Distance",
          unit: index === 0 ? "mm" : index === 1 ? "m" : "",
          value: 3 + index,
        },
        {
          name: "distance_mm",
          label: "Other distance",
          unit: "mm",
          value: 8 + index,
        },
      ],
    }));
    const archive = archiveForRun({
      ...original,
      recording: { ...original.recording, samples },
    });
    files.set(metadataPath, archive.metadata);
    files.set(telemetryPath, archive.telemetry);
    const restored = await readSavedRun(folder, projectId, original.id);
    expect(restored.recording.samples[0]!.plotValues).toEqual([
      { name: "distance", label: "Distance", unit: "mm", value: 3 },
      { name: "distance_mm", label: "Other distance", unit: "mm", value: 8 },
    ]);
    expect(restored.recording.samples[1]!.plotValues?.[0]).toEqual({
      name: "distance",
      label: "Distance",
      unit: "m",
      value: 4,
    });
    expect(restored.recording.samples[2]!.plotValues).toEqual([
      { name: "distance", label: "Distance", value: 5 },
      { name: "distance_mm", label: "Other distance", unit: "mm", value: 10 },
    ]);
    const meta = JSON.parse(archive.metadata);
    meta.programPlots[1].csvColumn = meta.programPlots[0].csvColumn;
    files.set(metadataPath, JSON.stringify(meta));
    await expect(readSavedRun(folder, projectId, original.id)).rejects.toThrow(
      "descriptors",
    );
  });

  it("accepts all 30,000 retained observations with their original order", async () => {
    const { original, folder, files } = setup();
    const base = virtualTelemetrySample(new XrpSimulator().state, null);
    const samples = Array.from({ length: 30_000 }, (_, observationSeq) => ({
      ...base,
      observationSeq,
      seq: Math.floor(observationSeq / 3),
      tMs: Math.floor(observationSeq / 3) * 5,
    }));
    const archive = archiveForRun({
      ...original,
      annotations: [],
      recording: { schemaVersion: 3, samples, droppedSamples: 0 },
    });
    files.set(metadataPath, archive.metadata);
    files.set(telemetryPath, archive.telemetry);
    const restored = await readSavedRun(folder, projectId, original.id);
    expect(restored.recording.samples).toHaveLength(30_000);
    expect(restored.recording.samples[29_999]!.observationSeq).toBe(29_999);
    expect(restored.recording.samples[29_999]!.tMs).toBe(49_995);
  });

  it("round-trips 256 descriptors whose units vary across 32 bounded observations", async () => {
    const { original, folder, files } = setup();
    const base = virtualTelemetrySample(new XrpSimulator().state, null);
    const samples = Array.from({ length: 32 }, (_, observationSeq) => ({
      ...base,
      observationSeq,
      plotValues: Array.from({ length: 16 }, (_, offset) => {
        const index = Math.floor(observationSeq / 2) * 16 + offset;
        return {
          name: `signal_${index}`,
          label: `Signal ${index}`,
          value: index + observationSeq,
          unit: observationSeq % 2 === 0 ? "mm" : "m",
        };
      }),
    }));
    const archive = archiveForRun({
      ...original,
      annotations: [],
      recording: { schemaVersion: 3, samples, droppedSamples: 0 },
    });
    const metadata = JSON.parse(archive.metadata);
    expect(metadata.programPlots).toHaveLength(256);
    expect(
      metadata.programPlots.every(
        (plot: { unitColumn?: string }) => plot.unitColumn,
      ),
    ).toBe(true);
    expect(csvRows(archive.telemetry)[0]!.cells).toHaveLength(578);
    files.set(metadataPath, archive.metadata);
    files.set(telemetryPath, archive.telemetry);
    const restored = await readSavedRun(folder, projectId, original.id);
    expect(restored.recording.samples).toHaveLength(32);
    expect(
      restored.recording.samples.map((sample) => sample.plotValues),
    ).toEqual(samples.map((sample) => sample.plotValues));
  });

  it("reopens a run that failed before producing any sensor observations", async () => {
    const { original, folder, files } = setup();
    const archive = archiveForRun({
      ...original,
      finalState: "error",
      annotations: [],
      recording: { schemaVersion: 3, samples: [], droppedSamples: 0 },
    });
    files.set(metadataPath, archive.metadata);
    files.set(telemetryPath, archive.telemetry);
    const restored = await readSavedRun(folder, projectId, original.id);
    expect(restored.recording.samples).toEqual([]);
    expect(restored.finalState).toBe("error");
    expect(restored.output).toEqual(original.output);
    files.set(telemetryPath, "unrelated_column\n");
    await expect(readSavedRun(folder, projectId, original.id)).rejects.toThrow(
      "CSV is missing",
    );
  });

  it("rejects an oversized file before asking the browser to load its text", async () => {
    const { original, folder } = setup();
    const directory = await folder.getDirectoryHandle(autosaveDirectoryName);
    const ordinaryGetFile = directory.getFileHandle.bind(directory);
    const text = vi.fn(async () => {
      throw new Error("Oversized contents were read");
    });
    directory.getFileHandle = async (name, options) => {
      const handle = await ordinaryGetFile(name, options);
      if (name === "telemetry-1.csv")
        handle.getFile = async () => {
          const file = new File(["placeholder"], name);
          Object.defineProperty(file, "size", { value: 64 * 1024 * 1024 + 1 });
          file.text = text;
          return file;
        };
      return handle;
    };
    folder.getDirectoryHandle = async () => directory;
    await expect(readSavedRun(folder, projectId, original.id)).rejects.toThrow(
      "exceeds its supported size",
    );
    expect(text).not.toHaveBeenCalled();
  });

  it("rejects notes whose text no longer matches the exact saved observation", async () => {
    const { original, files, folder } = setup();
    files.set(
      telemetryPath,
      changeCell(files.get(telemetryPath)!, "note", "different note", 2),
    );
    await expect(readSavedRun(folder, projectId, original.id)).rejects.toThrow(
      "note text",
    );
  });

  it("rejects an incomplete journal before loading recovery data", async () => {
    const { folder, files } = setup((path) => {
      if (path === journalPath)
        throw new Error("Journal body should not be read");
    });
    files.set(journalPath, "interrupted");
    await expect(listSavedRuns(folder, projectId)).rejects.toThrow(
      "incomplete",
    );
  });

  it("rejects rotation during the metadata list and during the CSV read", async () => {
    let reads = 0;
    const first = setup((path) => {
      if (path === metadataPath && ++reads === 2)
        first.files.set(metadataPath, archiveForRun(run("new-run")).metadata);
    });
    await expect(listSavedRuns(first.folder, projectId)).rejects.toThrow(
      "changed",
    );
    const second = setup((path) => {
      if (path === telemetryPath)
        second.files.set(metadataPath, archiveForRun(run("new-run")).metadata);
    });
    await expect(
      readSavedRun(second.folder, projectId, second.original.id),
    ).rejects.toThrow("changed");
  });

  it("rejects a journal or changed Project identity introduced after reading begins", async () => {
    const interrupted = setup((path) => {
      if (path === telemetryPath)
        interrupted.files.set(journalPath, "recovery");
    });
    await expect(
      readSavedRun(interrupted.folder, projectId, interrupted.original.id),
    ).rejects.toThrow("incomplete");
    const replaced = setup((path) => {
      if (path === telemetryPath)
        replaced.files.set(
          ".ucsb-xrp-project.json",
          JSON.stringify({ session: { projectId: "another-project" } }),
        );
    });
    await expect(
      readSavedRun(replaced.folder, projectId, replaced.original.id),
    ).rejects.toThrow("could not be verified");
  });

  it.each([
    ["t_s", "not-a-number", "numeric"],
    ["seq", "2.5", "seq"],
    ["source", "physical", "different target"],
    ["button_pressed", "true", "button_pressed"],
    ["acceleration_y_m_s2", "", "partial sensor vector"],
    ["timing_schema_version", "9", "unsupported acquisition"],
    ["acquisition_seq", "-1", "acquisition_seq"],
    ["recording_dropped_observations", "0", "lost-observation count"],
  ])(
    "rejects corrupt %s without silently substituting a value",
    async (column, value, error) => {
      const { original, files, folder } = setup();
      files.set(
        telemetryPath,
        changeCell(files.get(telemetryPath)!, column, value),
      );
      await expect(
        readSavedRun(folder, projectId, original.id),
      ).rejects.toThrow(error);
    },
  );

  it("rejects missing telemetry, bad row shape, malformed quoting and duplicate columns", async () => {
    const missing = setup();
    missing.files.delete(telemetryPath);
    await expect(
      readSavedRun(missing.folder, projectId, missing.original.id),
    ).rejects.toThrow("missing");
    for (const corrupt of [
      (text: string) => text.replace(/\n/, ",seq\n"),
      (text: string) => text.replace(/\n/, ",extra_column\n"),
      (text: string) => text.replace("virtual,", 'vi"rtual,'),
    ]) {
      const { original, files, folder } = setup();
      files.set(telemetryPath, corrupt(files.get(telemetryPath)!));
      await expect(
        readSavedRun(folder, projectId, original.id),
      ).rejects.toThrow();
    }
  });

  it("enforces the row bound before decoding a CSV, independently of metadata", async () => {
    const { original, files, folder } = setup();
    files.set(telemetryPath, "source\n" + "virtual\n".repeat(30_001));
    await expect(readSavedRun(folder, projectId, original.id)).rejects.toThrow(
      "30,000",
    );
  });

  it("rejects corrupt metadata identity, geometry, note identity and output clocks", async () => {
    for (const mutate of [
      (value: any) => {
        value.project.projectId = "another-project";
      },
      (value: any) => {
        value.world.bounds.maximumXmm = value.world.bounds.minimumXmm;
      },
      (value: any) => {
        value.annotations.push(value.annotations[0]);
      },
      (value: any) => {
        value.outputTimeline[0].targetTimeMs = -1;
      },
      (value: any) => {
        value.telemetrySamples = 30_001;
      },
    ]) {
      const { original, files, folder } = setup();
      const meta = JSON.parse(files.get(metadataPath)!);
      mutate(meta);
      files.set(metadataPath, JSON.stringify(meta));
      await expect(
        readSavedRun(folder, projectId, original.id),
      ).rejects.toThrow();
    }
  });
});
