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
  it("keeps a completed run frozen while reset and later status remain live", () => {
    const hub = new VirtualTargetEventHub();
    const finalSample = { type: "telemetry" as const, sample: sample(50) };
    hub.broadcast({
      type: "run",
      phase: "begin",
      runId: "completed",
      startedAtMs: 1,
      state: "running",
      detail: "Running",
    });
    hub.broadcast(finalSample);
    hub.broadcast({
      type: "run",
      phase: "end",
      runId: "completed",
      startedAtMs: 1,
      finishedAtMs: 2,
      state: "error",
      detail: "Original program exception",
    });
    hub.broadcast({
      type: "console",
      stream: "system",
      action: "reset",
      phase: "result",
      line: "Reset",
    });
    const reset = {
      type: "telemetry" as const,
      sample: { ...sample(0), observationKind: "reset" as const },
    };
    hub.broadcast(reset);
    hub.broadcast({
      type: "status",
      state: "loading",
      detail: "Checking a different project",
    });
    hub.broadcast({ type: "status", state: "ready", detail: "Reset complete" });
    const monitor = new FakePort();
    hub.attach(monitor);
    hub.setRole(monitor, "monitor");
    hub.replayCurrentState(
      monitor,
      { type: "status", state: "ready", detail: "Reset complete" },
      reset,
    );
    const received = targetEvents(monitor);
    const end = received.findIndex(
      (event) => event.type === "run-history" && event.phase === "end",
    );
    expect(received[end]).toMatchObject({
      runId: "completed",
      state: "error",
      detail: "Original program exception",
      finishedAtMs: 2,
      retainedTelemetryDropped: 0,
    });
    expect(
      received.slice(0, end).filter((event) => event.type === "telemetry"),
    ).toEqual([finalSample]);
    expect(
      received.slice(end + 1).filter((event) => event.type === "telemetry"),
    ).toEqual([reset]);
  });

  it("keeps the idle fallback outside an empty completed run", () => {
    const hub = new VirtualTargetEventHub();
    hub.broadcast({
      type: "run",
      phase: "begin",
      runId: "empty",
      startedAtMs: 1,
      state: "running",
      detail: "Running",
    });
    hub.broadcast({
      type: "run",
      phase: "end",
      runId: "empty",
      startedAtMs: 1,
      finishedAtMs: 2,
      state: "ready",
      detail: "Stopped",
    });
    const monitor = new FakePort();
    hub.attach(monitor);
    hub.setRole(monitor, "monitor");
    const idle = { type: "telemetry" as const, sample: sample(0) };
    hub.replayCurrentState(
      monitor,
      { type: "status", state: "ready", detail: "Idle" },
      idle,
    );
    const received = targetEvents(monitor);
    const end = received.findIndex(
      (event) => event.type === "run-history" && event.phase === "end",
    );
    expect(
      received.slice(0, end).some((event) => event.type === "telemetry"),
    ).toBe(false);
    expect(received.slice(end + 1)).toEqual([idle]);
  });

  it("preserves same-step observation identities and reports prefix eviction only in late replay", () => {
    const hub = new VirtualTargetEventHub();
    const live = new FakePort();
    hub.attach(live);
    hub.setRole(live, "monitor");
    hub.broadcast({
      type: "run",
      phase: "begin",
      runId: "observations",
      startedAtMs: 1,
      state: "running",
      detail: "Running",
    });
    for (
      let observationSeq = 0;
      observationSeq < TARGET_TELEMETRY_HISTORY_LIMIT + 3;
      observationSeq++
    ) {
      hub.broadcast({
        type: "telemetry",
        sample: {
          ...sample(7),
          observationSeq,
          physicsStepSeq: 7,
          observationKind: "actuator",
          leftEffort: observationSeq % 2 ? 0.1 : 0.2,
        },
      });
    }
    hub.broadcast({
      type: "run",
      phase: "end",
      runId: "observations",
      startedAtMs: 1,
      finishedAtMs: 2,
      state: "ready",
      detail: "Stopped",
    });
    expect(telemetryEvents(live)).toHaveLength(
      TARGET_TELEMETRY_HISTORY_LIMIT + 3,
    );
    expect(
      targetEvents(live)
        .filter((event) => event.type === "run")
        .at(-1),
    ).not.toHaveProperty("retainedTelemetryDropped");
    const late = new FakePort();
    hub.attach(late);
    hub.setRole(late, "monitor");
    hub.replayCurrentState(
      late,
      { type: "status", state: "ready", detail: "Stopped" },
      telemetryEvents(live).at(-1)!,
    );
    const replay = telemetryEvents(late);
    expect(replay).toHaveLength(TARGET_TELEMETRY_HISTORY_LIMIT);
    expect(replay[0]).toMatchObject({
      sample: { seq: 7, observationSeq: 3, physicsStepSeq: 7, leftEffort: 0.1 },
    });
    expect(replay[1]).toMatchObject({
      sample: { seq: 7, observationSeq: 4, leftEffort: 0.2 },
    });
    expect(targetEvents(late).at(-1)).toMatchObject({
      type: "run-history",
      phase: "end",
      retainedTelemetryDropped: 3,
    });
    hub.replayTelemetry(late);
    expect(telemetryEvents(late)).toHaveLength(TARGET_TELEMETRY_HISTORY_LIMIT);
    hub.broadcast({
      type: "run",
      phase: "begin",
      runId: "next-observations",
      startedAtMs: 3,
      state: "running",
      detail: "Next run",
    });
    hub.broadcast({ type: "telemetry", sample: sample(1) });
    const next = new FakePort();
    hub.attach(next);
    hub.setRole(next, "monitor");
    hub.replayCurrentState(
      next,
      { type: "status", state: "running", detail: "Next run" },
      { type: "telemetry", sample: sample(0) },
    );
    expect(telemetryEvents(next)).toEqual([
      { type: "telemetry", sample: sample(1) },
    ]);
    expect(targetEvents(next).at(-1)).toMatchObject({
      runId: "next-observations",
      retainedTelemetryDropped: 0,
    });
  });

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

  it("envelopes retained Run history and marks its console records historical", () => {
    const hub = new VirtualTargetEventHub();
    hub.broadcast({
      type: "console",
      stream: "system",
      line: "Starting project",
      action: "run",
      phase: "request",
      requestId: "run-1",
    });

    hub.broadcast({ type: "telemetry", sample: sample(1) });
    hub.broadcast({
      type: "console",
      stream: "system",
      line: "Program completed",
      action: "run",
      phase: "result",
      requestId: "run-1",
    });
    hub.broadcast({
      type: "status",
      state: "ready",
      detail: "Program completed",
    });

    const monitor = new FakePort();
    hub.attach(monitor);
    hub.setRole(monitor, "monitor");
    hub.replayCurrentState(
      monitor,
      { type: "status", state: "ready", detail: "Program completed" },
      { type: "telemetry", sample: sample(2) },
    );

    const replay = targetEvents(monitor);
    expect(replay[0]).toMatchObject({
      type: "run-history",
      phase: "begin",
      runId: "run-1",
      state: "ready",
    });
    expect(replay[1]).toMatchObject({ type: "status", state: "ready" });
    expect(
      replay.filter((event) => event.type === "run-history").at(-1),
    ).toMatchObject({
      type: "run-history",
      phase: "end",
      runId: "run-1",
    });
    expect(telemetryEvents(monitor).map((event) => event.sample.seq)).toEqual([
      1, 2,
    ]);
    expect(consoleEvents(monitor)).toEqual([
      expect.objectContaining({ requestId: "run-1", replayed: true }),
      expect.objectContaining({ requestId: "run-1", replayed: true }),
    ]);
  });
});
