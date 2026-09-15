import type {
  RuntimeWorkerMessage,
  TargetWorkerCommand,
  TargetWorkerMessage,
  TargetWorkerRole,
} from "./worker-protocol";
import type { SimulationScenario, WorldDefinition } from "@ucsb-xrp/simulator";
import type {
  CheckResult,
  CourseProject,
  ProjectRunProvider,
  ProjectRevisionNotice,
  SynchronizedProject,
  TargetClient,
  TargetConsoleMetadata,
  TargetEvent,
} from "./types";
import { describeProject } from "./project-identity";
import { registerPageDeparture } from "./page-departure";
import { projectWithSelectedWorld } from "./project-world";
import {
  portableProjectError,
  validatePortableProject,
} from "./project-validation";
import { MAX_RUNTIME_PARAMETERS } from "./runtime-controls";
import type { RuntimeParameterValue } from "./types";
import {
  BROWSER_SYNTAX_CHECK_TIMEOUT_MS,
  BROWSER_RUNTIME_STARTUP_TIMEOUT_MS,
  startCourseProjectSyntaxCheck,
  type CourseProjectSyntaxCheckHandle,
} from "./browser-syntax-check";

interface PendingRequest {
  resolve(value: unknown): void;
  reject(reason: Error): void;
  timeout: ReturnType<typeof setTimeout>;
}

interface PreparedRun {
  runId: number;
  scenario: SimulationScenario;
  world: WorldDefinition;
  project: CourseProject;
  descriptor: SynchronizedProject;
}

function errorDetail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function testCourseProjectComponents(
  project: CourseProject,
): Promise<CheckResult> {
  const portabilityError = portableProjectError(project);
  if (portabilityError) {
    return {
      ok: false,
      detail: portabilityError.message,
      output: [],
    };
  }
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./micropython.worker.ts", import.meta.url),
      {
        type: "module",
        name: "ucsb-xrp-component-checks",
      },
    );
    const output: string[] = [];
    const finish = () => {
      clearTimeout(timeout);
      worker.terminate();
    };
    let runtimeReady = false;
    let timeout = setTimeout(() => {
      finish();
      reject(
        new Error(
          "MicroPython runtime did not finish loading. Check the connection or offline setup, then try component checks again.",
        ),
      );
    }, BROWSER_RUNTIME_STARTUP_TIMEOUT_MS);
    worker.onmessage = (event: MessageEvent<RuntimeWorkerMessage>) => {
      const message = event.data;
      if (message.type === "runtime-ready" && !runtimeReady) {
        runtimeReady = true;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          finish();
          reject(new Error("Component checks timed out"));
        }, BROWSER_SYNTAX_CHECK_TIMEOUT_MS);
      } else if (message.type === "console") {
        if (output.length < 2_000) output.push(message.line);
      } else if (message.type === "test-complete") {
        finish();
        resolve({ ok: true, detail: message.detail, output });
      } else if (message.type === "error") {
        const diagnostics = message.diagnostics ?? [];
        finish();
        resolve({
          ok: false,
          detail: message.detail,
          ...(diagnostics.length > 0 ? { diagnostics } : {}),
          output,
        });
      }
    };
    worker.onerror = (event) => {
      finish();
      reject(new Error(event.message || "Component checker failed"));
    };
    worker.postMessage({ mode: "test", project });
  });
}

export class VirtualTargetClient implements TargetClient {
  readonly kind = "virtual" as const;
  private worker: SharedWorker | null = null;
  private runtimeWorker: Worker | null = null;
  private activeRunId: number | null = null;
  private readonly syntaxChecks = new Set<CourseProjectSyntaxCheckHandle>();
  private readonly listeners = new Set<(event: TargetEvent) => void>();
  private readonly pending = new Map<string, PendingRequest>();
  private nextRequest = 1;
  private nextAction = 1;
  private runHeartbeat: ReturnType<typeof setInterval> | null = null;
  private liveValues: Int32Array | null = null;
  private projectRunProvider: ProjectRunProvider | null = null;
  private telemetryEnabled = false;
  private pageLifecycleObserved = false;
  private releaseDepartureParticipant: (() => void) | null = null;
  private operationEpoch = 0;
  private cancellation: Int32Array | null = null;
  private runtimeStartupTimeout: ReturnType<typeof setTimeout> | null = null;

  async connect(): Promise<void> {
    this.observePageLifecycle();
    if (this.worker) {
      return;
    }
    if (!("SharedWorker" in globalThis)) {
      throw new Error(
        "This browser does not support the virtual target worker",
      );
    }
    this.worker = new SharedWorker(
      new URL("./virtual-target.shared-worker.ts", import.meta.url),
      { type: "module", name: "ucsb-xrp-virtual-target-v6" },
    );
    this.worker.port.onmessage = (event: MessageEvent<TargetWorkerMessage>) =>
      this.handleMessage(event.data);
    this.worker.port.start();
    await this.request({
      type: "connect",
      providesProject: this.projectRunProvider !== null,
      role: this.deliveryRole(),
    });
  }

  disconnect(): void {
    this.operationEpoch += 1;
    this.stopObservingPageLifecycle();
    if (!this.worker) {
      return;
    }
    if (this.runtimeWorker) {
      this.worker.port.postMessage({
        type: "stop",
        requestId: `disconnect-${this.nextRequest}`,
      } satisfies TargetWorkerCommand);
    }
    this.terminateRuntime();
    for (const check of this.syntaxChecks) {
      check.cancel("Virtual target disconnected");
    }
    this.syntaxChecks.clear();
    this.worker.port.postMessage({
      type: "disconnect",
    } satisfies TargetWorkerCommand);
    this.worker = null;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Virtual target disconnected"));
    }
    this.pending.clear();
  }

  private readonly releaseOnPageHide = (event: PageTransitionEvent): void => {
    if (!event.persisted) this.disconnect();
  };

  private readonly stopOnBeforeUnload = (): void => {
    // beforeunload is only an attempted departure: choosing Stay must retain
    // this port, its Project provider, and terminal/recording events.
    this.operationEpoch += 1;
    this.terminateRuntime();
    this.worker?.port.postMessage({
      type: "stop-owned-run",
    } satisfies TargetWorkerCommand);
  };

  private observePageLifecycle(): void {
    if (
      this.pageLifecycleObserved ||
      typeof window === "undefined" ||
      typeof window.addEventListener !== "function"
    )
      return;
    window.addEventListener("pagehide", this.releaseOnPageHide);
    this.releaseDepartureParticipant = registerPageDeparture({
      cancel: this.stopOnBeforeUnload,
    });
    this.pageLifecycleObserved = true;
  }

  private stopObservingPageLifecycle(): void {
    if (
      !this.pageLifecycleObserved ||
      typeof window === "undefined" ||
      typeof window.removeEventListener !== "function"
    )
      return;
    window.removeEventListener("pagehide", this.releaseOnPageHide);
    this.releaseDepartureParticipant?.();
    this.releaseDepartureParticipant = null;
    this.pageLifecycleObserved = false;
  }

  async check(project: CourseProject): Promise<CheckResult> {
    const projectName = project.name?.trim() || project.entrypoint;
    const requestId = `virtual-validate-${this.nextAction++}`;
    this.publishConsole({
      type: "console",
      stream: "system",
      line: `Compile requested · ${projectName}`,
      action: "validate",
      phase: "request",
      requestId,
    });
    const portabilityError = portableProjectError(project);
    if (portabilityError) {
      const result: CheckResult = {
        ok: false,
        detail: portabilityError.message,
      };
      this.publishConsole({
        type: "console",
        stream: "system",
        line: `Compilation failed · ${result.detail}`,
        action: "validate",
        phase: "error",
        requestId,
      });
      return result;
    }
    try {
      const syntaxCheck = startCourseProjectSyntaxCheck(project);
      this.syntaxChecks.add(syntaxCheck);
      let result: CheckResult;
      try {
        result = await syntaxCheck.result;
      } finally {
        this.syntaxChecks.delete(syntaxCheck);
      }
      this.publishConsole({
        type: "console",
        stream: "system",
        line: `${result.ok ? "Compilation passed" : "Compilation failed"} · ${result.detail}`,
        action: "validate",
        phase: result.ok ? "result" : "error",
        requestId,
      });
      return result;
    } catch (error) {
      this.publishConsole({
        type: "console",
        stream: "system",
        line: `Compilation could not finish · ${errorDetail(error)}`,
        action: "validate",
        phase: "error",
        requestId,
      });
      throw error;
    }
  }

  async run(project: CourseProject, projectId?: string): Promise<void> {
    validatePortableProject(project);
    await this.withRunReservation(async (operationEpoch, localEpoch) => {
      const descriptor = await describeProject(project);
      this.assertOperation(localEpoch);
      await this.startRun(
        {
          type: "prepare-run",
          operationEpoch,
          project,
          descriptor,
          ...(projectId ? { projectId } : {}),
        },
        localEpoch,
      );
    });
  }

  async runCurrent(): Promise<void> {
    await this.withRunReservation(async (operationEpoch, localEpoch) => {
      const staged = (await this.request({ type: "get-project" })) as {
        project?: CourseProject;
        projectId?: string;
        storedProjectId?: string;
        descriptor?: SynchronizedProject;
      };
      if (!staged.project || !staged.descriptor) {
        throw new Error(
          "No project is ready. Open a project in the IDE first.",
        );
      }
      validatePortableProject(staged.project);
      const descriptor = await describeProject(staged.project);
      this.assertOperation(localEpoch);
      const retainedProjectIsExact =
        staged.projectId === staged.storedProjectId &&
        !staged.descriptor.stale &&
        staged.descriptor.revision === descriptor.revision &&
        staged.descriptor.name === descriptor.name &&
        staged.descriptor.entrypoint === descriptor.entrypoint;
      if (!retainedProjectIsExact) {
        await this.startRun(
          {
            type: "prepare-run",
            operationEpoch,
            project: staged.project,
            descriptor,
            ...(staged.projectId ? { projectId: staged.projectId } : {}),
          },
          localEpoch,
        );
        return;
      }
      await this.startRun({ type: "prepare-run", operationEpoch }, localEpoch);
    });
  }

  private assertOperation(epoch: number): void {
    if (epoch !== this.operationEpoch || !this.worker)
      throw new Error("Run cancelled");
  }

  private async withRunReservation(
    work: (operationEpoch: number, localEpoch: number) => Promise<void>,
  ): Promise<void> {
    const localEpoch = ++this.operationEpoch;
    const reservation = (await this.request({ type: "reserve-run" })) as {
      operationEpoch: number;
    };
    try {
      this.assertOperation(localEpoch);
      await work(reservation.operationEpoch, localEpoch);
    } catch (error) {
      if (this.worker)
        await this.request({
          type: "cancel-run",
          operationEpoch: reservation.operationEpoch,
        }).catch(() => undefined);
      throw error;
    }
  }

  setProjectRunProvider(
    provider: ProjectRunProvider | null,
    options?: { takeover?: boolean },
  ): void {
    this.projectRunProvider = provider;
    this.worker?.port.postMessage({
      type: "set-role",
      role: this.deliveryRole(),
    } satisfies TargetWorkerCommand);
    this.worker?.port.postMessage({
      type: "set-project-run-provider",
      providesProject: provider !== null,
      takeover: options?.takeover === true,
    } satisfies TargetWorkerCommand);
  }

  setTelemetryEnabled(enabled: boolean): void {
    this.telemetryEnabled = enabled;
    this.worker?.port.postMessage({
      type: "set-role",
      role: this.deliveryRole(),
    } satisfies TargetWorkerCommand);
  }

  private deliveryRole(): TargetWorkerRole {
    return this.telemetryEnabled || this.projectRunProvider === null
      ? "monitor"
      : "ide";
  }

  markProjectChanged(project: ProjectRevisionNotice): void {
    this.worker?.port.postMessage({
      type: "mark-project-changed",
      project,
    } satisfies TargetWorkerCommand);
  }

  private async startRun(
    command:
      | { type: "prepare-run"; operationEpoch?: number }
      | {
          type: "prepare-run";
          operationEpoch?: number;
          project: CourseProject;
          descriptor: SynchronizedProject;
          projectId?: string;
        },
    localEpoch = this.operationEpoch,
  ): Promise<void> {
    this.terminateRuntime();
    const { runId, scenario, world, project } = (await this.request(
      command,
    )) as PreparedRun;
    this.assertOperation(localEpoch);
    let runtimeWorker: Worker;
    try {
      runtimeWorker = this.createMicroPythonWorker(
        "ucsb-xrp-micropython-runtime",
      );
    } catch (error) {
      this.forwardRuntimeMessage(runId, {
        type: "error",
        detail: errorDetail(error),
      });
      throw error;
    }
    this.runtimeWorker = runtimeWorker;
    this.activeRunId = runId;
    if (
      typeof SharedArrayBuffer === "function" &&
      globalThis.crossOriginIsolated
    ) {
      this.liveValues = new Int32Array(
        new SharedArrayBuffer(
          Int32Array.BYTES_PER_ELEMENT * MAX_RUNTIME_PARAMETERS,
        ),
      );
      this.cancellation = new Int32Array(
        new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT),
      );
    } else {
      this.liveValues = null;
    }
    this.startRunHeartbeat(runId);
    let runtimeReady = false;
    const armDeadline = (durationMs: number, detail: string) => {
      this.clearRuntimeStartupDeadline();
      this.runtimeStartupTimeout = setTimeout(() => {
        if (runtimeWorker !== this.runtimeWorker) return;
        this.forwardRuntimeMessage(runId, {
          type: "error",
          stage: "compile",
          detail,
        });
        this.terminateRuntime(runId);
      }, durationMs);
    };
    armDeadline(
      BROWSER_RUNTIME_STARTUP_TIMEOUT_MS,
      "MicroPython runtime did not finish loading within 15 seconds. Check the connection or offline setup, then try Run again.",
    );
    runtimeWorker.onmessage = (event: MessageEvent<RuntimeWorkerMessage>) => {
      if (runtimeWorker !== this.runtimeWorker) {
        return;
      }
      const message = event.data;
      if (message.type === "runtime-ready" && !runtimeReady) {
        runtimeReady = true;
        armDeadline(
          BROWSER_SYNTAX_CHECK_TIMEOUT_MS,
          "MicroPython compilation timed out after 2.5 seconds. Check the project, then try Run again.",
        );
      } else if (message.type === "compile-complete") {
        this.clearRuntimeStartupDeadline();
      }
      this.forwardRuntimeMessage(runId, message);
      if (message.type === "run-complete" || message.type === "error") {
        this.terminateRuntime(runId);
      }
    };
    runtimeWorker.onerror = (event) => {
      if (runtimeWorker !== this.runtimeWorker) {
        return;
      }
      this.forwardRuntimeMessage(runId, {
        type: "error",
        detail: event.message || "MicroPython runtime worker failed",
      });
      this.terminateRuntime(runId);
    };
    try {
      runtimeWorker.postMessage({
        mode: "run",
        project: projectWithSelectedWorld(project, scenario),
        scenario,
        world,
        liveParameterBuffer: this.liveValues?.buffer,
        cancellationBuffer: this.cancellation?.buffer,
      });
    } catch (error) {
      this.forwardRuntimeMessage(runId, {
        type: "error",
        stage: "compile",
        detail: errorDetail(error),
      });
      this.terminateRuntime(runId);
      throw error;
    }
  }

  async synchronize(project: CourseProject, projectId?: string): Promise<void> {
    const result = await this.check(project);
    if (!result.ok) {
      throw new Error(result.detail);
    }
    const descriptor = await describeProject(project);
    await this.request({
      type: "store-project",
      project,
      descriptor,
      ...(projectId ? { projectId } : {}),
    });
    this.publishConsole({
      type: "console",
      stream: "system",
      line: "Project prepared for the virtual XRP",
      action: "flash",
      phase: "result",
    });
  }

  async markProjectStale(
    project: CourseProject,
    projectId?: string,
  ): Promise<void> {
    const descriptor = await describeProject(project);
    await this.request({
      type: "mark-project-stale",
      project,
      descriptor,
      ...(projectId ? { projectId } : {}),
    });
  }

  async stop(): Promise<void> {
    this.operationEpoch += 1;
    this.terminateRuntime();
    await this.request({ type: "stop" });
  }

  async reset(): Promise<void> {
    this.operationEpoch += 1;
    this.terminateRuntime();
    await this.request({ type: "reset" });
  }

  async setRuntimeParameter(
    name: string,
    value: RuntimeParameterValue,
  ): Promise<void> {
    await this.request({ type: "set-runtime-parameter", name, value });
  }

  async setSimulationScenario(scenario: SimulationScenario): Promise<void> {
    await this.request({ type: "set-scenario", scenario });
  }

  subscribe(listener: (event: TargetEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private request(
    command:
      | { type: "reserve-run" }
      | { type: "cancel-run"; operationEpoch: number }
      | {
          type: "connect";
          providesProject: boolean;
          role: TargetWorkerRole;
        }
      | {
          type: "prepare-run";
          operationEpoch?: number;
          project?: CourseProject;
          descriptor?: SynchronizedProject;
          projectId?: string;
        }
      | {
          type: "store-project";
          project: CourseProject;
          descriptor: SynchronizedProject;
          projectId?: string;
        }
      | {
          type: "mark-project-stale";
          project: CourseProject;
          descriptor: SynchronizedProject;
          projectId?: string;
        }
      | { type: "get-project" }
      | { type: "set-scenario"; scenario: SimulationScenario }
      | {
          type: "set-runtime-parameter";
          name: string;
          value: RuntimeParameterValue;
        }
      | { type: "stop" }
      | { type: "reset" },
  ): Promise<unknown> {
    if (!this.worker) {
      return Promise.reject(new Error("Virtual target is not connected"));
    }
    const requestId = `request-${this.nextRequest}`;
    this.nextRequest += 1;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`Virtual target ${command.type} timed out`));
      }, 15_000);
      this.pending.set(requestId, { resolve, reject, timeout });
      this.worker?.port.postMessage({ ...command, requestId });
    });
  }

  private handleMessage(message: TargetWorkerMessage): void {
    if (message.type === "project-run-snapshot-request") {
      const worker = this.worker;
      const provider = this.projectRunProvider;
      void Promise.resolve()
        .then(() => {
          if (!provider)
            throw new Error(
              "The IDE is not ready to provide its current project.",
            );
          return provider();
        })
        .then(
          (snapshot) => {
            if (worker && worker === this.worker)
              worker.port.postMessage({
                type: "project-run-snapshot",
                requestId: message.requestId,
                snapshot,
              } satisfies TargetWorkerCommand);
          },
          (error: unknown) => {
            if (worker && worker === this.worker)
              worker.port.postMessage({
                type: "project-run-snapshot",
                requestId: message.requestId,
                error: errorDetail(error),
              } satisfies TargetWorkerCommand);
          },
        );
      return;
    }

    if (message.type === "telemetry-batch") {
      for (const event of message.events) {
        this.emit({ ...event, replayed: true });
      }
      return;
    }
    if (message.type === "event") {
      for (const listener of this.listeners) {
        listener(message.event);
      }
      return;
    }
    if (message.type === "terminate-runtime") {
      this.terminateRuntime(message.runId);
      return;
    }
    if (message.type === "apply-runtime-parameter") {
      if (
        message.runId === this.activeRunId &&
        this.liveValues &&
        message.slot >= 0 &&
        message.slot < this.liveValues.length
      ) {
        Atomics.store(this.liveValues, message.slot, message.encoded);
      }
      return;
    }
    const pending = this.pending.get(message.requestId);
    if (!pending) {
      return;
    }
    clearTimeout(pending.timeout);
    this.pending.delete(message.requestId);
    if (message.ok) {
      pending.resolve(message.result);
    } else {
      pending.reject(new Error(message.error));
    }
  }

  private createMicroPythonWorker(name: string): Worker {
    return new Worker(new URL("./micropython.worker.ts", import.meta.url), {
      type: "module",
      name,
    });
  }

  private forwardRuntimeMessage(
    runId: number,
    message: RuntimeWorkerMessage,
  ): void {
    this.worker?.port.postMessage({
      type: "runtime-message",
      runId,
      message,
    } satisfies TargetWorkerCommand);
  }

  private startRunHeartbeat(runId: number): void {
    this.stopRunHeartbeat();
    const heartbeat = () => {
      if (this.activeRunId !== runId) {
        return;
      }
      this.worker?.port.postMessage({
        type: "run-owner-heartbeat",
        runId,
      } satisfies TargetWorkerCommand);
    };
    heartbeat();
    this.runHeartbeat = setInterval(heartbeat, 400);
  }

  private stopRunHeartbeat(): void {
    if (this.runHeartbeat !== null) {
      clearInterval(this.runHeartbeat);
      this.runHeartbeat = null;
    }
  }

  private emit(event: TargetEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private publishConsole(
    event: Extract<TargetEvent, { type: "console" }> & TargetConsoleMetadata,
  ): void {
    if (this.worker) {
      this.worker.port.postMessage({
        type: "publish-console",
        event,
      } satisfies TargetWorkerCommand);
      return;
    }
    this.emit({
      ...event,
      eventId: event.eventId ?? `virtual-client-${this.nextAction++}`,
      timestampMs: event.timestampMs ?? Date.now(),
    });
  }

  private terminateRuntime(runId?: number): void {
    if (
      runId !== undefined &&
      this.activeRunId !== null &&
      runId !== this.activeRunId
    ) {
      return;
    }
    this.clearRuntimeStartupDeadline();
    this.stopRunHeartbeat();
    if (this.cancellation) Atomics.store(this.cancellation, 0, 1);
    this.runtimeWorker?.terminate();
    this.runtimeWorker = null;
    this.activeRunId = null;
    this.liveValues = null;
    this.cancellation = null;
  }

  private clearRuntimeStartupDeadline(): void {
    if (this.runtimeStartupTimeout !== null)
      clearTimeout(this.runtimeStartupTimeout);
    this.runtimeStartupTimeout = null;
  }
}
