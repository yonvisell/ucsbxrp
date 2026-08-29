import type { TelemetrySample } from "@ucsb-xrp/target";

type FrameCallback = (timestamp: number) => void;
type ScheduleFrame = (callback: FrameCallback) => number;
type CancelFrame = (frameId: number) => void;

/**
 * Physical telemetry can arrive as several ordered samples in one HTTP/worker
 * batch. Present at most 100 ms of source time per visual update so those real
 * samples remain visible at roughly 10 Hz instead of collapsing to one jump.
 */
export const PHYSICAL_VISUAL_INTERVAL_MS = 100;

export interface MonitorVisualSnapshot {
  readonly sample: TelemetrySample | null;
  readonly samples: readonly TelemetrySample[];
}

/**
 * Retain one sample per source sequence for the recent-rate estimate.
 *
 * A target may publish the same simulator state again after changing an
 * effort or runtime value. Equal sequence numbers are therefore duplicate
 * observations, not a new telemetry epoch. Only a source change or a strict
 * sequence rollback begins a new epoch.
 */
export function appendTelemetryRateSample(
  samples: TelemetrySample[],
  sample: TelemetrySample,
  maximumIntervals = 40,
): void {
  if (!Number.isInteger(maximumIntervals) || maximumIntervals < 1) {
    throw new Error("maximumIntervals must be a positive integer");
  }
  const previous = samples.at(-1);
  if (previous?.source === sample.source && previous.seq === sample.seq) {
    return;
  }
  if (
    previous &&
    (previous.source !== sample.source || sample.seq < previous.seq)
  ) {
    samples.length = 0;
  }
  samples.push(sample);
  const maximumSamples = maximumIntervals + 1;
  if (samples.length > maximumSamples) {
    samples.splice(0, samples.length - maximumSamples);
  }
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
  private latestReceivedSample: TelemetrySample | null = null;
  private latestPresentedSample: TelemetrySample | null = null;
  private latestHistorySample: TelemetrySample | null = null;
  private readonly pendingPhysicalSamples: TelemetrySample[] = [];
  private nextPhysicalPublicationAtMs: number | null = null;
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
    this.latestReceivedSample = sample;
    this.dirty = true;

    if (!retainInHistory) {
      this.resetPhysicalPresentation();
      this.latestPresentedSample = sample;
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
    if (sample.source === "physical") {
      if (!previous || restarted) {
        this.resetPhysicalPresentation();
        this.latestPresentedSample = null;
      }
      this.pendingPhysicalSamples.push(sample);
    } else {
      this.resetPhysicalPresentation();
      this.latestPresentedSample = sample;
    }

    this.schedulePublication();
    return restarted;
  }

  snapshot(): MonitorVisualSnapshot {
    const sample = this.latestPresentedSample ?? this.latestReceivedSample;
    return {
      sample,
      samples: this.historySnapshotThrough(sample),
    };
  }

  setActive(active: boolean): void {
    if (this.active === active) return;
    this.active = active;
    if (!active) {
      this.cancelPendingFrame();
      return;
    }
    // A hidden Monitor keeps every bounded sample but does not replay a long
    // visual queue when shown again. Resume from the newest real observation.
    this.resetPhysicalPresentation();
    this.latestPresentedSample = this.latestReceivedSample;
    this.dirty = true;
    this.schedulePublication();
  }

  clearHistory(publish = true): void {
    this.cancelPendingFrame();
    this.clearRetainedSamples();
    this.latestPresentedSample = this.latestReceivedSample;
    this.dirty = publish;
    if (publish) this.publishImmediately();
  }

  clearAll(publish = true): void {
    this.latestReceivedSample = null;
    this.latestPresentedSample = null;
    this.clearHistory(publish);
  }

  private historySnapshot(): TelemetrySample[] {
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

  private historySnapshotThrough(
    sample: TelemetrySample | null,
  ): readonly TelemetrySample[] {
    const history = this.historySnapshot();
    if (!sample) return history;
    for (let index = history.length - 1; index >= 0; index -= 1) {
      const candidate = history[index]!;
      if (
        candidate.source === sample.source &&
        candidate.seq === sample.seq &&
        candidate.tMs === sample.tMs
      ) {
        return history.slice(0, index + 1);
      }
    }
    return history;
  }

  private schedulePublication(): void {
    if (!this.active || !this.dirty || this.pendingFrame !== null) return;
    this.pendingFrame = this.scheduleFrame((timestamp) => {
      this.pendingFrame = null;
      if (!this.active || !this.dirty) return;
      if (this.advancePresentation(timestamp)) {
        this.publish(this.snapshot());
      }
      this.schedulePublication();
    });
  }

  /**
   * Advance only through received samples. The source-time bound spreads a
   * transport burst over successive display frames without interpolation,
   * downsampling, or delaying the recorder that consumes samples upstream.
   */
  private advancePresentation(timestamp: number): boolean {
    if (this.pendingPhysicalSamples.length === 0) {
      this.latestPresentedSample = this.latestReceivedSample;
      this.dirty = false;
      this.nextPhysicalPublicationAtMs = null;
      return true;
    }
    if (
      this.nextPhysicalPublicationAtMs !== null &&
      timestamp < this.nextPhysicalPublicationAtMs
    ) {
      return false;
    }

    const previous = this.latestPresentedSample;
    let presentedIndex = 0;
    if (previous?.source === "physical") {
      const latestSourceTime = previous.tMs + PHYSICAL_VISUAL_INTERVAL_MS;
      for (
        let index = 1;
        index < this.pendingPhysicalSamples.length;
        index += 1
      ) {
        if (this.pendingPhysicalSamples[index]!.tMs > latestSourceTime) break;
        presentedIndex = index;
      }
    }
    this.latestPresentedSample = this.pendingPhysicalSamples[presentedIndex]!;
    this.pendingPhysicalSamples.splice(0, presentedIndex + 1);
    this.nextPhysicalPublicationAtMs = timestamp + PHYSICAL_VISUAL_INTERVAL_MS;
    this.dirty = this.pendingPhysicalSamples.length > 0;
    return true;
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
    this.resetPhysicalPresentation();
  }

  private resetPhysicalPresentation(): void {
    this.pendingPhysicalSamples.length = 0;
    this.nextPhysicalPublicationAtMs = null;
  }
}
