import type { TelemetrySample } from "@ucsb-xrp/target";

type FrameCallback = (timestamp: number) => void;
type ScheduleFrame = (callback: FrameCallback) => number;
type CancelFrame = (frameId: number) => void;

/** Estimate the source sample rate from recent device timestamps. */
export function recentTelemetryRateHz(
  samples: readonly TelemetrySample[],
  maximumIntervals = 40,
): number | null {
  if (!Number.isInteger(maximumIntervals) || maximumIntervals < 1) {
    throw new Error("maximumIntervals must be a positive integer");
  }
  const recent = samples.slice(-(maximumIntervals + 1));
  const periodsMs: number[] = [];
  for (let index = 1; index < recent.length; index += 1) {
    const previous = recent[index - 1]!;
    const current = recent[index]!;
    const sequenceSteps = current.seq - previous.seq;
    const elapsedMs = current.tMs - previous.tMs;
    if (
      current.source !== previous.source ||
      sequenceSteps <= 0 ||
      elapsedMs <= 0
    ) {
      continue;
    }
    const periodMs = elapsedMs / sequenceSteps;
    if (Number.isFinite(periodMs) && periodMs > 0) periodsMs.push(periodMs);
  }
  if (periodsMs.length === 0) return null;
  periodsMs.sort((left, right) => left - right);
  const middle = Math.floor(periodsMs.length / 2);
  const medianPeriodMs =
    periodsMs.length % 2 === 0
      ? (periodsMs[middle - 1]! + periodsMs[middle]!) / 2
      : periodsMs[middle]!;
  return 1_000 / medianPeriodMs;
}

/**
 * Retains the newest telemetry samples without moving the retained array for
 * every sample. React receives at most one ordered snapshot per display frame.
 */
export class PlotSampleHistory {
  private readonly samples: TelemetrySample[] = [];
  private nextWriteIndex = 0;
  private latestSample: TelemetrySample | null = null;
  private pendingFrame: number | null = null;

  constructor(
    readonly maximumSamples: number,
    private readonly publish: (samples: readonly TelemetrySample[]) => void,
    private readonly scheduleFrame: ScheduleFrame,
    private readonly cancelFrame: CancelFrame,
  ) {
    if (!Number.isInteger(maximumSamples) || maximumSamples < 1) {
      throw new Error("maximumSamples must be a positive integer");
    }
  }

  append(sample: TelemetrySample): boolean {
    const previous = this.latestSample;
    if (previous?.source === sample.source && previous.seq === sample.seq) {
      return false;
    }
    let restarted = false;
    if (
      previous &&
      (previous.source !== sample.source || sample.seq < previous.seq)
    ) {
      this.clearRetainedSamples();
      restarted = true;
    }

    if (this.samples.length < this.maximumSamples) {
      this.samples.push(sample);
    } else {
      this.samples[this.nextWriteIndex] = sample;
      this.nextWriteIndex = (this.nextWriteIndex + 1) % this.maximumSamples;
    }
    this.latestSample = sample;

    if (this.pendingFrame === null) {
      this.pendingFrame = this.scheduleFrame(() => {
        this.pendingFrame = null;
        this.publish(this.snapshot());
      });
    }
    return restarted;
  }

  snapshot(): readonly TelemetrySample[] {
    if (
      this.samples.length < this.maximumSamples ||
      this.nextWriteIndex === 0
    ) {
      return [...this.samples];
    }
    return [
      ...this.samples.slice(this.nextWriteIndex),
      ...this.samples.slice(0, this.nextWriteIndex),
    ];
  }

  clear(publish = true): void {
    if (this.pendingFrame !== null) {
      this.cancelFrame(this.pendingFrame);
      this.pendingFrame = null;
    }
    this.clearRetainedSamples();
    if (publish) this.publish([]);
  }

  private clearRetainedSamples(): void {
    this.samples.length = 0;
    this.nextWriteIndex = 0;
    this.latestSample = null;
  }
}
