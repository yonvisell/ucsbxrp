import { describe, expect, it, vi } from "vitest";

import { PhysicalTargetCoordinator } from "./physical-target-coordinator";
import type {
  PhysicalWorkerCommand,
  PhysicalWorkerMessage,
} from "./physical-worker-protocol";
import type {
  CheckResult,
  CourseProject,
  ProjectRevisionNotice,
  RuntimeParameterValue,
  TargetClient,
  TargetEvent,
  TelemetrySample,
} from "./types";

const project: CourseProject = {
  name: "Shared project",
  entrypoint: "main.py",
  files: { "main.py": "print('shared')\n" },
};

class FakePort {
  readonly messages: PhysicalWorkerMessage[] = [];
  closed = false;

  postMessage(message: PhysicalWorkerMessage): void {
    this.messages.push(message);
  }

  close(): void {
    this.closed = true;
  }
}

class FakePhysicalTarget implements TargetClient {
  readonly kind = "physical" as const;
  readonly listeners = new Set<(event: TargetEvent) => void>();
  connectError: Error | null = null;
  connectCalls = 0;
  disconnectCalls = 0;
  runCalls = 0;
  readonly runProjects: CourseProject[] = [];
  stopCalls = 0;
  resetCalls = 0;
  running = false;
  nextRunError: Error | null = null;

  constructor(readonly endpoint: string) {}

  async connect(): Promise<void> {
    this.connectCalls += 1;
    this.emit({
      type: "status",
      state: "connecting",
      detail: `Connecting to ${this.endpoint}`,
    });
    if (this.connectError) {
      this.emit({
        type: "status",
        state: "error",
        detail: this.connectError.message,
      });
      throw this.connectError;
    }
    this.emit({
      type: "console",
      stream: "system",
      line: `Connected to ${this.endpoint}`,
      eventId: `${this.endpoint}:connected`,
      timestampMs: 1,
    });
    this.emit({
      type: "project",
      project: {
        name: project.name!,
        entrypoint: project.entrypoint,
        revision: "revision-a",
        stale: false,
      },
    });
    this.emit({ type: "status", state: "ready", detail: this.endpoint });
  }

  disconnect(): void {
    this.disconnectCalls += 1;
  }

  async check(): Promise<CheckResult> {
    return { ok: true, detail: "checked" };
  }

  async synchronize(): Promise<void> {}

  async run(projectToRun: CourseProject): Promise<void> {
    this.runProjects.push(projectToRun);
    await this.runCurrent();
  }

  async runCurrent(): Promise<void> {
    if (this.nextRunError) {
      const error = this.nextRunError;
      this.nextRunError = null;
      throw error;
    }
    if (this.running) {
      return;
    }
    this.running = true;
    this.runCalls += 1;
    this.emit({ type: "status", state: "loading", detail: "Starting main.py" });
    await Promise.resolve();
    this.emit({ type: "status", state: "running", detail: "Running main.py" });
  }

  complete(): void {
    this.running = false;
    this.emit({
      type: "console",
      stream: "stdout",
      line: "finished",
      eventId: `${this.endpoint}:run:${this.runCalls}:output`,
      timestampMs: 2 + this.runCalls,
    });
    this.emit({ type: "status", state: "ready", detail: "Program completed" });
  }

  async markProjectStale(): Promise<void> {}

  setProjectRunProvider(): void {}

  markProjectChanged(projectRevision: ProjectRevisionNotice): void {
    this.emit({
      type: "project",
      project: {
        name: projectRevision.name,
        entrypoint: projectRevision.entrypoint,
        revision: `ide:${projectRevision.projectId}:${projectRevision.revision}`,
        stale: true,
      },
    });
  }

  async stop(): Promise<void> {
    this.stopCalls += 1;
    this.running = false;
    this.emit({ type: "status", state: "connecting", detail: "Stopping" });
    this.emit({ type: "status", state: "ready", detail: "Stopped" });
  }

  async reset(): Promise<void> {
    this.resetCalls += 1;
    this.running = false;
    this.emit({ type: "status", state: "connecting", detail: "Resetting" });
    this.emit({ type: "status", state: "ready", detail: "Reset complete" });
  }

  async setRuntimeParameter(
    _name: string,
    _value: RuntimeParameterValue,
  ): Promise<void> {}

  subscribe(listener: (event: TargetEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: TargetEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

function command(value: PhysicalWorkerCommand): PhysicalWorkerCommand {
  return value;
}

function responses(port: FakePort, requestId: string) {
  return port.messages.filter(
    (message) => message.type === "response" && message.requestId === requestId,
  );
}

function events(port: FakePort, type: TargetEvent["type"]): TargetEvent[] {
  return port.messages
    .filter((message) => message.type === "event")
    .map((message) => message.event)
    .filter((event) => event.type === type);
}

function telemetry(seq: number): TelemetrySample {
  return {
    tMs: seq * 60,
    seq,
    source: "physical",
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

describe("physical target coordinator", () => {
  it("carries the commissioned robot identity into shared discovery", async () => {
    const identities: Array<string | undefined> = [];
    const coordinator = new PhysicalTargetCoordinator(
      (endpoint, _timeoutMs, expectedRobotId) => {
        identities.push(expectedRobotId);
        return new FakePhysicalTarget(endpoint);
      },
    );
    const ide = new FakePort();
    coordinator.attach(ide);

    coordinator.handle(
      ide,
      command({
        type: "connect",
        endpoints: ["http://192.168.7.30"],
        discoveryTimeoutMs: 1_000,
        expectedRobotId: "ROBOT-A",
        requestId: "identity",
      }),
    );
    await vi.waitFor(() =>
      expect(responses(ide, "identity")).toEqual([
        expect.objectContaining({ ok: true }),
      ]),
    );

    expect(identities).toEqual(["robot-a"]);
  });

  it("tries known endpoints in order with the bounded discovery timeout", async () => {
    const attempts: Array<{ endpoint: string; timeoutMs?: number }> = [];
    const coordinator = new PhysicalTargetCoordinator((endpoint, timeoutMs) => {
      attempts.push({ endpoint, timeoutMs });
      const target = new FakePhysicalTarget(endpoint);
      if (endpoint.endsWith("7.30")) {
        target.connectError = new Error("stale station address");
      }
      return target;
    });
    const ide = new FakePort();
    coordinator.attach(ide);

    coordinator.handle(
      ide,
      command({
        type: "connect",
        endpoints: ["http://192.168.7.30", "http://192.168.4.1"],
        discoveryTimeoutMs: 1_000,
        requestId: "discover",
      }),
    );
    await vi.waitFor(() =>
      expect(responses(ide, "discover")).toEqual([
        expect.objectContaining({ ok: true }),
      ]),
    );

    expect(attempts).toEqual([
      { endpoint: "http://192.168.7.30", timeoutMs: 1_000 },
      { endpoint: "http://192.168.4.1", timeoutMs: 1_000 },
    ]);
    expect(events(ide, "status")).not.toContainEqual(
      expect.objectContaining({ detail: "stale station address" }),
    );
    expect(events(ide, "status")).toContainEqual({
      type: "status",
      state: "ready",
      detail: "http://192.168.4.1",
    });
  });

  it("shares one connection and replays each retained console event once", async () => {
    const targets: FakePhysicalTarget[] = [];
    const coordinator = new PhysicalTargetCoordinator((endpoint) => {
      const target = new FakePhysicalTarget(endpoint);
      targets.push(target);
      return target;
    });
    const ide = new FakePort();
    const monitor = new FakePort();
    coordinator.attach(ide);
    coordinator.attach(monitor);

    const ideConnect = command({
      type: "connect",
      endpoint: "http://192.168.4.1",
      requestId: "ide-connect",
    });
    coordinator.handle(ide, ideConnect);
    await vi.waitFor(() =>
      expect(responses(ide, "ide-connect")).toHaveLength(1),
    );

    const monitorConnect = command({
      type: "connect",
      endpoint: "http://192.168.4.1",
      requestId: "monitor-connect",
    });
    coordinator.handle(monitor, monitorConnect);
    await vi.waitFor(() =>
      expect(responses(monitor, "monitor-connect")).toHaveLength(1),
    );

    expect(targets).toHaveLength(1);
    expect(targets[0]?.connectCalls).toBe(1);
    for (const port of [ide, monitor]) {
      const connected = events(port, "console").filter(
        (event) =>
          event.type === "console" && event.eventId?.endsWith(":connected"),
      );
      expect(connected).toHaveLength(1);
    }
  });

  it("restores every attached tab when either tab retries a failed connection", async () => {
    let attempt = 0;
    const coordinator = new PhysicalTargetCoordinator((endpoint) => {
      const target = new FakePhysicalTarget(endpoint);
      attempt += 1;
      if (attempt === 1) {
        target.connectError = new Error("wrong Wi-Fi");
      }
      return target;
    });
    const ide = new FakePort();
    const monitor = new FakePort();
    coordinator.attach(ide);
    coordinator.attach(monitor);

    coordinator.handle(
      monitor,
      command({
        type: "connect",
        endpoint: "http://192.168.4.1",
        requestId: "failed-connect",
      }),
    );
    await vi.waitFor(() =>
      expect(responses(monitor, "failed-connect")[0]).toMatchObject({
        ok: false,
      }),
    );

    coordinator.handle(
      ide,
      command({
        type: "connect",
        endpoint: "http://192.168.4.1",
        requestId: "retry-connect",
      }),
    );
    await vi.waitFor(() =>
      expect(responses(ide, "retry-connect")[0]).toMatchObject({ ok: true }),
    );

    expect(events(ide, "status").at(-1)).toMatchObject({ state: "ready" });
    expect(events(monitor, "status").at(-1)).toMatchObject({ state: "ready" });
  });

  it("serializes two-tab commands and permits another run after completion", async () => {
    let target!: FakePhysicalTarget;
    const coordinator = new PhysicalTargetCoordinator((endpoint) => {
      target = new FakePhysicalTarget(endpoint);
      return target;
    });
    const ide = new FakePort();
    const monitor = new FakePort();
    coordinator.attach(ide);
    coordinator.attach(monitor);
    coordinator.handle(
      ide,
      command({
        type: "connect",
        endpoint: "http://192.168.4.1",
        requestId: "connect",
      }),
    );
    await vi.waitFor(() => expect(responses(ide, "connect")).toHaveLength(1));

    coordinator.handle(
      ide,
      command({ type: "run-current", requestId: "run-ide" }),
    );
    coordinator.handle(
      monitor,
      command({ type: "run-current", requestId: "run-monitor" }),
    );
    await vi.waitFor(() =>
      expect(responses(monitor, "run-monitor")).toHaveLength(1),
    );
    expect(target.runCalls).toBe(1);

    target.complete();
    coordinator.handle(
      monitor,
      command({ type: "run-current", requestId: "run-again" }),
    );
    await vi.waitFor(() =>
      expect(responses(monitor, "run-again")).toHaveLength(1),
    );
    expect(target.runCalls).toBe(2);

    coordinator.handle(ide, command({ type: "stop", requestId: "stop" }));
    await vi.waitFor(() => expect(responses(ide, "stop")).toHaveLength(1));
    coordinator.handle(monitor, command({ type: "reset", requestId: "reset" }));
    await vi.waitFor(() => expect(responses(monitor, "reset")).toHaveLength(1));
    expect(target.stopCalls).toBe(1);
    expect(target.resetCalls).toBe(1);
    expect(events(ide, "status").at(-1)).toMatchObject({ state: "ready" });
    expect(events(monitor, "status").at(-1)).toMatchObject({ state: "ready" });
  });

  it("runs the exact current IDE snapshot without waiting for stale publication", async () => {
    let target!: FakePhysicalTarget;
    const coordinator = new PhysicalTargetCoordinator((endpoint) => {
      target = new FakePhysicalTarget(endpoint);
      return target;
    });
    const ide = new FakePort();
    const monitor = new FakePort();
    coordinator.attach(ide);
    coordinator.attach(monitor);
    coordinator.handle(
      ide,
      command({
        type: "connect",
        endpoint: "http://192.168.4.1",
        requestId: "connect",
        providesProject: true,
      }),
    );
    await vi.waitFor(() => expect(responses(ide, "connect")).toHaveLength(1));

    const latestProject: CourseProject = {
      ...project,
      files: { "main.py": "print('latest editor source')\n" },
    };
    coordinator.handle(
      ide,
      command({
        type: "mark-project-changed",
        project: {
          projectId: "project-1",
          revision: 2,
          name: latestProject.name!,
          entrypoint: latestProject.entrypoint,
        },
      }),
    );
    await vi.waitFor(() =>
      expect(events(monitor, "project").at(-1)).toMatchObject({
        project: { name: latestProject.name, stale: true },
      }),
    );
    coordinator.handle(
      monitor,
      command({ type: "run-current", requestId: "monitor-run" }),
    );
    await vi.waitFor(() =>
      expect(
        ide.messages.some(
          (message) => message.type === "project-run-snapshot-request",
        ),
      ).toBe(true),
    );
    expect(target.runCalls).toBe(0);

    const request = ide.messages.find(
      (message) => message.type === "project-run-snapshot-request",
    );
    if (!request || request.type !== "project-run-snapshot-request") {
      throw new Error("Expected a current-project request");
    }
    coordinator.handle(
      ide,
      command({
        type: "project-run-snapshot",
        requestId: request.requestId,
        snapshot: {
          projectId: "project-1",
          revision: 2,
          project: latestProject,
        },
      }),
    );
    await vi.waitFor(() =>
      expect(responses(monitor, "monitor-run")).toHaveLength(1),
    );
    expect(target.runProjects).toEqual([latestProject]);
  });

  it("changes the shared endpoint once for all attached tabs", async () => {
    const targets: FakePhysicalTarget[] = [];
    const coordinator = new PhysicalTargetCoordinator((endpoint) => {
      const target = new FakePhysicalTarget(endpoint);
      targets.push(target);
      return target;
    });
    const ide = new FakePort();
    const monitor = new FakePort();
    coordinator.attach(ide);
    coordinator.attach(monitor);
    coordinator.handle(
      ide,
      command({
        type: "connect",
        endpoint: "http://192.168.4.1",
        requestId: "hotspot",
      }),
    );
    await vi.waitFor(() => expect(responses(ide, "hotspot")).toHaveLength(1));

    coordinator.handle(
      monitor,
      command({
        type: "connect",
        endpoint: "http://192.168.7.30",
        requestId: "station",
      }),
    );
    await vi.waitFor(() =>
      expect(responses(monitor, "station")).toHaveLength(1),
    );

    expect(targets).toHaveLength(2);
    expect(targets[0]?.disconnectCalls).toBe(1);
    expect(events(ide, "status").at(-1)).toMatchObject({
      state: "ready",
      detail: "http://192.168.7.30",
    });
    expect(events(monitor, "status").at(-1)).toMatchObject({
      state: "ready",
      detail: "http://192.168.7.30",
    });
  });

  it("replaces a stale endpoint even when it remains a lower-priority candidate", async () => {
    const targets: FakePhysicalTarget[] = [];
    const coordinator = new PhysicalTargetCoordinator((endpoint) => {
      const target = new FakePhysicalTarget(endpoint);
      targets.push(target);
      return target;
    });
    const app = new FakePort();
    coordinator.attach(app);

    coordinator.handle(
      app,
      command({
        type: "connect",
        endpoints: ["http://192.168.4.1"],
        requestId: "hotspot",
      }),
    );
    await vi.waitFor(() => expect(responses(app, "hotspot")).toHaveLength(1));

    coordinator.handle(
      app,
      command({
        type: "connect",
        endpoints: ["http://192.168.7.25", "http://192.168.4.1"],
        requestId: "station",
      }),
    );
    await vi.waitFor(() => expect(responses(app, "station")).toHaveLength(1));

    expect(targets).toHaveLength(2);
    expect(targets[0]?.disconnectCalls).toBe(1);
    expect(events(app, "status").at(-1)).toMatchObject({
      state: "ready",
      detail: "http://192.168.7.25",
    });
  });

  it("restores the shared state after one tab receives a command error", async () => {
    let target!: FakePhysicalTarget;
    const coordinator = new PhysicalTargetCoordinator((endpoint) => {
      target = new FakePhysicalTarget(endpoint);
      return target;
    });
    const ide = new FakePort();
    const monitor = new FakePort();
    coordinator.attach(ide);
    coordinator.attach(monitor);
    coordinator.handle(
      ide,
      command({
        type: "connect",
        endpoint: "http://192.168.4.1",
        requestId: "connect",
      }),
    );
    await vi.waitFor(() => expect(responses(ide, "connect")).toHaveLength(1));

    target.nextRunError = new Error("project must be prepared");
    coordinator.handle(
      monitor,
      command({ type: "run-current", requestId: "failed-run" }),
    );
    await vi.waitFor(() =>
      expect(responses(monitor, "failed-run")[0]).toMatchObject({ ok: false }),
    );

    expect(events(ide, "status").at(-1)).toMatchObject({ state: "ready" });
    expect(events(monitor, "status").at(-1)).toMatchObject({ state: "ready" });
    const responseIndex = monitor.messages.findIndex(
      (message) =>
        message.type === "response" && message.requestId === "failed-run",
    );
    const restoredIndex = monitor.messages.findIndex(
      (message, index) =>
        index > responseIndex &&
        message.type === "event" &&
        message.event.type === "status" &&
        message.event.state === "ready",
    );
    expect(restoredIndex).toBeGreaterThan(responseIndex);
  });

  it("replays physical telemetry chronologically to a late tab without duplicates", async () => {
    let target!: FakePhysicalTarget;
    const coordinator = new PhysicalTargetCoordinator((endpoint) => {
      target = new FakePhysicalTarget(endpoint);
      return target;
    });
    const ide = new FakePort();
    coordinator.attach(ide);
    coordinator.handle(
      ide,
      command({
        type: "connect",
        endpoint: "http://192.168.4.1",
        requestId: "ide-connect-history",
      }),
    );
    await vi.waitFor(() =>
      expect(responses(ide, "ide-connect-history")).toHaveLength(1),
    );
    for (const seq of [1, 2, 3]) {
      target.emit({ type: "telemetry", sample: telemetry(seq) });
    }

    const monitor = new FakePort();
    coordinator.attach(monitor);
    expect(
      events(monitor, "telemetry").map(
        (event) => event.type === "telemetry" && event.sample.seq,
      ),
    ).toEqual([1, 2, 3]);
    target.emit({ type: "telemetry", sample: telemetry(4) });

    coordinator.handle(
      monitor,
      command({
        type: "connect",
        endpoint: "http://192.168.4.1",
        requestId: "monitor-connect-history",
      }),
    );
    await vi.waitFor(() =>
      expect(responses(monitor, "monitor-connect-history")).toHaveLength(1),
    );
    target.emit({ type: "telemetry", sample: telemetry(5) });
    coordinator.handle(
      monitor,
      command({
        type: "connect",
        endpoint: "http://192.168.4.1",
        requestId: "monitor-reconnect-history",
      }),
    );
    await vi.waitFor(() =>
      expect(responses(monitor, "monitor-reconnect-history")).toHaveLength(1),
    );

    expect(
      events(monitor, "telemetry").map(
        (event) => event.type === "telemetry" && event.sample.seq,
      ),
    ).toEqual([1, 2, 3, 4, 5]);
  });
});
