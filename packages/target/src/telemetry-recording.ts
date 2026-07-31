import type { TelemetrySample } from "./types";

export interface TelemetryRecordingSnapshot {
  readonly schemaVersion: 1;
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
    const copy = { ...sample };
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
      schemaVersion: 1,
      samples: orderedSamples.map((sample) => ({ ...sample })),
      droppedSamples: this.droppedSamples,
    };
  }
}

const csvColumns = [
  "seq",
  "t_ms",
  "x_mm",
  "y_mm",
  "heading_rad",
  "left_effort",
  "right_effort",
  "left_wheel_speed_mm_s",
  "right_wheel_speed_mm_s",
  "left_encoder_count",
  "right_encoder_count",
  "collision",
] as const;

export function telemetryRecordingToCsv(
  recording: TelemetryRecordingSnapshot,
): string {
  const rows = recording.samples.map((sample) =>
    [
      sample.seq,
      sample.tMs,
      sample.xMm,
      sample.yMm,
      sample.headingRad,
      sample.leftEffort,
      sample.rightEffort,
      sample.leftWheelSpeedMmS,
      sample.rightWheelSpeedMmS,
      sample.leftEncoderCount,
      sample.rightEncoderCount,
      sample.collision ? 1 : 0,
    ].join(","),
  );
  return `${csvColumns.join(",")}\n${rows.length > 0 ? `${rows.join("\n")}\n` : ""}`;
}
