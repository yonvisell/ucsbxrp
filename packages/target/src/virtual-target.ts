import type {
  RuntimeWorkerMessage,
  TargetWorkerCommand,
  TargetWorkerMessage,
} from "./worker-protocol";
import type { SimulationScenario, WorldDefinition } from "@ucsb-xrp/simulator";
import type {
  CheckResult,
  CourseProject,
  SynchronizedProject,
  TargetClient,
  TargetConsoleMetadata,
  TargetEvent,
} from "./types";
import { describeProject } from "./project-identity";
import { projectWithSelectedWorld } from "./project-world";
import { MAX_RUNTIME_PARAMETERS } from "./runtime-controls";
import type { RuntimeParameterValue } from "./types";

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
    const timeout = setTimeout(() => {
      finish();
      reject(new Error("Component checks timed out"));
    }, 20_000);
    worker.onmessage = (event: MessageEvent<RuntimeWorkerMessage>) => {
      const message = event.data;
      if (message.type === "console") {
        output.push(message.line);
      } else if (message.type === "test-complete") {
        finish();
        resolve({ ok: true, detail: message.detail, output });
      } else if (message.type === "error") {
        finish();
        resolve({ ok: false, detail: message.detail, output });
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
  private readonly checkWorkers = new Set<Worker>();
  private readonly listeners = new Set<(event: TargetEvent) => void>();
  private readonly pending = new Map<string, PendingRequest>();
  private nextRequest = 1;
  private nextAction = 1;
  private runHeartbeat: ReturnType<typeof setInterval> | null = null;
  private liveValues: Int32Array | null = null;

  async connect(): Promise<void> {
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
      { type: "module", name: "ucsb-xrp-virtual-target-v3" },
    );
    this.worker.port.onmessage = (event: MessageEvent<TargetWorkerMessage>) =>
      this.handleMessage(event.data);
    this.worker.port.start();
    await this.request({ type: "connect" });
  }

  disconnect(): void {
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
    for (const checker of this.checkWorkers) {
      checker.terminate();
    }
    this.checkWorkers.clear();
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

  async check(project: CourseProject): Promise<CheckResult> {
    const projectName = project.name?.trim() || project.entrypoint;
    const requestId = `virtual-validate-${this.nextAction++}`;
    this.publishConsole({
      type: "console",
      stream: "system",
      line: `Validating ${projectName}`,
      action: "validate",
      phase: "request",
      requestId,
    });
    try {
      const result = await new Promise<CheckResult>((resolve, reject) => {
        let checker: Worker;
        try {
          checker = this.createMicroPythonWorker("ucsb-xrp-micropython-check");
        } catch (error) {
          reject(new Error(errorDetail(error)));
          return;
        }
        this.checkWorkers.add(checker);
        const finish = () => {
          clearTimeout(timeout);
          checker.terminate();
          this.checkWorkers.delete(checker);
        };
        const timeout = setTimeout(() => {
          finish();
          reject(new Error("MicroPython project check timed out"));
        }, 20_000);
        checker.onmessage = (event: MessageEvent<RuntimeWorkerMessage>) => {
          const message = event.data;
          if (message.type === "check-complete") {
            finish();
            resolve({ ok: true, detail: message.detail });
          } else if (message.type === "error") {
            finish();
            resolve({ ok: false, detail: message.detail });
          }
        };
        checker.onerror = (event) => {
          finish();
          reject(
            new Error(event.message || "MicroPython project checker failed"),
          );
        };
        checker.postMessage({ mode: "check", project });
      });
      this.publishConsole({
        type: "console",
        stream: "system",
        line: `${result.ok ? "Validation passed" : "Validation failed"} · ${result.detail}`,
        action: "validate",
        phase: result.ok ? "result" : "error",
        requestId,
      });
      return result;
    } catch (error) {
      this.publishConsole({
        type: "console",
        stream: "system",
        line: `Validation could not finish · ${errorDetail(error)}`,
        action: "validate",
        phase: "error",
        requestId,
      });
      throw error;
    }
  }

  async run(project: CourseProject): Promise<void> {
    const descriptor = await describeProject(project);
    await this.startRun({ type: "prepare-run", project, descriptor });
  }

  async runCurrent(): Promise<void> {
    await this.startRun({ type: "prepare-run" });
  }

  private async startRun(
    command:
      | { type: "prepare-run" }
      | {
          type: "prepare-run";
          project: CourseProject;
          descriptor: SynchronizedProject;
        },
  ): Promise<void> {
    this.terminateRuntime();
    const { runId, scenario, world, project } = (await this.request(
      command,
    )) as PreparedRun;
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
    } else {
      this.liveValues = null;
    }
    this.startRunHeartbeat(runId);
    runtimeWorker.onmessage = (event: MessageEvent<RuntimeWorkerMessage>) => {
      if (runtimeWorker !== this.runtimeWorker) {
        return;
      }
      const message = event.data;
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
    runtimeWorker.postMessage({
      mode: "run",
      project: projectWithSelectedWorld(project, scenario),
      scenario,
      world,
      liveParameterBuffer: this.liveValues?.buffer,
    });
  }

  async synchronize(project: CourseProject): Promise<void> {
    const result = await this.check(project);
    if (!result.ok) {
      throw new Error(result.detail);
    }
    const descriptor = await describeProject(project);
    await this.request({ type: "store-project", project, descriptor });
    this.publishConsole({
      type: "console",
      stream: "system",
      line: "Project prepared for the virtual XRP",
      action: "flash",
      phase: "result",
    });
  }

  async markProjectStale(project: CourseProject): Promise<void> {
    const descriptor = await describeProject(project);
    await this.request({
      type: "mark-project-stale",
      revision: descriptor.revision,
    });
  }

  async stop(): Promise<void> {
    this.terminateRuntime();
    await this.request({ type: "stop" });
  }

  async reset(): Promise<void> {
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
      | { type: "connect" }
      | {
          type: "prepare-run";
          project?: CourseProject;
          descriptor?: SynchronizedProject;
        }
      | {
          type: "store-project";
          project: CourseProject;
          descriptor: SynchronizedProject;
        }
      | { type: "mark-project-stale"; revision: string }
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
    this.stopRunHeartbeat();
    this.runtimeWorker?.terminate();
    this.runtimeWorker = null;
    this.activeRunId = null;
    this.liveValues = null;
  }
}
