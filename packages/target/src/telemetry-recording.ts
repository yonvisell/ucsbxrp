import type { TelemetrySample } from "./types";
import {
  millidegreesPerSecondToRadiansPerSecond,
  milligravityToMetersPerSecondSquared,
} from "./telemetry-units";

export interface TelemetryRecordingSnapshot {
  readonly schemaVersion: 3;
  readonly samples: readonly TelemetrySample[];
  readonly droppedSamples: number;
}

export class TelemetryRecorder {
  private samples: TelemetrySample[] = [];
  private nextWriteIndex = 0;
  private droppedSamples = 0;
  private lastCapturedSequence: number | null = null;
  private lastCapturedSource: TelemetrySample["source"] | null = null;
  private lastCapturedIdentity: "observation" | "physical" | null = null;
  private active = false;

  constructor(readonly maximumSamples = 30_000) {
    if (!Number.isInteger(maximumSamples) || maximumSamples < 1) {
      throw new Error("maximumSamples must be a positive integer");
    }
  }

  get isRecording(): boolean {
    return this.active;
  }

  get sampleCount(): number {
    return this.samples.length;
  }

  get droppedSampleCount(): number {
    return this.droppedSamples;
  }

  start(): void {
    this.samples = [];
    this.nextWriteIndex = 0;
    this.droppedSamples = 0;
    this.lastCapturedSequence = null;
    this.lastCapturedSource = null;
    this.lastCapturedIdentity = null;
    this.active = true;
  }

  stop(): TelemetryRecordingSnapshot {
    this.active = false;
    return this.snapshot();
  }

  clear(): void {
    this.samples = [];
    this.nextWriteIndex = 0;
    this.droppedSamples = 0;
    this.lastCapturedSequence = null;
    this.lastCapturedSource = null;
    this.lastCapturedIdentity = null;
    this.active = false;
  }

  capture(sample: TelemetrySample): void {
    if (!this.active) {
      return;
    }
    const observationIdentity =
      Number.isSafeInteger(sample.observationSeq) &&
      sample.observationSeq! >= 0;
    const identity = observationIdentity
      ? "observation"
      : sample.source === "physical"
        ? "physical"
        : null;
    const sequence = observationIdentity
      ? sample.observationSeq!
      : identity === "physical"
        ? sample.seq
        : null;
    if (
      identity !== null &&
      identity === this.lastCapturedIdentity &&
      this.lastCapturedSource === sample.source &&
      this.lastCapturedSequence !== null &&
      sequence !== null &&
      sequence > this.lastCapturedSequence + 1
    ) {
      this.droppedSamples += sequence - this.lastCapturedSequence - 1;
    }
    this.lastCapturedIdentity = identity;
    this.lastCapturedSource = sample.source;
    this.lastCapturedSequence = sequence;
    const copy = copySample(sample);
    if (this.samples.length < this.maximumSamples) {
      this.samples.push(copy);
      return;
    }

    // A ring buffer keeps long recordings bounded without moving every saved
    // sample each time a new telemetry packet arrives.
    this.samples[this.nextWriteIndex] = copy;
    this.nextWriteIndex = (this.nextWriteIndex + 1) % this.maximumSamples;
    this.droppedSamples += 1;
  }

  snapshot(): TelemetryRecordingSnapshot {
    const orderedSamples =
      this.droppedSamples === 0
        ? this.samples
        : [
            ...this.samples.slice(this.nextWriteIndex),
            ...this.samples.slice(0, this.nextWriteIndex),
          ];
    return {
      schemaVersion: 3,
      samples: orderedSamples.map(copySample),
      droppedSamples: this.droppedSamples,
    };
  }
}

const csvColumns = [
  "source",
  "pose_available",
  "seq",
  "t_s",
  "x_mm",
  "y_mm",
  "heading_rad",
  "left_drive_command",
  "right_drive_command",
  "left_wheel_speed_mm_s",
  "right_wheel_speed_mm_s",
  "left_wheel_distance_mm",
  "right_wheel_distance_mm",
  "left_encoder_count",
  "right_encoder_count",
  "collision",
  "range_mm",
  "button_pressed",
  "acceleration_x_m_s2",
  "acceleration_y_m_s2",
  "acceleration_z_m_s2",
  "angular_rate_x_rad_s",
  "angular_rate_y_rad_s",
  "angular_rate_z_rad_s",
  "temperature_c",
  "battery_v",
  "sensor_error",
  "estimated_pose_available",
  "estimated_x_mm",
  "estimated_y_mm",
  "estimated_heading_rad",
  "ground_truth_pose_available",
  "ground_truth_x_mm",
  "ground_truth_y_mm",
  "ground_truth_heading_rad",
  "requested_forward_speed_mm_s",
  "requested_turn_rate_rad_s",
  "target_left_wheel_speed_mm_s",
  "target_right_wheel_speed_mm_s",
] as const;

const observationColumns = [
  "observation_seq",
  "observation_kind",
  "physics_step_seq",
  "course_snapshot_seq",
  "course_published_at_s",
] as const;

const timingColumns = [
  "timing_schema_version",
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
] as const;

const recordingColumns = [
  "csv_schema_version",
  "recording_dropped_observations",
] as const;

function timingValues(sample: TelemetrySample) {
  const timing = sample.timing;
  const seconds = (value: number | null | undefined) =>
    value == null ? null : value / 1000;
  return [
    timing?.version,
    timing?.clockId,
    timing?.clockBasis,
    timing?.kind,
    timing?.rawDeviceTimeMs,
    seconds(timing?.acquiredAtMs),
    timing?.acquisitionSeq,
    seconds(timing?.rangeAcquiredAtMs),
    timing?.rangeSeq,
    timing?.rangeSampled,
    seconds(timing?.diagnosticsAcquiredAtMs),
    timing?.diagnosticsSeq,
    timing?.rawLeftEncoderCount,
    timing?.rawRightEncoderCount,
    timing?.rawRangeMm,
    seconds(timing?.publishedAtMs),
    seconds(timing?.sampleDtMs),
    seconds(timing?.samplePeriodMs),
    seconds(timing?.overrunMs),
  ];
}

/** Additive metadata for exported observations; no acquisition time is inferred. */
export function telemetryRecordingMetadata(
  recording: TelemetryRecordingSnapshot,
) {
  const times = recording.samples.map((sample) => sample.tMs);
  let minimumMs = Infinity;
  let maximumMs = -Infinity;
  for (const time of times) {
    minimumMs = Math.min(minimumMs, time);
    maximumMs = Math.max(maximumMs, time);
  }
  return {
    provenanceVersion: 1,
    csvSchemaVersion: 4,
    timingSchemaVersion: 1,
    clocks: [
      ...new Set(
        recording.samples.flatMap((sample) =>
          sample.timing?.clockId ? [sample.timing.clockId] : [],
        ),
      ),
    ].map((clockId) => ({
      clockId,
      basis: "first-acquisition",
      unit: "seconds in CSV; integer milliseconds for raw device ticks",
    })),
    configuredSamplePeriodsSeconds: [
      ...new Set(
        recording.samples.flatMap((sample) =>
          sample.timing?.samplePeriodMs == null
            ? []
            : [sample.timing.samplePeriodMs / 1000],
        ),
      ),
    ],
    retainedObservations: recording.samples.length,
    retainedTimeSpanSeconds: times.length ? (maximumMs - minimumMs) / 1000 : 0,
    knownDroppedObservations: recording.droppedSamples,
    rowSemantics:
      "Each row is one retained observation; distinct updates can share a physics step and timestamp.",
    identities: {
      observation_seq:
        "Monotonic virtual observation order within the target session; replay preserves the identity.",
      observation_kind:
        "Source of the update: initial, physics, actuator, course, stop, reset, or unspecified state.",
      seq: "Legacy virtual state sequence, or physical sensor-acquisition sequence; virtual Stop may advance this without advancing physics.",
      physics_step_seq:
        "Exact virtual integration step; blank for physical or unavailable data.",
      course_snapshot_seq:
        "Course-state publication identity within this run; blank when unavailable.",
      course_published_at_s:
        "Program-clock time of course-state publication, not sensor acquisition time; blank when unavailable.",
      t_s: "Legacy display time: virtual physics time; physical course publication intervals offset from service Run preparation; stationary physical reads use service uptime. It is not a uniform row interval or a common acquisition time.",
      acquired_at_s:
        "Wrap-safe time from this clock's first encoder acquisition, preserving the raw timestamp read immediately before the encoder pair. It is independent of browser delivery and selected plots.",
      acquisition_seq:
        "Direct sensor-read identity within clock_id. Repeated virtual observations and Stop may reuse it; select unique identities for analysis of acquired sensor samples.",
      raw_device_time_ms:
        "Original opaque MicroPython ticks_ms value, preserved exactly; may wrap and must not be subtracted directly.",
      published_at_s:
        "Course/raw-state publication time in the same first-acquisition clock as acquired_at_s.",
      range_acquired_at_s:
        "Encoder timestamp bounds completion of the preceding range read; range_seq identifies that read. range_sampled says whether this acquisition requested range; empty acquired_range_mm then means no usable result.",
      diagnostics_acquired_at_s:
        "Completion timestamp of the sequential battery/IMU diagnostics group. Repeated diagnostics_seq denotes retained data, not a fresh simultaneous measurement.",
      sample_dt_s:
        "Measurements.dt_s used by the student components; empty for direct low-level reads without a SensorModel.",
      sample_period_s:
        "Configured Robot sampling period; actual intervals can differ.",
      overrun_s:
        "Measured pre-wait controller deadline overrun; blank when not measured. It is not total cycle execution time.",
    },
    lossAccounting:
      "Counts known retained-history eviction and observation-identity gaps; physical acquisition seq is the legacy fallback. Virtual physics-step gaps alone do not establish lost observations.",
    acquisitionTime:
      "A combined row has no asserted common acquisition time for all channels. Acquisition timing and acquired_* values describe the exact raw record delivered to student code; virtual truth retains t_s/physics_step_seq. Legacy missing timing stays empty.",
    wallClock:
      "Run startedAt/finishedAt are browser lifecycle dates. They are not synchronized device timestamps and include command, launch and delivery delays.",
    retention:
      "Capacity is bounded by observation count. The retained time span depends on actual publication rate; no minimum duration is guaranteed.",
  };
}

function copySample(sample: TelemetrySample): TelemetrySample {
  return {
    ...sample,
    ...(sample.timing
      ? {
          timing: {
            ...sample.timing,
            ...(sample.timing.plots
              ? { plots: sample.timing.plots.map((plot) => ({ ...plot })) }
              : {}),
            ...(sample.timing.diagnostics
              ? {
                  diagnostics: {
                    ...sample.timing.diagnostics,
                    accelerationMg: sample.timing.diagnostics.accelerationMg
                      ? [...sample.timing.diagnostics.accelerationMg]
                      : null,
                    angularRateMdps: sample.timing.diagnostics.angularRateMdps
                      ? [...sample.timing.diagnostics.angularRateMdps]
                      : null,
                  },
                }
              : {}),
          },
        }
      : {}),
    accelerationMg: sample.accelerationMg ? [...sample.accelerationMg] : null,
    angularRateMdps: sample.angularRateMdps
      ? [...sample.angularRateMdps]
      : null,
    plotValues: sample.plotValues?.map((plot) => ({ ...plot })),
  };
}

function csvValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function plotCsvHeader(plot: { name: string; unit?: string }): string {
  const unit = plot.unit
    ?.replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
  const suffix =
    unit && !plot.name.toLowerCase().endsWith(`_${unit}`) ? `_${unit}` : "";
  return `program_${plot.name}${suffix}`;
}

/** One shared mapping for CSV export and saved-trial metadata, including collisions. */
export function telemetryProgramPlotColumns(
  recording: TelemetryRecordingSnapshot,
): {
  name: string;
  label: string;
  unit?: string;
  csvColumn: string;
  unitColumn?: string;
}[] {
  const seenNames = new Map<string, string>();
  const changingUnits = new Set<string>();
  const seenColumns = new Set<string>();
  const columns: {
    name: string;
    label: string;
    unit?: string;
    csvColumn: string;
    unitColumn?: string;
  }[] = [];
  for (const sample of recording.samples)
    for (const plot of sample.plotValues ?? []) {
      if (seenNames.has(plot.name)) {
        if (seenNames.get(plot.name) !== (plot.unit ?? ""))
          changingUnits.add(plot.name);
        continue;
      }
      seenNames.set(plot.name, plot.unit ?? "");
      const base = plotCsvHeader(plot);
      let csvColumn = base,
        suffix = 2;
      while (seenColumns.has(csvColumn)) csvColumn = `${base}__${suffix++}`;
      seenColumns.add(csvColumn);
      columns.push({
        name: plot.name,
        label: plot.label,
        unit: plot.unit,
        csvColumn,
      });
    }
  for (const column of columns) {
    if (!changingUnits.has(column.name)) continue;
    const base = `${column.csvColumn}__unit`;
    let unitColumn = base,
      suffix = 2;
    while (seenColumns.has(unitColumn)) unitColumn = `${base}__${suffix++}`;
    seenColumns.add(unitColumn);
    column.unitColumn = unitColumn;
  }
  return columns;
}

export function telemetryRecordingToCsv(
  recording: TelemetryRecordingSnapshot,
): string {
  const plotColumns = telemetryProgramPlotColumns(recording);
  const rows = recording.samples.map((sample) =>
    [
      sample.source,
      sample.poseAvailable,
      sample.seq,
      sample.tMs / 1_000,
      sample.xMm,
      sample.yMm,
      sample.headingRad,
      sample.leftEffort,
      sample.rightEffort,
      sample.leftWheelSpeedMmS,
      sample.rightWheelSpeedMmS,
      sample.leftWheelDistanceMm,
      sample.rightWheelDistanceMm,
      sample.leftEncoderCount,
      sample.rightEncoderCount,
      sample.collision,
      sample.rangeMm,
      sample.buttonPressed,
      sample.accelerationMg
        ? milligravityToMetersPerSecondSquared(sample.accelerationMg[0])
        : null,
      sample.accelerationMg
        ? milligravityToMetersPerSecondSquared(sample.accelerationMg[1])
        : null,
      sample.accelerationMg
        ? milligravityToMetersPerSecondSquared(sample.accelerationMg[2])
        : null,
      sample.angularRateMdps
        ? millidegreesPerSecondToRadiansPerSecond(sample.angularRateMdps[0])
        : null,
      sample.angularRateMdps
        ? millidegreesPerSecondToRadiansPerSecond(sample.angularRateMdps[1])
        : null,
      sample.angularRateMdps
        ? millidegreesPerSecondToRadiansPerSecond(sample.angularRateMdps[2])
        : null,
      sample.temperatureC,
      sample.batteryV,
      sample.sensorError,
      sample.estimatedPoseAvailable,
      sample.estimatedXmm,
      sample.estimatedYmm,
      sample.estimatedHeadingRad,
      sample.groundTruthPoseAvailable,
      sample.groundTruthXmm,
      sample.groundTruthYmm,
      sample.groundTruthHeadingRad,
      sample.requestedForwardSpeedMmS,
      sample.requestedTurnRateRadS,
      sample.targetLeftWheelSpeedMmS,
      sample.targetRightWheelSpeedMmS,
      ...plotColumns.flatMap((column) => {
        const plot = sample.plotValues?.find(
          (plot) => plot.name === column.name,
        );
        return column.unitColumn ? [plot?.value, plot?.unit] : [plot?.value];
      }),
      sample.observationSeq,
      sample.observationKind,
      sample.physicsStepSeq,
      sample.courseSnapshotSeq,
      sample.coursePublishedAtMs === undefined
        ? undefined
        : sample.coursePublishedAtMs / 1000,
      ...timingValues(sample),
      4,
      recording.droppedSamples,
    ]
      .map(csvValue)
      .join(","),
  );
  const headers = [
    ...csvColumns,
    ...plotColumns.flatMap((plot) =>
      plot.unitColumn ? [plot.csvColumn, plot.unitColumn] : [plot.csvColumn],
    ),
    ...observationColumns,
    ...timingColumns,
    ...recordingColumns,
  ];
  return `${headers.join(",")}\n${rows.length > 0 ? `${rows.join("\n")}\n` : ""}`;
}
