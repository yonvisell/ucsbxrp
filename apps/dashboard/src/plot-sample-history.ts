import type { TelemetrySample } from "@ucsb-xrp/target";

type FrameCallback = (timestamp: number) => void;
type ScheduleFrame = (callback: FrameCallback) => number;
type CancelFrame = (frameId: number) => void;

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

  append(sample: TelemetrySample): void {
    const previous = this.latestSample;
    if (previous?.source === sample.source && previous.seq === sample.seq) {
      return;
    }
    if (
      previous &&
      (previous.source !== sample.source || sample.seq < previous.seq)
    ) {
      this.clearRetainedSamples();
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
