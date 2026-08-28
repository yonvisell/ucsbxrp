import { describe, expect, it } from "vitest";

import {
  TELEMETRY_REPLAY_BATCH_SIZE,
  VIRTUAL_CONSOLE_HISTORY_LIMIT,
  VirtualTargetEventHub,
  type VirtualWorkerPort,
} from "./virtual-target-event-hub";
import type { TargetWorkerMessage } from "./worker-protocol";
import { TARGET_TELEMETRY_HISTORY_LIMIT } from "./telemetry-event-history";
import type { TargetEvent, TelemetrySample } from "./types";

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

function targetEvents(port: FakePort): TargetEvent[] {
  return port.messages.flatMap((message) => {
    if (message.type === "event") return [message.event];
    if (message.type === "telemetry-batch") return [...message.events];
    return [];
  });
}

function consoleEvents(port: FakePort) {
  return targetEvents(port).filter((event) => event.type === "console");
}

function telemetryEvents(port: FakePort) {
  return targetEvents(port).filter((event) => event.type === "telemetry");
}

function sample(seq: number): TelemetrySample {
  return {
    tMs: seq * 20,
    seq,
    source: "virtual",
    poseAvailable: true,
    xMm: seq,
    yMm: 0,
    headingRad: 0,
    leftEffort: 0,
    rightEffort: 0,
    leftWheelSpeedMmS: 0,
    rightWheelSpeedMmS: 0,
    leftEncoderCount: seq,
    rightEncoderCount: seq,
    collision: false,
    rangeMm: null,
    buttonPressed: false,
    accelerationMg: null,
    angularRateMdps: null,
    temperatureC: null,
    batteryV: null,
    sensorError: null,
  };
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

  it("replays retained telemetry chronologically without duplicating live samples", () => {
    const hub = new VirtualTargetEventHub();
    const ide = new FakePort();
    hub.attach(ide);
    for (const seq of [1, 2, 3]) {
      hub.broadcast({ type: "telemetry", sample: sample(seq) });
    }

    const monitor = new FakePort();
    hub.attach(monitor);
    hub.setRole(monitor, "monitor");
    expect(telemetryEvents(monitor)).toHaveLength(0);
    expect(hub.replayTelemetry(monitor)).toBe(3);
    expect(telemetryEvents(monitor).map((event) => event.sample.seq)).toEqual([
      1, 2, 3,
    ]);
    hub.broadcast({ type: "telemetry", sample: sample(4) });
    expect(hub.replayTelemetry(monitor)).toBe(0);
    hub.broadcast({ type: "telemetry", sample: sample(5) });
    expect(hub.replayTelemetry(monitor)).toBe(0);

    expect(telemetryEvents(monitor).map((event) => event.sample.seq)).toEqual([
      1, 2, 3, 4, 5,
    ]);
  });

  it("sends telemetry only to Monitor while preserving shared status and console events", () => {
    const hub = new VirtualTargetEventHub();
    const ide = new FakePort();
    const monitor = new FakePort();
    hub.attach(ide);
    hub.attach(monitor);
    hub.setRole(ide, "ide");
    hub.setRole(monitor, "monitor");

    hub.broadcast({ type: "telemetry", sample: sample(1) });
    hub.broadcast({ type: "console", stream: "system", line: "running" });
    hub.broadcast({ type: "status", state: "running", detail: "Running" });

    expect(telemetryEvents(ide)).toHaveLength(0);
    expect(telemetryEvents(monitor).map((event) => event.sample.seq)).toEqual([
      1,
    ]);
    expect(consoleEvents(ide).at(-1)?.line).toBe("running");
    expect(targetEvents(ide).at(-1)).toMatchObject({
      type: "status",
      state: "running",
    });
  });

  it("replays 10,000 samples in bounded batches with exact order", () => {
    const hub = new VirtualTargetEventHub();
    for (let seq = 1; seq <= TARGET_TELEMETRY_HISTORY_LIMIT; seq += 1) {
      hub.broadcast({ type: "telemetry", sample: sample(seq) });
    }

    const monitor = new FakePort();
    hub.attach(monitor);
    hub.setRole(monitor, "monitor");
    expect(hub.replayTelemetry(monitor)).toBe(TARGET_TELEMETRY_HISTORY_LIMIT);

    const batches = monitor.messages.filter(
      (message) => message.type === "telemetry-batch",
    );
    expect(batches).toHaveLength(
      Math.ceil(TARGET_TELEMETRY_HISTORY_LIMIT / TELEMETRY_REPLAY_BATCH_SIZE),
    );
    expect(
      batches.every(
        (message) => message.events.length <= TELEMETRY_REPLAY_BATCH_SIZE,
      ),
    ).toBe(true);
    expect(telemetryEvents(monitor).map((event) => event.sample.seq)).toEqual(
      Array.from(
        { length: TARGET_TELEMETRY_HISTORY_LIMIT },
        (_, index) => index + 1,
      ),
    );
  });
});
