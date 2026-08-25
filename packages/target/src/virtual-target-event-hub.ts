import type { TargetWorkerMessage } from "./worker-protocol";
import type { TargetEvent } from "./types";

export interface VirtualWorkerPort {
  postMessage(message: TargetWorkerMessage): void;
  close(): void;
}

type ConsoleEvent = Extract<TargetEvent, { type: "console" }>;

export const VIRTUAL_CONSOLE_HISTORY_LIMIT = 2_000;

/**
 * Broadcasts one virtual-target session to every attached app tab.
 *
 * Console records are assigned stable session IDs here, where all tabs meet.
 * Per-port delivery tracking prevents a record received live from appearing a
 * second time when that tab subsequently requests the retained session state.
 */
export class VirtualTargetEventHub {
  private readonly ports = new Set<VirtualWorkerPort>();
  private readonly deliveredConsoleIds = new Map<
    VirtualWorkerPort,
    { ids: Set<string>; order: string[] }
  >();
  private readonly consoleHistory: ConsoleEvent[] = [];
  private readonly retainedConsoleIds = new Set<string>();
  private eventSequence = 0;

  attach(port: VirtualWorkerPort): void {
    this.ports.add(port);
    this.deliveredConsoleIds.set(port, { ids: new Set(), order: [] });
  }

  detach(port: VirtualWorkerPort): void {
    this.ports.delete(port);
    this.deliveredConsoleIds.delete(port);
    port.close();
  }

  get size(): number {
    return this.ports.size;
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
