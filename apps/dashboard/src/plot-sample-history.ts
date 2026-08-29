import type { TelemetrySample } from "@ucsb-xrp/target";

type FrameCallback = (timestamp: number) => void;
type ScheduleFrame = (callback: FrameCallback) => number;
type CancelFrame = (frameId: number) => void;

export interface MonitorVisualSnapshot {
  readonly sample: TelemetrySample | null;
  readonly samples: readonly TelemetrySample[];
}

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
export class MonitorVisualHistory {
  private readonly samples: TelemetrySample[] = [];
  private nextWriteIndex = 0;
  private latestSample: TelemetrySample | null = null;
  private latestHistorySample: TelemetrySample | null = null;
  private pendingFrame: number | null = null;
  private active = true;
  private dirty = false;

  constructor(
    readonly maximumSamples: number,
    private readonly publish: (snapshot: MonitorVisualSnapshot) => void,
    private readonly scheduleFrame: ScheduleFrame,
    private readonly cancelFrame: CancelFrame,
  ) {
    if (!Number.isInteger(maximumSamples) || maximumSamples < 1) {
      throw new Error("maximumSamples must be a positive integer");
    }
  }

  append(sample: TelemetrySample, retainInHistory: boolean): boolean {
    this.latestSample = sample;
    this.dirty = true;

    if (!retainInHistory) {
      this.schedulePublication();
      return false;
    }

    const previous = this.latestHistorySample;
    if (previous?.source === sample.source && previous.seq === sample.seq) {
      this.schedulePublication();
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
    this.latestHistorySample = sample;

    this.schedulePublication();
    return restarted;
  }

  snapshot(): MonitorVisualSnapshot {
    return {
      sample: this.latestSample,
      samples: this.historySnapshot(),
    };
  }

  setActive(active: boolean): void {
    if (this.active === active) return;
    this.active = active;
    if (!active) {
      this.cancelPendingFrame();
      return;
    }
    this.schedulePublication();
  }

  clearHistory(publish = true): void {
    this.cancelPendingFrame();
    this.clearRetainedSamples();
    this.dirty = publish;
    if (publish) this.publishImmediately();
  }

  clearAll(publish = true): void {
    this.latestSample = null;
    this.clearHistory(publish);
  }

  private historySnapshot(): readonly TelemetrySample[] {
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

  private schedulePublication(): void {
    if (!this.active || !this.dirty || this.pendingFrame !== null) return;
    this.pendingFrame = this.scheduleFrame(() => {
      this.pendingFrame = null;
      if (!this.active || !this.dirty) return;
      this.dirty = false;
      this.publish(this.snapshot());
    });
  }

  private publishImmediately(): void {
    if (!this.active || !this.dirty) return;
    this.cancelPendingFrame();
    this.dirty = false;
    this.publish(this.snapshot());
  }

  private cancelPendingFrame(): void {
    if (this.pendingFrame !== null) {
      this.cancelFrame(this.pendingFrame);
      this.pendingFrame = null;
    }
  }

  private clearRetainedSamples(): void {
    this.samples.length = 0;
    this.nextWriteIndex = 0;
    this.latestHistorySample = null;
  }
}
