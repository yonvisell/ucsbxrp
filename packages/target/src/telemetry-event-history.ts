import type { TargetEvent } from "./types";

export type TelemetryEvent = Extract<TargetEvent, { type: "telemetry" }>;

/**
 * The ring retains 10,000 observations. Multiple virtual state updates can
 * share a physics tick; elapsed history depends on actual publication rate.
 */
export const TARGET_TELEMETRY_HISTORY_LIMIT = 10_000;

/** A fixed-capacity ring that yields retained telemetry in arrival order. */
export class TelemetryEventHistory {
  private readonly events: TelemetryEvent[] = [];
  private nextWriteIndex = 0;
  private discarded = 0;

  constructor(readonly maximumEvents = TARGET_TELEMETRY_HISTORY_LIMIT) {
    if (!Number.isInteger(maximumEvents) || maximumEvents < 1) {
      throw new Error("maximumEvents must be a positive integer");
    }
  }

  get size(): number {
    return this.events.length;
  }

  get discardedCount(): number {
    return this.discarded;
  }

  clear(): void {
    this.events.length = 0;
    this.nextWriteIndex = 0;
    this.discarded = 0;
  }

  retain(event: TelemetryEvent): void {
    if (this.events.length < this.maximumEvents) {
      this.events.push(event);
      return;
    }
    this.events[this.nextWriteIndex] = event;
    this.nextWriteIndex = (this.nextWriteIndex + 1) % this.maximumEvents;
    this.discarded += 1;
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
