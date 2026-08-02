import type { TelemetrySample } from "./types";
import {
  millidegreesPerSecondToRadiansPerSecond,
  milligravityToMetersPerSecondSquared,
} from "./telemetry-units";

export interface TelemetryRecordingSnapshot {
  readonly schemaVersion: 2;
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
      schemaVersion: 2,
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
] as const;

function copySample(sample: TelemetrySample): TelemetrySample {
  return {
    ...sample,
    accelerationMg: sample.accelerationMg ? [...sample.accelerationMg] : null,
    angularRateMdps: sample.angularRateMdps
      ? [...sample.angularRateMdps]
      : null,
  };
}

function csvValue(value: string | number | boolean | null): string {
  if (value === null) {
    return "";
  }
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function telemetryRecordingToCsv(
  recording: TelemetryRecordingSnapshot,
): string {
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
    ]
      .map(csvValue)
      .join(","),
  );
  return `${csvColumns.join(",")}\n${rows.length > 0 ? `${rows.join("\n")}\n` : ""}`;
}
