import type {
  CheckResult,
  CourseProject,
  SynchronizedProject,
  TargetClient,
  TargetEvent,
  TargetRunState,
  TelemetrySample,
} from "./types";
import type {
  PhysicalWorkerCommand,
  PhysicalWorkerMessage,
} from "./physical-worker-protocol";
import { describeProject } from "./project-identity";

interface PhysicalProjectManifest {
  name: string;
  entrypoint: string;
  revision?: string;
  files?: string[];
  bytes?: number;
}

interface PhysicalInfo {
  protocol: number;
  serviceVersion: string;
  courseRelease: string;
  bootId: string;
  robotName: string;
  address: string;
  capabilities: string[];
  project?: PhysicalProjectManifest | null;
}

interface PhysicalLog {
  seq: number;
  stream: "stdout" | "stderr" | "system";
  line: string;
}

interface PhysicalState {
  bootId: string;
  state: TargetRunState;
  detail: string;
  runId: number;
  logs: PhysicalLog[];
  sample?: TelemetrySample;
  project?: PhysicalProjectManifest | null;
}

interface CommandReply<T> {
  protocol: number;
  requestId: string;
  ok: boolean;
  result?: T;
  error?: { code: string; detail: string };
}

export interface PhysicalTargetOptions {
  fetch?: typeof fetch;
  pollIntervalMs?: number;
  requestTimeoutMs?: number;
}

export class PhysicalTargetError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "PhysicalTargetError";
  }
}

export function normalizePhysicalEndpoint(value: string): string {
  const withScheme = /^https?:\/\//i.test(value.trim())
    ? value.trim()
    : `http://${value.trim()}`;
  const url = new URL(withScheme);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Physical XRP address must use HTTP or HTTPS");
  }
  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function errorDetail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class DirectPhysicalTargetClient implements TargetClient {
  readonly kind = "physical" as const;
  readonly endpoint: string;
  private readonly fetchImplementation: typeof fetch;
  private readonly pollIntervalMs: number;
  private readonly requestTimeoutMs: number;
  private readonly listeners = new Set<(event: TargetEvent) => void>();
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private connected = false;
  private reconnecting = false;
  private connectGeneration = 0;
  private nextRequest = 1;
  private lastLogSeq = 0;
  private bootId: string | null = null;
  private lastRunId = 0;
  private lastLeaseAt = 0;
  private currentProject: SynchronizedProject | null = null;
  private projectStateKnown = false;
  private info: PhysicalInfo | null = null;

  constructor(endpoint: string, options: PhysicalTargetOptions = {}) {
    this.endpoint = normalizePhysicalEndpoint(endpoint);
    this.fetchImplementation =
      options.fetch ?? ((input, init) => globalThis.fetch(input, init));
    this.pollIntervalMs = options.pollIntervalMs ?? 250;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 8_000;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }
    const generation = this.connectGeneration + 1;
    this.connectGeneration = generation;
    this.emitStatus("connecting", `Connecting to ${this.endpoint}`);
    const info = await this.getJson<PhysicalInfo>("/api/v1/info");
    if (generation !== this.connectGeneration) {
      return;
    }
    if (info.protocol !== 1) {
      throw new PhysicalTargetError(
        "protocol_mismatch",
        `XRP protocol ${info.protocol} is not supported by this app`,
      );
    }
    const required = [
      "project.check",
      "project.sync",
      "program.run",
      "program.stop",
      "target.reset",
      "telemetry.poll",
    ];
    const missing = required.filter(
      (capability) => !info.capabilities.includes(capability),
    );
    if (missing.length > 0) {
      throw new PhysicalTargetError(
        "capability_mismatch",
        `XRP service is missing ${missing.join(", ")}`,
      );
    }
    this.info = info;
    this.bootId = info.bootId;
    this.connected = true;
    this.emitStatus(
      "ready",
      `${info.robotName} · ${info.address} · course ${info.courseRelease}`,
    );
    this.consumeProjectManifest(info.project);
    this.schedulePoll(0);
  }

  disconnect(): void {
    this.connectGeneration += 1;
    this.connected = false;
    this.stopPolling();
    this.emitStatus("disconnected", "Physical XRP disconnected");
  }

  async check(project: CourseProject): Promise<CheckResult> {
    try {
      const result = await this.command<{ detail: string }>("check", {
        project,
      });
      return { ok: true, detail: result.detail };
    } catch (error) {
      if (
        error instanceof PhysicalTargetError &&
        error.code === "syntax_error"
      ) {
        return { ok: false, detail: error.message };
      }
      throw error;
    }
  }

  async synchronize(project: CourseProject): Promise<void> {
    const descriptor = await describeProject(project);
    const result = await this.command<{
      detail: string;
      project?: PhysicalProjectManifest;
    }>("sync", { project });
    this.setCurrentProject({
      ...descriptor,
      revision: result.project?.revision ?? descriptor.revision,
      name: result.project?.name ?? descriptor.name,
      entrypoint: result.project?.entrypoint ?? descriptor.entrypoint,
      stale: false,
    });
    this.emit({ type: "console", stream: "system", line: result.detail });
  }

  async run(project: CourseProject): Promise<void> {
    const descriptor = await describeProject(project);
    if (
      !this.currentProject ||
      this.currentProject.stale ||
      descriptor.revision !== this.currentProject.revision
    ) {
      await this.synchronize(project);
    }
    await this.runCurrent();
  }

  async runCurrent(): Promise<void> {
    if (!this.currentProject) {
      throw new PhysicalTargetError(
        "no_project",
        "No project is ready. Run or synchronize a project in the IDE first.",
      );
    }
    if (this.currentProject.stale) {
      throw new PhysicalTargetError(
        "stale_project",
        "The IDE project has changed. Run or synchronize it in the IDE first.",
      );
    }
    const result = await this.command<{ detail: string; runId: number }>(
      "run",
      {},
    );
    this.lastRunId = result.runId;
    this.lastLeaseAt = 0;
    this.emitStatus("running", result.detail);
  }

  async markProjectStale(project: CourseProject): Promise<void> {
    const descriptor = await describeProject(project);
    if (
      this.currentProject &&
      descriptor.revision !== this.currentProject.revision &&
      !this.currentProject.stale
    ) {
      this.setCurrentProject({ ...this.currentProject, stale: true });
    }
  }

  async stop(): Promise<void> {
    this.reconnecting = true;
    this.stopPolling();
    try {
      const result = await this.command<{
        detail: string;
        reconnecting: boolean;
      }>("stop", {});
      this.emitStatus("connecting", `${result.detail}; reconnecting…`);
      await this.reconnectAfterReset();
    } finally {
      this.reconnecting = false;
      this.schedulePoll(0);
    }
  }

  async reset(): Promise<void> {
    this.reconnecting = true;
    this.stopPolling();
    try {
      const result = await this.command<{
        detail: string;
        reconnecting: boolean;
      }>("reset", {});
      this.emitStatus("connecting", `${result.detail}; reconnecting…`);
      await this.reconnectAfterReset();
    } finally {
      this.reconnecting = false;
      this.schedulePoll(0);
    }
  }

  subscribe(listener: (event: TargetEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async command<T>(
    name: string,
    value: Record<string, unknown>,
  ): Promise<T> {
    if (!this.connected) {
      throw new PhysicalTargetError(
        "not_connected",
        "Physical XRP is not connected",
      );
    }
    const requestId = `web-${Date.now()}-${this.nextRequest++}`;
    const reply = await this.fetchJson<CommandReply<T>>(`/api/v1/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...value, requestId }),
    });
    if (reply.requestId !== requestId) {
      throw new PhysicalTargetError(
        "uncorrelated_reply",
        "The XRP returned a reply for a different request",
      );
    }
    if (!reply.ok || !reply.result) {
      throw new PhysicalTargetError(
        reply.error?.code ?? "target_error",
        reply.error?.detail ?? "The XRP rejected the request",
      );
    }
    return reply.result;
  }

  private async getJson<T>(
    path: string,
    timeoutMs = this.requestTimeoutMs,
  ): Promise<T> {
    return this.fetchJson<T>(path, { method: "GET" }, timeoutMs);
  }

  private async fetchJson<T>(
    path: string,
    init: RequestInit,
    timeoutMs = this.requestTimeoutMs,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await this.fetchImplementation(this.endpoint + path, {
        ...init,
        cache: "no-store",
        signal: controller.signal,
      });
      const value = (await response.json()) as unknown;
      if (!response.ok) {
        const candidate = value as {
          error?: { code?: string; detail?: string };
        };
        const error = candidate?.error;
        throw new PhysicalTargetError(
          error?.code ?? `http_${response.status}`,
          error?.detail ?? `XRP request failed with HTTP ${response.status}`,
        );
      }
      return value as T;
    } catch (error) {
      if (error instanceof PhysicalTargetError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new PhysicalTargetError(
          "timeout",
          `XRP did not reply within ${timeoutMs / 1000} seconds`,
        );
      }
      throw new PhysicalTargetError(
        "network_error",
        `Cannot reach ${this.endpoint}: ${errorDetail(error)}`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private schedulePoll(delay = this.pollIntervalMs): void {
    this.stopPolling();
    if (!this.connected) {
      return;
    }
    this.pollTimer = setTimeout(() => void this.poll(), delay);
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async poll(): Promise<void> {
    if (!this.connected || this.reconnecting) {
      return;
    }
    try {
      const state = await this.getJson<PhysicalState>(
        `/api/v1/telemetry?afterLogSeq=${this.lastLogSeq}`,
      );
      if (!this.connected || this.reconnecting) {
        return;
      }
      this.consumeState(state);
      if (
        state.state === "running" &&
        performance.now() - this.lastLeaseAt >= 800
      ) {
        this.lastLeaseAt = performance.now();
        await this.command("lease", { runId: state.runId });
      }
      this.schedulePoll();
    } catch (error) {
      if (this.connected && !this.reconnecting) {
        this.emitStatus("error", errorDetail(error));
        this.schedulePoll(900);
      }
    }
  }

  private consumeState(state: PhysicalState): void {
    if (state.bootId !== this.bootId) {
      this.bootId = state.bootId;
      this.lastLogSeq = 0;
    }
    this.lastRunId = state.runId;
    this.consumeProjectManifest(state.project);
    this.emitStatus(state.state, state.detail);
    if (state.sample) {
      this.emit({ type: "telemetry", sample: state.sample });
    }
    for (const entry of state.logs) {
      this.lastLogSeq = Math.max(this.lastLogSeq, entry.seq);
      this.emit({
        type: "console",
        stream: entry.stream,
        line: entry.line,
      });
    }
  }

  private async reconnectAfterReset(): Promise<void> {
    this.stopPolling();
    const deadline = performance.now() + 20_000;
    let lastError: unknown = null;
    while (performance.now() < deadline && this.connected) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      try {
        const info = await this.getJson<PhysicalInfo>("/api/v1/info", 1_500);
        this.info = info;
        this.bootId = info.bootId;
        this.lastLogSeq = 0;
        this.emitStatus(
          "ready",
          `${info.robotName} · ${info.address} · course ${info.courseRelease}`,
        );
        this.consumeProjectManifest(info.project);
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw new PhysicalTargetError(
      "reconnect_failed",
      `Physical XRP did not return after reset: ${errorDetail(lastError)}`,
    );
  }

  private emitStatus(state: TargetRunState, detail: string): void {
    this.emit({ type: "status", state, detail });
  }

  private consumeProjectManifest(
    manifest: PhysicalProjectManifest | null | undefined,
  ): void {
    if (manifest === undefined) {
      return;
    }
    if (manifest === null) {
      this.setCurrentProject(null);
      return;
    }
    if (!manifest.revision) {
      if (!this.projectStateKnown) {
        this.setCurrentProject(null);
      }
      return;
    }
    const stale =
      this.currentProject?.revision === manifest.revision
        ? this.currentProject.stale
        : false;
    this.setCurrentProject({
      name: manifest.name || manifest.entrypoint,
      entrypoint: manifest.entrypoint,
      revision: manifest.revision,
      stale,
    });
  }

  private setCurrentProject(project: SynchronizedProject | null): void {
    if (
      this.projectStateKnown &&
      this.currentProject?.revision === project?.revision &&
      this.currentProject?.stale === project?.stale &&
      this.currentProject?.name === project?.name &&
      this.currentProject?.entrypoint === project?.entrypoint
    ) {
      return;
    }
    this.projectStateKnown = true;
    this.currentProject = project;
    this.emit({ type: "project", project });
  }

  private emit(event: TargetEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

interface PendingWorkerRequest {
  resolve(value: unknown): void;
  reject(reason: Error): void;
  timeout: ReturnType<typeof setTimeout>;
}

/**
 * Browser-facing physical target.
 *
 * The IDE and Monitor often remain open together. A SharedWorker gives those
 * tabs one polling connection to the MicroPython HTTP service and broadcasts
 * the same status, telemetry, and console stream to both. Tests and browsers
 * without SharedWorker support retain the direct client above.
 */
export class PhysicalTargetClient implements TargetClient {
  readonly kind = "physical" as const;
  readonly endpoint: string;
  private readonly options: PhysicalTargetOptions;
  private direct: DirectPhysicalTargetClient | null = null;
  private worker: SharedWorker | null = null;
  private readonly listeners = new Set<(event: TargetEvent) => void>();
  private readonly pending = new Map<string, PendingWorkerRequest>();
  private nextRequest = 1;

  constructor(endpoint: string, options: PhysicalTargetOptions = {}) {
    this.endpoint = normalizePhysicalEndpoint(endpoint);
    this.options = options;
    if (options.fetch || !("SharedWorker" in globalThis)) {
      this.useDirectClient();
    }
  }

  async connect(): Promise<void> {
    if (this.direct) {
      await this.direct.connect();
      return;
    }
    if (this.worker) {
      return;
    }
    try {
      this.worker = new SharedWorker(
        new URL("./physical-target.shared-worker.ts", import.meta.url),
        { type: "module", name: "ucsb-xrp-physical-target-v1" },
      );
      this.worker.port.onmessage = (
        event: MessageEvent<PhysicalWorkerMessage>,
      ) => this.handleWorkerMessage(event.data);
      this.worker.port.start();
    } catch (error) {
      this.releaseWorker(errorDetail(error));
      await this.useDirectClient().connect();
      return;
    }
    try {
      await this.request({ type: "connect", endpoint: this.endpoint });
    } catch (error) {
      this.releaseWorker(errorDetail(error));
      throw error;
    }
  }

  disconnect(): void {
    if (this.direct) {
      this.direct.disconnect();
      return;
    }
    this.releaseWorker("Physical target disconnected");
  }

  async check(project: CourseProject): Promise<CheckResult> {
    if (this.direct) {
      return this.direct.check(project);
    }
    return (await this.request({ type: "check", project })) as CheckResult;
  }

  async synchronize(project: CourseProject): Promise<void> {
    if (this.direct) {
      await this.direct.synchronize(project);
      return;
    }
    await this.request({ type: "sync", project });
  }

  async run(project: CourseProject): Promise<void> {
    if (this.direct) {
      await this.direct.run(project);
      return;
    }
    await this.request({ type: "run", project });
  }

  async runCurrent(): Promise<void> {
    if (this.direct) {
      await this.direct.runCurrent();
      return;
    }
    await this.request({ type: "run-current" });
  }

  async markProjectStale(project: CourseProject): Promise<void> {
    if (this.direct) {
      await this.direct.markProjectStale(project);
      return;
    }
    await this.request({ type: "mark-project-stale", project });
  }

  async stop(): Promise<void> {
    if (this.direct) {
      await this.direct.stop();
      return;
    }
    await this.request({ type: "stop" });
  }

  async reset(): Promise<void> {
    if (this.direct) {
      await this.direct.reset();
      return;
    }
    await this.request({ type: "reset" });
  }

  subscribe(listener: (event: TargetEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private useDirectClient(): DirectPhysicalTargetClient {
    if (!this.direct) {
      this.direct = new DirectPhysicalTargetClient(this.endpoint, this.options);
      this.direct.subscribe((event) => this.emit(event));
    }
    return this.direct;
  }

  private request(
    command:
      | { type: "connect"; endpoint: string }
      | { type: "check"; project: CourseProject }
      | { type: "sync"; project: CourseProject }
      | { type: "run"; project: CourseProject }
      | { type: "run-current" }
      | { type: "mark-project-stale"; project: CourseProject }
      | { type: "stop" }
      | { type: "reset" },
  ): Promise<unknown> {
    if (!this.worker) {
      return Promise.reject(new Error("Physical target is not connected"));
    }
    const requestId = `physical-${this.nextRequest}`;
    this.nextRequest += 1;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(requestId);
        reject(new Error(`Physical target ${command.type} timed out`));
      }, 35_000);
      this.pending.set(requestId, { resolve, reject, timeout });
      this.worker?.port.postMessage({ ...command, requestId });
    });
  }

  private handleWorkerMessage(message: PhysicalWorkerMessage): void {
    if (message.type === "event") {
      this.emit(message.event);
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

  private releaseWorker(detail: string): void {
    const worker = this.worker;
    this.worker = null;
    this.rejectPending(detail);
    if (!worker) {
      return;
    }
    try {
      worker.port.postMessage({
        type: "disconnect",
      } satisfies PhysicalWorkerCommand);
    } catch {
      // A construction failure can leave a port object that cannot receive.
    } finally {
      // Let the disconnect message reach the SharedWorker before disentangling
      // the port. This matters during React's intentional effect remounts.
      setTimeout(() => worker.port.close(), 100);
    }
  }

  private rejectPending(detail: string): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(detail));
    }
    this.pending.clear();
  }

  private emit(event: TargetEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
