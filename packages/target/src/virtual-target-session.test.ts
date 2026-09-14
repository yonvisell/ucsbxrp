import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CourseProject, TargetEvent } from "./types";

interface PortLike {
  onmessage: ((event: MessageEvent) => void) | null;
  peer: PortLike | null;
  postMessage(message: unknown): void;
  start(): void;
  close(): void;
}

class DuplexPort implements PortLike {
  onmessage: ((event: MessageEvent) => void) | null = null;
  peer: PortLike | null = null;
  closed = false;

  postMessage(message: unknown): void {
    if (!this.closed) {
      this.peer?.onmessage?.({ data: message } as MessageEvent);
    }
  }

  start(): void {}

  close(): void {
    this.closed = true;
  }
}

function channel(): [DuplexPort, DuplexPort] {
  const client = new DuplexPort();
  const server = new DuplexPort();
  client.peer = server;
  server.peer = client;
  return [client, server];
}

type RuntimeOutcome =
  | "complete"
  | "error"
  | "pending"
  | "startup-stalled"
  | "compile-stalled"
  | "compile-error";

class FakeRuntimeWorker {
  static nextOutcome: RuntimeOutcome = "complete";
  static completedRuns = 0;
  static runProjects: CourseProject[] = [];
  static cancellationBuffers: Int32Array[] = [];
  static nextOutputBatch: {
    lines: { stream: "stdout" | "stderr"; line: string }[];
    omitted: number;
  } | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminated = false;

  postMessage(request: {
    mode: "check" | "test" | "run";
    project?: CourseProject;
    cancellationBuffer?: SharedArrayBuffer;
  }): void {
    if (request.mode === "check") {
      this.emit({
        type: "check-complete",
        detail: "1 Python file compiled with MicroPython 1.28.0",
      });
      return;
    }
    if (request.mode === "test") {
      this.emit({
        type: "test-complete",
        detail: "Component checks completed with MicroPython 1.28.0",
      });
      return;
    }

    const outcome = FakeRuntimeWorker.nextOutcome;
    if (request.cancellationBuffer)
      FakeRuntimeWorker.cancellationBuffers.push(
        new Int32Array(request.cancellationBuffer),
      );
    if (request.project) FakeRuntimeWorker.runProjects.push(request.project);
    FakeRuntimeWorker.nextOutcome = "complete";
    if (outcome === "startup-stalled") return;
    this.emit({ type: "runtime-ready", version: "1.28.0" });
    if (outcome === "compile-stalled") return;
    if (outcome === "compile-error") {
      this.emit({
        type: "error",
        stage: "compile",
        detail: 'File "/project/main.py", line 1\nSyntaxError: invalid syntax',
        rawDetail:
          'Traceback (most recent call last):\n  File "<stdin>", line 3\n  File "/project/main.py", line 1\nSyntaxError: invalid syntax',
        diagnostics: [
          {
            source: "micropython",
            phase: "compile",
            severity: "error",
            message: "SyntaxError: invalid syntax",
            path: "main.py",
            start: { line: 1, column: 1 },
            raw: [
              'File "/project/main.py", line 1',
              "SyntaxError: invalid syntax",
            ],
          },
        ],
      });
      return;
    }
    this.emit({
      type: "compile-complete",
      detail: "1 Python file compiled with MicroPython 1.28.0",
    });
    if (FakeRuntimeWorker.nextOutputBatch) {
      this.emit({
        type: "console-batch",
        ...FakeRuntimeWorker.nextOutputBatch,
      });
      FakeRuntimeWorker.nextOutputBatch = null;
    }
    this.emit({
      type: "console",
      stream: outcome === "error" ? "stderr" : "stdout",
      line:
        outcome === "error"
          ? "final output before exception"
          : `final output ${FakeRuntimeWorker.completedRuns + 1}`,
    });
    if (outcome === "error") {
      this.emit({ type: "error", detail: "test exception" });
    } else if (outcome === "complete") {
      FakeRuntimeWorker.completedRuns += 1;
      this.emit({ type: "run-complete" });
    }
  }

  terminate(): void {
    this.terminated = true;
  }

  private emit(data: unknown): void {
    this.onmessage?.({ data } as MessageEvent);
  }
}

const project: CourseProject = {
  name: "Shared virtual project",
  entrypoint: "main.py",
  files: { "main.py": "print('shared')\n" },
};

describe("virtual target shared session", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    FakeRuntimeWorker.nextOutcome = "complete";
    FakeRuntimeWorker.completedRuns = 0;
    FakeRuntimeWorker.runProjects = [];
    FakeRuntimeWorker.cancellationBuffers = [];
    FakeRuntimeWorker.nextOutputBatch = null;

    const scope: {
      onconnect?: (event: MessageEvent) => void;
    } = {};
    vi.stubGlobal("self", scope);
    vi.stubGlobal("Worker", FakeRuntimeWorker);

    await import("./virtual-target.shared-worker");

    class FakeSharedWorker {
      readonly port: DuplexPort;

      constructor() {
        const [client, server] = channel();
        this.port = client;
        scope.onconnect?.({ ports: [server] } as unknown as MessageEvent);
      }
    }
    vi.stubGlobal("SharedWorker", FakeSharedWorker);
    vi.stubGlobal("crossOriginIsolated", false);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("keeps run identifiers distinct when the shared-worker session restarts", async () => {
    const runInFreshSession = async () => {
      const scope: { onconnect?: (event: MessageEvent) => void } = {};
      vi.resetModules();
      vi.stubGlobal("self", scope);
      await import("./virtual-target.shared-worker");
      vi.stubGlobal(
        "SharedWorker",
        class {
          readonly port: DuplexPort;
          constructor() {
            const [client, server] = channel();
            this.port = client;
            scope.onconnect?.({ ports: [server] } as unknown as MessageEvent);
          }
        },
      );
      const { VirtualTargetClient } = await import("./virtual-target");
      const target = new VirtualTargetClient();
      const events: TargetEvent[] = [];
      target.subscribe((event) => events.push(event));
      try {
        await target.connect();
        await target.run(project, "project-a");
        return events.find(
          (event): event is Extract<TargetEvent, { type: "run" }> =>
            event.type === "run" && event.phase === "begin",
        )!.runId;
      } finally {
        target.disconnect();
      }
    };
    const first = await runInFreshSession();
    const second = await runInFreshSession();
    expect(first).not.toBe(second);
    expect(first).toMatch(/^virtual-.+-run-1$/);
    expect(second).toMatch(/^virtual-.+-run-1$/);
  });

  it("identifies omitted program output and retains its exact count for a late Monitor", async () => {
    const { VirtualTargetClient } = await import("./virtual-target");
    const ide = new VirtualTargetClient();
    const lateMonitor = new VirtualTargetClient();
    const live: TargetEvent[] = [];
    const replay: TargetEvent[] = [];
    ide.subscribe((event) => live.push(event));
    lateMonitor.subscribe((event) => replay.push(event));
    try {
      await ide.connect();
      FakeRuntimeWorker.nextOutputBatch = {
        lines: [{ stream: "stdout", line: "first retained line" }],
        omitted: 98_765,
      };
      await ide.run(project, "output-project");
      const run = live.find(
        (event): event is Extract<TargetEvent, { type: "run" }> =>
          event.type === "run" && event.phase === "begin",
      )!;
      const diagnostic = live.find(
        (event): event is Extract<TargetEvent, { type: "console" }> =>
          event.type === "console" && event.omittedOutputLines !== undefined,
      )!;
      expect(diagnostic).toMatchObject({
        stream: "system",
        action: "run",
        phase: "output",
        requestId: run.runId,
        omittedOutputLines: 98_765,
      });
      expect(diagnostic.line).toContain("98765 output lines omitted");
      await lateMonitor.connect();
      expect(replay).toContainEqual({ ...diagnostic, replayed: true });
      expect(
        replay.find(
          (event) => event.type === "run-history" && event.phase === "end",
        ),
      ).toMatchObject({
        runId: run.runId,
        projectId: "output-project",
        droppedOutputLines: 98_765,
        finishedAtMs: expect.any(Number),
      });
    } finally {
      lateMonitor.disconnect();
      ide.disconnect();
    }
  });

  it.each<RuntimeOutcome>(["pending", "complete", "error"])(
    "keeps a %s run's final observations before Reset and replays the current origin separately",
    async (outcome) => {
      const { VirtualTargetClient } = await import("./virtual-target");
      const owner = new VirtualTargetClient();
      const late = new VirtualTargetClient();
      const live: TargetEvent[] = [];
      const replay: TargetEvent[] = [];
      owner.subscribe((event) => live.push(event));
      late.subscribe((event) => replay.push(event));
      try {
        await owner.connect();
        FakeRuntimeWorker.nextOutcome = outcome;
        await owner.run(project, "reset-project");
        const begin = live.findIndex(
          (event) => event.type === "run" && event.phase === "begin",
        );
        const originalEnd = live.find(
          (event) => event.type === "run" && event.phase === "end",
        );
        await owner.reset();
        const end = live.findIndex(
          (event) => event.type === "run" && event.phase === "end",
        );
        const boundary = live[end] as Extract<TargetEvent, { type: "run" }>;
        expect(end).toBeGreaterThan(begin);
        if (originalEnd) expect(boundary).toEqual(originalEnd);
        else
          expect(boundary).toMatchObject({
            detail: "Run ended by Reset",
            finishedAtMs: expect.any(Number),
          });
        const runSamples = live
          .slice(begin + 1, end)
          .filter((event) => event.type === "telemetry")
          .map((event) => event.sample);
        expect(runSamples.length).toBeGreaterThan(0);
        expect(runSamples.at(-1)?.observationKind).toBe("stop");
        expect(
          live
            .slice(end + 1)
            .some(
              (event) =>
                event.type === "telemetry" &&
                event.sample.observationKind === "reset",
            ),
        ).toBe(true);
        await late.connect();
        const historyEnd = replay.findIndex(
          (event) => event.type === "run-history" && event.phase === "end",
        );
        expect(replay[historyEnd]).toMatchObject({
          runId: boundary.runId,
          projectId: "reset-project",
          state: boundary.state,
          detail: boundary.detail,
          finishedAtMs: boundary.finishedAtMs,
        });
        expect(
          replay
            .slice(0, historyEnd)
            .filter((event) => event.type === "telemetry")
            .map((event) => event.sample),
        ).toEqual(runSamples);
        expect(replay.slice(historyEnd + 1)).toContainEqual(
          expect.objectContaining({
            type: "telemetry",
            sample: expect.objectContaining({
              tMs: 0,
              seq: 0,
              observationKind: "reset",
            }),
          }),
        );
        expect(
          replay
            .slice(historyEnd + 1)
            .filter((event) => event.type === "telemetry")
            .every((event) => event.replayed !== true),
        ).toBe(true);
      } finally {
        late.disconnect();
        owner.disconnect();
      }
    },
  );

  it("delivers source-bound compiler diagnostics to the IDE when a Monitor requests invalid code", async () => {
    const { VirtualTargetClient } = await import("./virtual-target");
    const { describeProject } = await import("./project-identity");
    const ide = new VirtualTargetClient();
    const monitor = new VirtualTargetClient();
    const events: TargetEvent[] = [];
    const invalid = {
      ...project,
      files: { "main.py": "def broken(:\n    pass\n" },
    };
    ide.subscribe((event) => events.push(event));
    ide.setProjectRunProvider(() => ({
      projectId: "invalid-project",
      revision: 7,
      project: invalid,
    }));
    try {
      await ide.connect();
      await monitor.connect();
      await ide.markProjectStale(invalid, "invalid-project");
      FakeRuntimeWorker.nextOutcome = "compile-error";
      await monitor.runCurrent();
      const compiler = events.find(
        (event): event is Extract<TargetEvent, { type: "compile-result" }> =>
          event.type === "compile-result",
      )!;
      expect(compiler).toMatchObject({
        projectId: "invalid-project",
        projectRevision: (await describeProject(invalid)).revision,
        result: {
          ok: false,
          diagnostics: [{ path: "main.py", start: { line: 1, column: 1 } }],
        },
      });
      expect(compiler.result.compilerOutput!.join("\n")).toContain("<stdin>");
      expect(
        events.some((event) => event.type === "run" && event.phase === "begin"),
      ).toBe(false);
      expect(
        events.some(
          (event) => event.type === "status" && event.state === "running",
        ),
      ).toBe(false);
      expect(events.at(-1)).toMatchObject({ type: "status", state: "ready" });
    } finally {
      monitor.disconnect();
      ide.disconnect();
    }
  });

  it("starts isolated runtime cancellation flags clear and sets only the stopped run's flag", async () => {
    vi.stubGlobal("crossOriginIsolated", true);
    const { VirtualTargetClient } = await import("./virtual-target");
    const target = new VirtualTargetClient();
    try {
      await target.connect();
      FakeRuntimeWorker.nextOutcome = "pending";
      await target.run(project, "project-a");
      const first = FakeRuntimeWorker.cancellationBuffers[0]!;
      expect(Atomics.load(first, 0)).toBe(0);
      await vi.advanceTimersByTimeAsync(800);
      expect(Atomics.load(first, 0)).toBe(0);
      await target.stop();
      expect(Atomics.load(first, 0)).toBe(1);
      FakeRuntimeWorker.nextOutcome = "pending";
      await target.run(project, "project-a");
      const second = FakeRuntimeWorker.cancellationBuffers[1]!;
      expect(second.buffer).not.toBe(first.buffer);
      expect(Atomics.load(second, 0)).toBe(0);
      await target.stop();
      expect(Atomics.load(second, 0)).toBe(1);
    } finally {
      target.disconnect();
    }
  });

  it.each(["startup-stalled", "compile-stalled"] as const)(
    "bounds %s Run and allows a subsequent explicit retry",
    async (outcome) => {
      const { VirtualTargetClient } = await import("./virtual-target");
      const target = new VirtualTargetClient();
      const events: TargetEvent[] = [];
      target.subscribe((event) => events.push(event));
      try {
        await target.connect();
        FakeRuntimeWorker.nextOutcome = outcome;
        await target.run(project, "project-a");
        const limit = outcome === "startup-stalled" ? 15_000 : 2_500;
        await vi.advanceTimersByTimeAsync(limit - 1);
        expect(
          events.filter((event) => event.type === "status").at(-1),
        ).toMatchObject({ state: "loading" });
        await vi.advanceTimersByTimeAsync(1);
        expect(
          events.filter((event) => event.type === "status").at(-1),
        ).toMatchObject({ state: "ready" });
        expect(
          events.some(
            (event) =>
              event.type === "console" && /try Run again/.test(event.line),
          ),
        ).toBe(true);
        FakeRuntimeWorker.nextOutcome = "pending";
        await target.run(project, "project-a");
        await vi.advanceTimersByTimeAsync(16_000);
        expect(
          events.filter((event) => event.type === "status").at(-1),
        ).toMatchObject({ state: "running" });
        await target.stop();
      } finally {
        target.disconnect();
      }
    },
  );

  it("shares state in either app order and supports success, error, then rerun", async () => {
    const { VirtualTargetClient } = await import("./virtual-target");
    const monitor = new VirtualTargetClient();
    const ide = new VirtualTargetClient();
    const monitorEvents: TargetEvent[] = [];
    const ideEvents: TargetEvent[] = [];
    monitor.subscribe((event) => monitorEvents.push(event));
    ide.subscribe((event) => ideEvents.push(event));
    ide.setProjectRunProvider(() => ({
      projectId: "shared-project",
      revision: 1,
      project,
    }));

    // The Monitor is deliberately opened first. It prepares the default
    // project, then the IDE joins the same retained worker session.
    await monitor.connect();
    await monitor.synchronize(project);
    await ide.connect();

    expect(
      ideEvents.filter((event) => event.type === "project").at(-1),
    ).toMatchObject({
      project: { name: "Shared virtual project", stale: false },
    });
    expect(ideEvents.some((event) => event.type === "telemetry")).toBe(false);

    const firstRunStart = monitorEvents.length;
    await monitor.runCurrent();
    const firstRun = monitorEvents.slice(firstRunStart);
    const finalOutputIndex = firstRun.findIndex(
      (event) => event.type === "console" && event.line === "final output 1",
    );
    const completionIndex = firstRun.findIndex(
      (event) =>
        event.type === "status" && event.detail.startsWith("Program completed"),
    );
    expect(finalOutputIndex).toBeGreaterThanOrEqual(0);
    expect(completionIndex).toBeGreaterThan(finalOutputIndex);
    expect(ideEvents.at(-1)).toMatchObject({ type: "status", state: "ready" });

    FakeRuntimeWorker.nextOutcome = "error";
    await ide.runCurrent();
    expect(monitorEvents.at(-1)).toMatchObject({
      type: "status",
      state: "error",
    });

    await monitor.runCurrent();
    expect(FakeRuntimeWorker.completedRuns).toBe(2);
    expect(ideEvents.at(-1)).toMatchObject({ type: "status", state: "ready" });

    const lateTab = new VirtualTargetClient();
    const lateEvents: TargetEvent[] = [];
    lateTab.subscribe((event) => lateEvents.push(event));
    await lateTab.connect();

    expect(
      lateEvents.filter((event) => event.type === "project").at(-1),
    ).toMatchObject({ project: { name: "Shared virtual project" } });
    expect(
      lateEvents.filter((event) => event.type === "status").at(-1),
    ).toMatchObject({ state: "ready" });
    const replayedTelemetry = lateEvents.filter(
      (event): event is Extract<TargetEvent, { type: "telemetry" }> =>
        event.type === "telemetry",
    );
    expect(replayedTelemetry.length).toBeGreaterThan(0);
    expect(replayedTelemetry.every((event) => event.replayed === true)).toBe(
      true,
    );
    const replayedConsole = lateEvents.filter(
      (event): event is Extract<TargetEvent, { type: "console" }> =>
        event.type === "console",
    );
    const replayedIds = replayedConsole.map((event) => event.eventId);
    expect(replayedIds).not.toContain(undefined);
    expect(new Set(replayedIds).size).toBe(replayedIds.length);
    expect(
      replayedConsole.every((event) => Number.isFinite(event.timestampMs)),
    ).toBe(true);
    expect(replayedConsole.every((event) => event.replayed === true)).toBe(
      true,
    );

    lateTab.disconnect();
    ide.disconnect();
    monitor.disconnect();
  });

  it("requests the IDE snapshot at run time and executes an immediate edit", async () => {
    const { VirtualTargetClient } = await import("./virtual-target");
    const monitor = new VirtualTargetClient();
    const ide = new VirtualTargetClient();
    const monitorEvents: TargetEvent[] = [];
    monitor.subscribe((event) => monitorEvents.push(event));
    let latestProject = project;
    ide.setProjectRunProvider(() => ({
      projectId: "project-1",
      revision: 2,
      project: latestProject,
    }));

    await monitor.connect();
    await monitor.synchronize(project);
    await ide.connect();
    latestProject = {
      ...project,
      files: { "main.py": "print('latest editor source')\n" },
    };
    ide.markProjectChanged({
      projectId: "project-1",
      revision: 2,
      name: latestProject.name!,
      entrypoint: latestProject.entrypoint,
    });
    expect(
      monitorEvents.filter((event) => event.type === "project").at(-1),
    ).toMatchObject({ project: { stale: true } });
    await ide.markProjectStale(latestProject);
    await ide.markProjectStale(latestProject);
    expect(
      monitorEvents.filter((event) => event.type === "project").at(-1),
    ).toMatchObject({ project: { stale: true } });

    await monitor.runCurrent();

    expect(FakeRuntimeWorker.runProjects.at(-1)?.files["main.py"]).toBe(
      "print('latest editor source')\n",
    );
    ide.disconnect();
    monitor.disconnect();
  });

  it("resets the visible world when a different Project has identical world text", async () => {
    const { VirtualTargetClient } = await import("./virtual-target");
    const ide = new VirtualTargetClient();
    const events: TargetEvent[] = [];
    ide.subscribe((event) => events.push(event));
    await ide.connect();

    await ide.markProjectStale(project, "project-a");
    await ide.run(project, "project-a");
    const afterFirstProject = events.filter(
      (event) => event.type === "world",
    ).length;
    await ide.markProjectStale(
      { ...project, name: "Edited Project A" },
      "project-a",
    );
    expect(events.filter((event) => event.type === "world")).toHaveLength(
      afterFirstProject,
    );

    await ide.markProjectStale({ ...project, name: "Project B" }, "project-b");
    expect(events.filter((event) => event.type === "world")).toHaveLength(
      afterFirstProject + 1,
    );
    expect(
      events.filter((event) => event.type === "telemetry").at(-1),
    ).toMatchObject({ sample: { xMm: 0, yMm: 0 } });

    ide.disconnect();
  });

  it("returns to the default world when direct synchronize or Run changes Project identity", async () => {
    const { VirtualTargetClient } = await import("./virtual-target");
    const ide = new VirtualTargetClient();
    const monitor = new VirtualTargetClient();
    const events: TargetEvent[] = [];
    const worldSource = JSON.stringify({
      default_world: "default",
      worlds: [
        {
          id: "default",
          label: "Default",
          bounds: {
            minimum_x_mm: -1524,
            minimum_y_mm: -609.6,
            maximum_x_mm: 1524,
            maximum_y_mm: 609.6,
          },
          initial_pose: { x_mm: 0, y_mm: 0, heading_rad: 0 },
          obstacles: [],
          markers: [],
        },
        {
          id: "alternate",
          label: "Alternate",
          bounds: {
            minimum_x_mm: -1524,
            minimum_y_mm: -609.6,
            maximum_x_mm: 1524,
            maximum_y_mm: 609.6,
          },
          initial_pose: { x_mm: 300, y_mm: 0, heading_rad: 0 },
          obstacles: [],
          markers: [],
        },
      ],
    });
    const worldProject: CourseProject = {
      ...project,
      files: { ...project.files, "world.json": worldSource },
    };
    ide.subscribe((event) => events.push(event));
    await ide.connect();
    await monitor.connect();

    await ide.synchronize(worldProject, "project-a");
    await ide.setSimulationScenario("alternate");
    await ide.synchronize(worldProject, "project-b");
    expect(
      events.filter((event) => event.type === "world").at(-1),
    ).toMatchObject({ selectedWorldId: "default" });

    await ide.setSimulationScenario("alternate");
    await ide.run(worldProject, "project-c");
    expect(
      events.filter((event) => event.type === "world").at(-1),
    ).toMatchObject({ selectedWorldId: "default" });

    let providerProjectId = "project-c";
    ide.setProjectRunProvider(() => ({
      projectId: providerProjectId,
      revision: 1,
      project: worldProject,
    }));
    await ide.setSimulationScenario("alternate");
    providerProjectId = "project-d";
    await monitor.runCurrent();
    expect(
      events.filter((event) => event.type === "world").at(-1),
    ).toMatchObject({ selectedWorldId: "default" });

    ide.disconnect();
    monitor.disconnect();
  });

  it("does not replace the staged Project or world during an active run", async () => {
    const { VirtualTargetClient } = await import("./virtual-target");
    const ide = new VirtualTargetClient();
    const events: TargetEvent[] = [];
    const first: CourseProject = {
      ...project,
      files: {
        ...project.files,
        "world.json": JSON.stringify({
          default_world: "first",
          worlds: [
            {
              id: "first",
              label: "First",
              bounds: {
                minimum_x_mm: -1524,
                minimum_y_mm: -609.6,
                maximum_x_mm: 1524,
                maximum_y_mm: 609.6,
              },
              initial_pose: { x_mm: 0, y_mm: 0, heading_rad: 0 },
              obstacles: [],
              markers: [],
            },
          ],
        }),
      },
    };
    const second: CourseProject = {
      ...first,
      name: "Second Project",
      files: {
        ...first.files,
        "world.json": first.files["world.json"]!.replaceAll("first", "second"),
      },
    };
    ide.subscribe((event) => events.push(event));
    await ide.connect();
    FakeRuntimeWorker.nextOutcome = "pending";
    await ide.run(first, "project-first");
    ide.markProjectChanged({
      projectId: "project-second",
      revision: 1,
      name: "Second Project",
      entrypoint: "main.py",
    });
    await expect(
      ide.markProjectStale(second, "project-second"),
    ).rejects.toThrow("Stop the current run");
    await expect(ide.synchronize(second, "project-second")).rejects.toThrow(
      "Stop the current run",
    );
    expect(
      events.filter((event) => event.type === "world").at(-1),
    ).toMatchObject({ selectedWorldId: "first" });
    expect(
      events.filter((event) => event.type === "project").at(-1),
    ).toMatchObject({ project: { name: "Shared virtual project" } });

    await ide.stop();
    ide.disconnect();
  });

  it("does not use a retained project when no IDE provider is active", async () => {
    const { VirtualTargetClient } = await import("./virtual-target");
    const monitor = new VirtualTargetClient();
    await monitor.connect();
    await monitor.synchronize(project);

    await expect(monitor.runCurrent()).rejects.toThrow("No active IDE project");

    expect(FakeRuntimeWorker.runProjects).toEqual([]);
    monitor.disconnect();
  });

  it("keeps the first IDE active, ignores standby edits, and supports explicit takeover", async () => {
    const { VirtualTargetClient } = await import("./virtual-target");
    const monitor = new VirtualTargetClient();
    const firstIde = new VirtualTargetClient();
    const secondIde = new VirtualTargetClient();
    const monitorEvents: TargetEvent[] = [];
    const firstEvents: TargetEvent[] = [];
    const secondEvents: TargetEvent[] = [];
    monitor.subscribe((event) => monitorEvents.push(event));
    firstIde.subscribe((event) => firstEvents.push(event));
    secondIde.subscribe((event) => secondEvents.push(event));

    let firstProject: CourseProject = {
      ...project,
      name: "First IDE project",
    };
    let secondProject: CourseProject = {
      ...project,
      name: "Second IDE project",
      files: { "main.py": "print('second IDE source')\n" },
    };
    firstIde.setProjectRunProvider(() => ({
      projectId: "first-project",
      revision: 1,
      project: firstProject,
    }));
    secondIde.setProjectRunProvider(() => ({
      projectId: "second-project",
      revision: 1,
      project: secondProject,
    }));

    await monitor.connect();
    await monitor.synchronize(project);
    await firstIde.connect();
    await secondIde.connect();

    expect(
      firstEvents.filter((event) => event.type === "project-provider").at(-1),
    ).toEqual({
      type: "project-provider",
      active: true,
      available: true,
    });
    expect(
      secondEvents.filter((event) => event.type === "project-provider").at(-1),
    ).toEqual({
      type: "project-provider",
      active: false,
      available: true,
    });

    const projectEventsBeforeStandbyEdit = monitorEvents.filter(
      (event) => event.type === "project",
    ).length;
    secondIde.markProjectChanged({
      projectId: "second-project",
      revision: 2,
      name: "Ignored standby edit",
      entrypoint: "main.py",
    });
    expect(
      monitorEvents.filter((event) => event.type === "project"),
    ).toHaveLength(projectEventsBeforeStandbyEdit);

    firstProject = {
      ...firstProject,
      files: { "main.py": "print('latest first IDE source')\n" },
    };
    firstIde.markProjectChanged({
      projectId: "first-project",
      revision: 2,
      name: firstProject.name!,
      entrypoint: firstProject.entrypoint,
    });
    expect(
      monitorEvents.filter((event) => event.type === "project").at(-1),
    ).toMatchObject({ project: { name: firstProject.name, stale: true } });

    await monitor.runCurrent();
    expect(FakeRuntimeWorker.runProjects.at(-1)).toEqual(firstProject);

    secondIde.setProjectRunProvider(
      () => ({
        projectId: "second-project",
        revision: 2,
        project: secondProject,
      }),
      { takeover: true },
    );
    expect(
      firstEvents.filter((event) => event.type === "project-provider").at(-1),
    ).toEqual({
      type: "project-provider",
      active: false,
      available: true,
    });
    expect(
      secondEvents.filter((event) => event.type === "project-provider").at(-1),
    ).toEqual({
      type: "project-provider",
      active: true,
      available: true,
    });

    firstIde.markProjectChanged({
      projectId: "first-project",
      revision: 3,
      name: "Ignored former owner edit",
      entrypoint: "main.py",
    });
    secondProject = {
      ...secondProject,
      files: { "main.py": "print('latest second IDE source')\n" },
    };
    secondIde.markProjectChanged({
      projectId: "second-project",
      revision: 2,
      name: secondProject.name!,
      entrypoint: secondProject.entrypoint,
    });
    expect(
      monitorEvents.filter((event) => event.type === "project").at(-1),
    ).toMatchObject({ project: { name: secondProject.name, stale: true } });

    await monitor.runCurrent();
    expect(FakeRuntimeWorker.runProjects.at(-1)).toEqual(secondProject);

    secondIde.disconnect();
    expect(
      firstEvents.filter((event) => event.type === "project-provider").at(-1),
    ).toEqual({
      type: "project-provider",
      active: false,
      available: false,
    });
    await expect(monitor.runCurrent()).rejects.toThrow("No active IDE project");

    firstIde.disconnect();
    monitor.disconnect();
  });
  it("never starts an old asynchronous IDE snapshot after Reset", async () => {
    const { VirtualTargetClient } = await import("./virtual-target");
    const ide = new VirtualTargetClient(),
      monitor = new VirtualTargetClient();
    let release!: (value: {
      projectId: string;
      revision: number;
      project: CourseProject;
    }) => void;
    const snapshot = new Promise<{
      projectId: string;
      revision: number;
      project: CourseProject;
    }>((resolve) => {
      release = resolve;
    });
    ide.setProjectRunProvider(() => snapshot);
    await ide.connect();
    await ide.markProjectStale(project, "project-a");
    await monitor.connect();
    const pending = monitor.runCurrent();
    const cancelled = expect(pending).rejects.toThrow(/cancelled/i);
    for (let i = 0; i < 10; i++) await Promise.resolve();
    await ide.reset();
    release({ projectId: "project-a", revision: 1, project });
    await cancelled;
    expect(FakeRuntimeWorker.runProjects).toHaveLength(0);
    ide.disconnect();
    monitor.disconnect();
  });
});
