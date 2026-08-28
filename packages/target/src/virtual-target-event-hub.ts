import type { TargetWorkerMessage } from "./worker-protocol";
import type { TargetWorkerRole } from "./worker-protocol";
import {
  TelemetryEventHistory,
  type TelemetryEvent,
} from "./telemetry-event-history";
import type { TargetEvent } from "./types";

export interface VirtualWorkerPort {
  postMessage(message: TargetWorkerMessage): void;
  close(): void;
}

type ConsoleEvent = Extract<TargetEvent, { type: "console" }>;

export const VIRTUAL_CONSOLE_HISTORY_LIMIT = 2_000;
export const TELEMETRY_REPLAY_BATCH_SIZE = 128;

/**
 * Broadcasts one virtual-target session to every attached app tab.
 *
 * Console records are assigned stable session IDs here, where all tabs meet.
 * Per-port delivery tracking prevents a record received live from appearing a
 * second time when that tab subsequently requests the retained session state.
 */
export class VirtualTargetEventHub {
  private readonly ports = new Set<VirtualWorkerPort>();
  private readonly roles = new Map<VirtualWorkerPort, TargetWorkerRole>();
  private readonly deliveredConsoleIds = new Map<
    VirtualWorkerPort,
    { ids: Set<string>; order: string[] }
  >();
  private readonly deliveredTelemetry = new Map<
    VirtualWorkerPort,
    WeakSet<TelemetryEvent>
  >();
  private readonly consoleHistory: ConsoleEvent[] = [];
  private readonly retainedConsoleIds = new Set<string>();
  private readonly telemetryHistory = new TelemetryEventHistory();
  private eventSequence = 0;

  attach(port: VirtualWorkerPort): void {
    this.ports.add(port);
    this.deliveredConsoleIds.set(port, { ids: new Set(), order: [] });
    this.deliveredTelemetry.set(port, new WeakSet());
  }

  setRole(port: VirtualWorkerPort, role: TargetWorkerRole): number {
    if (!this.ports.has(port)) return 0;
    this.roles.set(port, role);
    return role === "monitor" ? this.replayTelemetry(port) : 0;
  }

  detach(port: VirtualWorkerPort): void {
    this.ports.delete(port);
    this.roles.delete(port);
    this.deliveredConsoleIds.delete(port);
    this.deliveredTelemetry.delete(port);
    port.close();
  }

  get size(): number {
    return this.ports.size;
  }

  forEachPort(callback: (port: VirtualWorkerPort) => void): void {
    for (const port of this.ports) callback(port);
  }

  broadcast(rawEvent: TargetEvent): void {
    const event =
      rawEvent.type === "console"
        ? this.normalizeConsoleEvent(rawEvent)
        : rawEvent;
    if (event.type === "console") {
      if (event.eventId && this.retainedConsoleIds.has(event.eventId)) {
        return;
      }
      if (event.eventId) {
        this.retainedConsoleIds.add(event.eventId);
      }
      this.consoleHistory.push(event);
      if (this.consoleHistory.length > VIRTUAL_CONSOLE_HISTORY_LIMIT) {
        const removed = this.consoleHistory.shift();
        if (removed?.eventId) {
          this.retainedConsoleIds.delete(removed.eventId);
        }
      }
    } else if (event.type === "telemetry") {
      this.telemetryHistory.retain(event);
    }
    for (const port of this.ports) {
      this.send(port, { type: "event", event });
    }
  }

  broadcastMessage(message: TargetWorkerMessage): void {
    for (const port of this.ports) {
      this.send(port, message);
    }
  }

  send(port: VirtualWorkerPort, message: TargetWorkerMessage): void {
    if (message.type === "telemetry-batch") {
      if (this.roles.get(port) !== "monitor") return;
      const delivered = this.deliveredTelemetry.get(port);
      const pending = message.events.filter((event) => !delivered?.has(event));
      if (pending.length === 0) return;
      try {
        port.postMessage({ type: "telemetry-batch", events: pending });
        for (const event of pending) delivered?.add(event);
      } catch {
        // A closing tab must not interrupt the shared virtual session.
      }
      return;
    }
    if (message.type === "event" && message.event.type === "telemetry") {
      if (this.roles.get(port) !== "monitor") return;
      const delivered = this.deliveredTelemetry.get(port);
      if (delivered?.has(message.event)) return;
      try {
        port.postMessage(message);
        delivered?.add(message.event);
      } catch {
        // A closing tab must not interrupt the shared virtual session.
      }
      return;
    }
    if (
      message.type === "event" &&
      message.event.type === "console" &&
      message.event.eventId
    ) {
      const delivered = this.deliveredConsoleIds.get(port);
      if (delivered?.ids.has(message.event.eventId)) {
        return;
      }
      if (delivered) {
        delivered.ids.add(message.event.eventId);
        delivered.order.push(message.event.eventId);
        if (delivered.order.length > VIRTUAL_CONSOLE_HISTORY_LIMIT * 2) {
          const removed = delivered.order.shift();
          if (removed) {
            delivered.ids.delete(removed);
          }
        }
      }
    }
    try {
      port.postMessage(message);
    } catch {
      // A tab can close while a runtime event is being distributed. Other
      // attached tabs and the virtual run must continue unaffected.
    }
  }

  replayConsole(port: VirtualWorkerPort): void {
    for (const event of this.consoleHistory) {
      this.send(port, { type: "event", event });
    }
  }

  replayTelemetry(port: VirtualWorkerPort): number {
    if (this.roles.get(port) !== "monitor") return 0;
    let replayed = 0;
    let batch: TelemetryEvent[] = [];
    for (const event of this.telemetryHistory.chronological()) {
      const delivered = this.deliveredTelemetry.get(port);
      if (delivered?.has(event)) continue;
      batch.push(event);
      replayed += 1;
      if (batch.length === TELEMETRY_REPLAY_BATCH_SIZE) {
        this.send(port, { type: "telemetry-batch", events: batch });
        batch = [];
      }
    }
    if (batch.length > 0) {
      this.send(port, { type: "telemetry-batch", events: batch });
    }
    return replayed;
  }

  private normalizeConsoleEvent(event: ConsoleEvent): ConsoleEvent {
    if (event.eventId) {
      return {
        ...event,
        timestampMs: event.timestampMs ?? Date.now(),
      };
    }
    this.eventSequence += 1;
    return {
      ...event,
      eventId: `virtual-worker-${this.eventSequence}`,
      timestampMs: event.timestampMs ?? Date.now(),
    };
  }
}
