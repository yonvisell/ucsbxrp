import type { TargetEvent } from "./types";

export type TelemetryEvent = Extract<TargetEvent, { type: "telemetry" }>;

/**
 * The virtual XRP publishes at 50 Hz, so 10,000 samples retain 200 seconds.
 * Physical telemetry currently arrives more slowly; the common bound leaves
 * at least the same three-minute margin for rates up to 50 Hz.
 */
export const TARGET_TELEMETRY_HISTORY_LIMIT = 10_000;

/** A fixed-capacity ring that yields retained telemetry in arrival order. */
export class TelemetryEventHistory {
  private readonly events: TelemetryEvent[] = [];
  private nextWriteIndex = 0;

  constructor(readonly maximumEvents = TARGET_TELEMETRY_HISTORY_LIMIT) {
    if (!Number.isInteger(maximumEvents) || maximumEvents < 1) {
      throw new Error("maximumEvents must be a positive integer");
    }
  }

  get size(): number {
    return this.events.length;
  }

  clear(): void {
    this.events.length = 0;
    this.nextWriteIndex = 0;
  }

  retain(event: TelemetryEvent): void {
    if (this.events.length < this.maximumEvents) {
      this.events.push(event);
      return;
    }
    this.events[this.nextWriteIndex] = event;
    this.nextWriteIndex = (this.nextWriteIndex + 1) % this.maximumEvents;
  }

  *chronological(): IterableIterator<TelemetryEvent> {
    if (this.events.length < this.maximumEvents) {
      yield* this.events;
      return;
    }
    for (let offset = 0; offset < this.events.length; offset += 1) {
      const event =
        this.events[(this.nextWriteIndex + offset) % this.events.length];
      if (event) yield event;
    }
  }
}
