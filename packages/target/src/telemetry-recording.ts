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
    this.active = false;
  }

  capture(sample: TelemetrySample): void {
    if (!this.active) {
      return;
    }
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

function copySample(sample: TelemetrySample): TelemetrySample {
  return {
    ...sample,
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

export function telemetryRecordingToCsv(
  recording: TelemetryRecordingSnapshot,
): string {
  const plots = new Map<string, { name: string; unit?: string }>();
  for (const sample of recording.samples) {
    for (const plot of sample.plotValues ?? []) {
      if (!plots.has(plot.name)) {
        plots.set(plot.name, { name: plot.name, unit: plot.unit });
      }
    }
  }
  const plotColumns = [...plots.values()];
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
      ...plotColumns.map(
        (column) =>
          sample.plotValues?.find((plot) => plot.name === column.name)?.value,
      ),
    ]
      .map(csvValue)
      .join(","),
  );
  const headers = [...csvColumns, ...plotColumns.map(plotCsvHeader)];
  return `${headers.join(",")}\n${rows.length > 0 ? `${rows.join("\n")}\n` : ""}`;
}
