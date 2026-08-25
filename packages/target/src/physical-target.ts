import type {
  CheckResult,
  CourseProject,
  SynchronizedProject,
  TargetClient,
  TargetEvent,
  TargetRunState,
  TelemetrySample,
  RuntimeParameterValue,
  RuntimeState,
} from "./types";
import type {
  PhysicalWorkerCommand,
  PhysicalWorkerMessage,
} from "./physical-worker-protocol";
import { describeProject } from "./project-identity";
import { worldCatalogForProject } from "./project-world";
import { EMPTY_RUNTIME_STATE, parseRuntimeState } from "./runtime-controls";
import { parseWorldCatalog } from "@ucsb-xrp/simulator";
import courseRelease from "../../../vendor/current/release.json";

export const CURRENT_COURSE_RELEASE = courseRelease.release_id;

interface PhysicalProjectManifest {
  name: string;
  entrypoint: string;
  revision?: string;
  files?: string[];
  bytes?: number;
  worldJson?: string;
}

interface PhysicalInfo {
  protocol: number;
  serviceVersion: string;
  courseRelease: string;
  bootId: string;
  robotName: string;
  address: string;
  network?: {
    mode?: "access_point" | "station";
    requested_mode?: "access_point" | "station";
    fallback?: boolean;
    ssid?: string;
  };
  capabilities: string[];
  project?: PhysicalProjectManifest | null;
  runtimeJson?: string;
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
  samples?: TelemetrySample[];
  project?: PhysicalProjectManifest | null;
  runtimeJson?: string;
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
  activePollIntervalMs?: number;
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

type LocalNetworkRequestInit = RequestInit & {
  targetAddressSpace?: "local";
};

export function localNetworkRequestInit(
  endpoint: string,
  init: RequestInit,
  sourceProtocol = typeof globalThis.location === "undefined"
    ? undefined
    : globalThis.location.protocol,
): LocalNetworkRequestInit {
  if (sourceProtocol === "https:" && new URL(endpoint).protocol === "http:") {
    return { ...init, targetAddressSpace: "local" };
  }
  return { ...init };
}

function errorDetail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const RUN_STARTUP_QUIET_MS = 500;
const RESET_RECONNECT_TIMEOUT_MS = 30_000;

function assertCompatiblePhysicalInfo(info: PhysicalInfo): void {
  if (info.protocol !== 1) {
    throw new PhysicalTargetError(
      "protocol_mismatch",
      `XRP protocol ${info.protocol} is not supported by this app`,
    );
  }
  if (
    info.courseRelease !== CURRENT_COURSE_RELEASE ||
    info.serviceVersion !== CURRENT_COURSE_RELEASE
  ) {
    throw new PhysicalTargetError(
      "release_mismatch",
      `This XRP has course release ${info.courseRelease} and service ${info.serviceVersion}; this web app requires ${CURRENT_COURSE_RELEASE}. Open Set up or repair XRP, update the robot, then reconnect.`,
    );
  }
}

export class DirectPhysicalTargetClient implements TargetClient {
  readonly kind = "physical" as const;
  readonly endpoint: string;
  private readonly fetchImplementation: typeof fetch;
  private readonly activePollIntervalMs: number;
  private readonly pollIntervalMs: number;
  private readonly requestTimeoutMs: number;
  private readonly listeners = new Set<(event: TargetEvent) => void>();
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private pollInFlight: Promise<void> | null = null;
  private pollingPaused = false;
  private connected = false;
  private reconnecting = false;
  private connectGeneration = 0;
  private nextRequest = 1;
  private lastLogSeq = 0;
  private lastSampleSeq = 0;
  private bootId: string | null = null;
  private lastRunId = 0;
  private lastLeaseAt = 0;
  private currentProject: SynchronizedProject | null = null;
  private projectStateKnown = false;
  private info: PhysicalInfo | null = null;
  private lastRuntimeJson = "";
  private runtimeState: RuntimeState = EMPTY_RUNTIME_STATE;
  private lastWorldJson = "";

  constructor(endpoint: string, options: PhysicalTargetOptions = {}) {
    this.endpoint = normalizePhysicalEndpoint(endpoint);
    this.fetchImplementation =
      options.fetch ?? ((input, init) => globalThis.fetch(input, init));
    this.pollIntervalMs = options.pollIntervalMs ?? 250;
    this.activePollIntervalMs =
      options.activePollIntervalMs ?? options.pollIntervalMs ?? 60;
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
    assertCompatiblePhysicalInfo(info);
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
      `${info.robotName} · ${this.connectionDescription(info)} · course ${info.courseRelease}`,
    );
    this.emit({
      type: "console",
      stream: "system",
      line: `Connected to ${info.robotName} · ${this.connectionDescription(info)}`,
    });
    this.consumeProjectManifest(info.project);
    this.consumeRuntimeState(info.runtimeJson);
    this.schedulePoll(0);
  }

  disconnect(): void {
    this.connectGeneration += 1;
    this.connected = false;
    this.stopPolling();
    this.emitStatus("disconnected", "Physical XRP disconnected");
  }

  private connectionDescription(info: PhysicalInfo): string {
    const mode = info.network?.mode;
    const networkName = info.network?.ssid;
    if (mode === "access_point") {
      const fallback = info.network?.fallback ? " fallback" : "";
      return `${networkName ?? "robot hotspot"}${fallback} · ${info.address}`;
    }
    if (mode === "station") {
      return `${networkName ?? "existing Wi-Fi"} · ${info.address}`;
    }
    return info.address;
  }

  async check(project: CourseProject): Promise<CheckResult> {
    const projectName = project.name?.trim() || project.entrypoint;
    this.emit({
      type: "console",
      stream: "system",
      line: `Validating ${projectName} on the physical XRP`,
    });
    try {
      const result = await this.command<{ detail: string }>("check", {
        project,
      });
      this.emit({
        type: "console",
        stream: "system",
        line: `Validation passed · ${result.detail}`,
      });
      return { ok: true, detail: result.detail };
    } catch (error) {
      if (
        error instanceof PhysicalTargetError &&
        error.code === "syntax_error"
      ) {
        this.emit({
          type: "console",
          stream: "system",
          line: `Validation failed · ${error.message}`,
        });
        return { ok: false, detail: error.message };
      }
      this.emit({
        type: "console",
        stream: "system",
        line: `Validation could not finish · ${errorDetail(error)}`,
      });
      throw error;
    }
  }

  async synchronize(project: CourseProject): Promise<void> {
    const catalog = worldCatalogForProject(project);
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
    this.emit({
      type: "world",
      catalog,
      selectedWorldId: catalog.defaultWorldId,
    });
    // The service records this event in its persistent system log. Polling that
    // log keeps the IDE and Monitor consistent without displaying Flash twice.
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
        "No project is ready. Run or flash a project in the IDE first.",
      );
    }
    if (this.currentProject.stale) {
      throw new PhysicalTargetError(
        "stale_project",
        "The IDE project has changed. Run or flash it in the IDE first.",
      );
    }
    // Let any current telemetry request finish, then leave the RP2350 service
    // core quiet while its second core loads the project. This avoids racing
    // Wi-Fi response allocation with MicroPython project startup.
    this.pollingPaused = true;
    this.stopPolling();
    try {
      await this.pollInFlight;
      const result = await this.command<{ detail: string; runId: number }>(
        "run",
        {},
      );
      if (result.runId !== this.lastRunId) {
        this.lastSampleSeq = 0;
      }
      this.lastRunId = result.runId;
      this.lastLeaseAt = 0;
      // The service records the start event. Use that retained entry as the
      // console source; the status below still updates the controls immediately.
      this.emitStatus("loading", result.detail);
    } finally {
      this.pollingPaused = false;
      this.schedulePoll(RUN_STARTUP_QUIET_MS);
    }
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
      this.emit({ type: "console", stream: "system", line: result.detail });
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
      this.emit({ type: "console", stream: "system", line: result.detail });
      this.emitStatus("connecting", `${result.detail}; reconnecting…`);
      await this.reconnectAfterReset();
    } finally {
      this.reconnecting = false;
      this.schedulePoll(0);
    }
  }

  async setRuntimeParameter(
    name: string,
    value: RuntimeParameterValue,
  ): Promise<void> {
    if (!this.info?.capabilities.includes("runtime.parameters")) {
      throw new PhysicalTargetError(
        "capability_mismatch",
        "This XRP service does not yet support live parameters",
      );
    }
    const result = await this.command<{ runtimeJson: string }>("parameter", {
      name,
      value,
    });
    this.consumeRuntimeState(result.runtimeJson);
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
        ...localNetworkRequestInit(this.endpoint, init),
        cache: "no-store",
        signal: controller.signal,
      } as LocalNetworkRequestInit);
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
    if (!this.connected || this.pollingPaused) {
      return;
    }
    this.pollTimer = setTimeout(() => {
      this.pollTimer = null;
      const request = this.poll();
      this.pollInFlight = request;
      void request.then(
        () => {
          if (this.pollInFlight === request) {
            this.pollInFlight = null;
          }
        },
        () => {
          if (this.pollInFlight === request) {
            this.pollInFlight = null;
          }
        },
      );
    }, delay);
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
        `/api/v1/telemetry?afterLogSeq=${this.lastLogSeq}&afterSampleSeq=${this.lastSampleSeq}`,
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
      this.schedulePoll(
        state.state === "running"
          ? this.activePollIntervalMs
          : this.pollIntervalMs,
      );
    } catch (error) {
      if (this.connected && !this.reconnecting) {
        this.emitStatus("error", errorDetail(error));
        this.schedulePoll(900);
      }
    }
  }

  private consumeState(state: PhysicalState): void {
    const bootChanged = state.bootId !== this.bootId;
    const runChanged = state.runId !== this.lastRunId;
    if (bootChanged) {
      this.bootId = state.bootId;
      this.lastLogSeq = 0;
    }
    if (bootChanged || runChanged) {
      this.lastSampleSeq = 0;
    }
    this.lastRunId = state.runId;
    this.consumeProjectManifest(state.project);
    this.consumeRuntimeState(state.runtimeJson);
    this.emitStatus(state.state, state.detail);
    if (state.samples === undefined) {
      // Services released before telemetry batching return one fresh sample
      // per request and ignore afterSampleSeq. Preserve that behavior.
      if (state.sample) {
        this.emitTelemetry(state.sample);
        this.lastSampleSeq = state.sample.seq;
      }
    } else {
      const ordered = [...state.samples].sort(
        (left, right) => left.seq - right.seq,
      );
      for (const sample of ordered) {
        if (
          !Number.isSafeInteger(sample.seq) ||
          sample.seq <= this.lastSampleSeq
        ) {
          continue;
        }
        this.emitTelemetry(sample);
        this.lastSampleSeq = sample.seq;
      }
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

  private emitTelemetry(sample: TelemetrySample): void {
    this.emit({
      type: "telemetry",
      sample: {
        ...sample,
        plotValues: this.runtimeState.plots.map((plot) => ({ ...plot })),
      },
    });
  }

  private async reconnectAfterReset(): Promise<void> {
    this.stopPolling();
    // Pink required 17 seconds from an RP2350 reset to a reachable HTTP
    // service in physical testing. Retain margin for ordinary DHCP variance;
    // this is an automatic retry window, not another student-facing step.
    const deadline = performance.now() + RESET_RECONNECT_TIMEOUT_MS;
    let lastError: unknown = null;
    while (performance.now() < deadline && this.connected) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      try {
        const info = await this.getJson<PhysicalInfo>("/api/v1/info", 1_500);
        assertCompatiblePhysicalInfo(info);
        this.info = info;
        this.bootId = info.bootId;
        this.lastLogSeq = 0;
        this.lastSampleSeq = 0;
        this.emitStatus(
          "ready",
          `${info.robotName} · ${info.address} · course ${info.courseRelease}`,
        );
        this.emit({
          type: "console",
          stream: "system",
          line: `${info.robotName} reconnected and ready`,
        });
        this.consumeProjectManifest(info.project);
        this.consumeRuntimeState(info.runtimeJson);
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
    if (
      typeof manifest.worldJson === "string" &&
      manifest.worldJson !== this.lastWorldJson
    ) {
      this.lastWorldJson = manifest.worldJson;
      try {
        const catalog = parseWorldCatalog(manifest.worldJson);
        this.emit({
          type: "world",
          catalog,
          selectedWorldId: catalog.defaultWorldId,
        });
      } catch (error) {
        this.emit({
          type: "console",
          stream: "system",
          line: `The XRP project has an invalid world.json: ${errorDetail(error)}`,
        });
      }
    }
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

  private consumeRuntimeState(runtimeJson: string | undefined): void {
    if (runtimeJson === undefined || runtimeJson === this.lastRuntimeJson) {
      return;
    }
    this.lastRuntimeJson = runtimeJson;
    try {
      this.runtimeState = parseRuntimeState(runtimeJson);
    } catch {
      this.runtimeState = EMPTY_RUNTIME_STATE;
    }
    this.emit({ type: "runtime", state: this.runtimeState });
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
  private localNetworkPermissionPrimed = false;

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
    await this.primeLocalNetworkPermission();
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

  async setRuntimeParameter(
    name: string,
    value: RuntimeParameterValue,
  ): Promise<void> {
    if (this.direct) {
      await this.direct.setRuntimeParameter(name, value);
      return;
    }
    await this.request({ type: "set-runtime-parameter", name, value });
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

  private async primeLocalNetworkPermission(): Promise<void> {
    if (
      this.localNetworkPermissionPrimed ||
      typeof window === "undefined" ||
      window.location.protocol !== "https:" ||
      new URL(this.endpoint).protocol !== "http:"
    ) {
      return;
    }

    const controller = new AbortController();
    const timeoutMs = this.options.requestTimeoutMs ?? 8_000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      await globalThis.fetch(
        `${this.endpoint}/api/v1/info`,
        localNetworkRequestInit(
          this.endpoint,
          {
            cache: "no-store",
            method: "GET",
            signal: controller.signal,
          },
          window.location.protocol,
        ),
      );
      this.localNetworkPermissionPrimed = true;
    } catch (error) {
      const detail =
        error instanceof DOMException && error.name === "AbortError"
          ? `XRP did not reply within ${timeoutMs / 1_000} seconds`
          : `Cannot reach ${this.endpoint}: ${errorDetail(error)}`;
      throw new PhysicalTargetError(
        "network_error",
        `${detail}. Allow this page to access devices on the local network, then reconnect.`,
      );
    } finally {
      clearTimeout(timeout);
    }
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
      | { type: "reset" }
      | {
          type: "set-runtime-parameter";
          name: string;
          value: RuntimeParameterValue;
        },
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
