import { describe, expect, it } from "vitest";

import {
  VIRTUAL_CONSOLE_HISTORY_LIMIT,
  VirtualTargetEventHub,
  type VirtualWorkerPort,
} from "./virtual-target-event-hub";
import type { TargetWorkerMessage } from "./worker-protocol";

class FakePort implements VirtualWorkerPort {
  readonly messages: TargetWorkerMessage[] = [];
  closed = false;

  postMessage(message: TargetWorkerMessage): void {
    this.messages.push(message);
  }

  close(): void {
    this.closed = true;
  }
}

function consoleEvents(port: FakePort) {
  return port.messages
    .filter((message) => message.type === "event")
    .map((message) => message.event)
    .filter((event) => event.type === "console");
}

describe("virtual target event hub", () => {
  it("assigns stable metadata and replays a live record only once", () => {
    const hub = new VirtualTargetEventHub();
    const ide = new FakePort();
    const monitor = new FakePort();
    hub.attach(ide);
    hub.attach(monitor);

    hub.broadcast({
      type: "console",
      stream: "stdout",
      line: "one record",
    });
    hub.replayConsole(monitor);

    expect(consoleEvents(ide)).toEqual([
      expect.objectContaining({
        line: "one record",
        eventId: "virtual-worker-1",
        timestampMs: expect.any(Number),
      }),
    ]);
    expect(consoleEvents(monitor)).toHaveLength(1);
  });

  it("retains the newest 2,000 records and ignores repeated event IDs", () => {
    const hub = new VirtualTargetEventHub();
    const ide = new FakePort();
    hub.attach(ide);

    for (let index = 0; index < VIRTUAL_CONSOLE_HISTORY_LIMIT + 5; index += 1) {
      hub.broadcast({
        type: "console",
        stream: "system",
        line: `record ${index}`,
      });
    }
    hub.broadcast({
      type: "console",
      stream: "system",
      line: "original",
      eventId: "known-event",
    });
    hub.broadcast({
      type: "console",
      stream: "system",
      line: "duplicate",
      eventId: "known-event",
    });

    const lateTab = new FakePort();
    hub.attach(lateTab);
    hub.replayConsole(lateTab);
    const replay = consoleEvents(lateTab);

    expect(replay).toHaveLength(VIRTUAL_CONSOLE_HISTORY_LIMIT);
    expect(replay[0]?.line).toBe("record 6");
    expect(replay.at(-1)?.line).toBe("original");
    expect(
      replay.filter((event) => event.eventId === "known-event"),
    ).toHaveLength(1);
  });

  it("continues delivering when one tab closes or rejects a message", () => {
    const hub = new VirtualTargetEventHub();
    const closed = new FakePort();
    const active = new FakePort();
    hub.attach(closed);
    hub.attach(active);
    closed.postMessage = () => {
      throw new Error("tab closed");
    };

    expect(() =>
      hub.broadcast({
        type: "console",
        stream: "system",
        line: "still delivered",
      }),
    ).not.toThrow();
    expect(consoleEvents(active).at(-1)?.line).toBe("still delivered");

    hub.detach(active);
    expect(active.closed).toBe(true);
    expect(hub.size).toBe(1);
  });
});
