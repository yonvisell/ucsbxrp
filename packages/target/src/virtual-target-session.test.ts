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

type RuntimeOutcome = "complete" | "error";

class FakeRuntimeWorker {
  static nextOutcome: RuntimeOutcome = "complete";
  static completedRuns = 0;
  static runProjects: CourseProject[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  terminated = false;

  postMessage(request: {
    mode: "check" | "test" | "run";
    project?: CourseProject;
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
    if (request.project) FakeRuntimeWorker.runProjects.push(request.project);
    FakeRuntimeWorker.nextOutcome = "complete";
    this.emit({ type: "runtime-ready", version: "1.28.0" });
    this.emit({
      type: "compile-complete",
      detail: "1 Python file compiled with MicroPython 1.28.0",
    });
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
    } else {
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
    expect(ideEvents.some((event) => event.type === "telemetry")).toBe(true);

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

    await monitor.runCurrent();

    expect(FakeRuntimeWorker.runProjects.at(-1)?.files["main.py"]).toBe(
      "print('latest editor source')\n",
    );
    ide.disconnect();
    monitor.disconnect();
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
});
