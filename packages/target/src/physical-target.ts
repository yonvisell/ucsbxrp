import type {
  CheckResult,
  CourseProject,
  ProjectRunProvider,
  ProjectRevisionNotice,
  SynchronizedProject,
  TargetClient,
  TargetConsoleMetadata,
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
import type { TargetWorkerRole } from "./worker-protocol";
import { describeProject } from "./project-identity";
import { worldCatalogForProject } from "./project-world";
import {
  portableProjectError,
  validatePortableProject,
} from "./project-validation";
import { EMPTY_RUNTIME_STATE, parseRuntimeState } from "./runtime-controls";
import { parseWorldCatalog } from "@ucsb-xrp/simulator";
import courseRelease from "../../../vendor/current/release.json";

export const CURRENT_COURSE_RELEASE = courseRelease.release_id;
export const CURRENT_ROBOT_RELEASE_SEQUENCE = courseRelease.release_sequence;
export const MINIMUM_ROBOT_RELEASE_SEQUENCE =
  courseRelease.compatibility.minimum_robot_release_sequence;
export const CURRENT_PROTOCOL_VERSION = courseRelease.service.protocol_version;
export const CURRENT_PROTOCOL_REVISION =
  courseRelease.service.protocol_revision;
export const CURRENT_COURSE_API_REVISION = courseRelease.course_api_revision;
export const CURRENT_SERVICE_VERSION = courseRelease.service.version;

interface PhysicalProjectManifest {
  name: string;
  entrypoint: string;
  revision?: string;
  files?: string[];
  bytes?: number;
  worldJson?: string;
  lifetime?: "boot";
}

interface PreparedProjectManifest extends PhysicalProjectManifest {
  revision: string;
  lifetime: "boot";
}

interface PrepareResult {
  detail: string;
  checked: number;
  project: PreparedProjectManifest;
}

interface RunResult {
  detail: string;
  runId: number;
  checked?: number;
  project?: PreparedProjectManifest;
}

interface PhysicalInfo {
  protocol: number;
  serviceVersion: string;
  courseRelease: string;
  protocolRevision?: number;
  runtimeRelease?: string;
  runtimeReleaseSequence?: number;
  runtimeManifestSha256?: string;
  courseApiRevision?: string;
  courseLibraryVersion?: string;
  bootstrapVersion?: number;
  robotId?: string;
  bootId: string;
  robotName: string;
  address: string;
  network?: {
    mode?: "access_point" | "station";
    requested_mode?: "access_point" | "station";
    fallback?: boolean;
    ssid?: string;
    address?: string;
  };
  capabilities: string[];
  project?: PhysicalProjectManifest | null;
  runtimeJson?: string;
}

interface PhysicalLog {
  seq: number;
  tMs?: number;
  stream: "stdout" | "stderr" | "system";
  line: string;
}

interface PhysicalState {
  bootId: string;
  state: TargetRunState;
  detail: string;
  runId: number;
  logs: PhysicalLog[];
  moreLogs?: boolean;
  moreSamples?: boolean;
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
  candidateEndpoints?: readonly string[];
  discoveryTimeoutMs?: number;
  /** Stable hardware identity retained by commissioning. */
  expectedRobotId?: string;
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

function physicalConnectionRecovery(endpoint: string): string {
  return (
    "Run and telemetry use Wi-Fi, not USB. Connect this computer to the " +
    "same Wi-Fi as the XRP, or join its UCSB-XRP hotspot and select Robot " +
    "hotspot in Settings. The course app remains available without " +
    `internet. If already connected, verify ${endpoint} and allow Chrome ` +
    "to access devices on the local network."
  );
}

const RUN_STARTUP_QUIET_MS = 500;
// Used only after a controller restart: setup/repair and the exceptional case
// where a student program cannot stop cooperatively. Ordinary Reset is local.
const RESET_RECONNECT_TIMEOUT_MS = 18_000;
const POLL_FAILURES_BEFORE_ERROR = 2;
const POLL_RECOVERY_DELAY_MS = 900;

interface CommandActivity {
  action: NonNullable<TargetConsoleMetadata["action"]>;
  label: string;
  detail?: string;
}

function assertCompatiblePhysicalInfo(info: PhysicalInfo): void {
  if (info.protocol !== CURRENT_PROTOCOL_VERSION) {
    throw new PhysicalTargetError(
      "protocol_mismatch",
      `XRP protocol ${info.protocol} is not supported by this app`,
    );
  }

  const hasRuntimeIdentity =
    typeof info.runtimeReleaseSequence === "number" ||
    typeof info.courseApiRevision === "string" ||
    typeof info.protocolRevision === "number";

  // Robots commissioned before the transactional runtime was introduced do
  // not report compatibility fields. Accept only an exact legacy release;
  // any older legacy installation must be repaired before it can run code.
  if (!hasRuntimeIdentity) {
    if (
      info.courseRelease === CURRENT_COURSE_RELEASE &&
      (info.serviceVersion === CURRENT_COURSE_RELEASE ||
        info.serviceVersion === CURRENT_SERVICE_VERSION)
    ) {
      return;
    }
    throw new PhysicalTargetError(
      "release_mismatch",
      `This XRP has course release ${info.courseRelease} and service ${info.serviceVersion}; this web app requires ${CURRENT_COURSE_RELEASE}. Open Set up or repair XRP, update the robot, then reconnect.`,
    );
  }

  if (
    typeof info.protocolRevision !== "number" ||
    info.protocolRevision < CURRENT_PROTOCOL_REVISION
  ) {
    throw new PhysicalTargetError(
      "protocol_mismatch",
      `This XRP reports protocol revision ${String(info.protocolRevision)}; this app requires revision ${CURRENT_PROTOCOL_REVISION} or later. Open Set up or repair XRP, update the robot, then reconnect.`,
    );
  }
  if (info.courseApiRevision !== CURRENT_COURSE_API_REVISION) {
    throw new PhysicalTargetError(
      "release_mismatch",
      `This XRP uses course API ${String(info.courseApiRevision)}; this app uses ${CURRENT_COURSE_API_REVISION}. Open Set up or repair XRP, update the robot, then reconnect.`,
    );
  }
  if (
    typeof info.runtimeReleaseSequence !== "number" ||
    info.runtimeReleaseSequence < MINIMUM_ROBOT_RELEASE_SEQUENCE
  ) {
    throw new PhysicalTargetError(
      "release_mismatch",
      `This XRP has runtime ${info.runtimeRelease ?? info.courseRelease}; this app requires robot update ${MINIMUM_ROBOT_RELEASE_SEQUENCE} or later. Open Set up or repair XRP, update the robot, then reconnect.`,
    );
  }
}

function normalizedRobotId(value: string | undefined): string | undefined {
  const normalized = value?.trim().toLocaleLowerCase();
  return normalized ? normalized : undefined;
}

function assertExpectedRobotIdentity(
  info: PhysicalInfo,
  expectedRobotId: string | undefined,
): void {
  const expected = normalizedRobotId(expectedRobotId);
  if (!expected) return;
  const actual = normalizedRobotId(info.robotId);
  if (!actual) {
    throw new PhysicalTargetError(
      "robot_identity_missing",
      "This XRP service cannot prove that it is the robot selected during setup. Open Set up or repair XRP, then reconnect.",
    );
  }
  if (actual !== expected) {
    throw new PhysicalTargetError(
      "robot_identity_mismatch",
      `The reachable XRP is ${actual}, but this browser is configured for ${expected}. Select the intended robot or run Set up or repair XRP.`,
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
  private readonly connectTimeoutMs: number;
  private readonly expectedRobotId?: string;
  private readonly listeners = new Set<(event: TargetEvent) => void>();
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private pollInFlight: Promise<void> | null = null;
  private pollAbortController: AbortController | null = null;
  private pollGeneration = 0;
  private pollingPaused = false;
  private connected = false;
  private reconnecting = false;
  private pollConnectionFailed = false;
  private consecutivePollFailures = 0;
  private connectGeneration = 0;
  private nextRequest = 1;
  private nextEvent = 1;
  private readonly eventSession = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  private lastLogSeq = 0;
  private lastSampleSeq = 0;
  private bootId: string | null = null;
  private lastRunId = 0;
  private currentProject: SynchronizedProject | null = null;
  private stagedProject: CourseProject | null = null;
  private projectStateKnown = false;
  private info: PhysicalInfo | null = null;
  private lastRuntimeJson = "";
  private runtimeState: RuntimeState = EMPTY_RUNTIME_STATE;
  private lastWorldJson = "";
  private currentState: TargetRunState = "disconnected";
  private currentDetail = "Physical XRP disconnected";
  private projectRunProvider: ProjectRunProvider | null = null;

  constructor(endpoint: string, options: PhysicalTargetOptions = {}) {
    this.endpoint = normalizePhysicalEndpoint(endpoint);
    this.fetchImplementation =
      options.fetch ?? ((input, init) => globalThis.fetch(input, init));
    this.pollIntervalMs = options.pollIntervalMs ?? 250;
    this.activePollIntervalMs =
      options.activePollIntervalMs ?? options.pollIntervalMs ?? 125;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 3_000;
    this.connectTimeoutMs = options.discoveryTimeoutMs ?? this.requestTimeoutMs;
    this.expectedRobotId = normalizedRobotId(options.expectedRobotId);
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }
    const generation = this.connectGeneration + 1;
    this.connectGeneration = generation;
    const requestId = `connect-${generation}`;
    this.emitConsole("system", `Connecting to ${this.endpoint}`, {
      action: "connect",
      phase: "request",
      requestId,
    });
    this.emitStatus("connecting", `Connecting to ${this.endpoint}`);
    let info: PhysicalInfo;
    try {
      info = await this.getJson<PhysicalInfo>(
        "/api/v1/info",
        this.connectTimeoutMs,
      );
      assertCompatiblePhysicalInfo(info);
      assertExpectedRobotIdentity(info, this.expectedRobotId);
      const required = [
        "project.check",
        "project.prepare",
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
    } catch (error) {
      if (generation === this.connectGeneration) {
        const detail = errorDetail(error);
        this.emitConsole("system", `Connection failed · ${detail}`, {
          action: "connect",
          phase: "error",
          requestId,
        });
        this.emitStatus("error", detail);
      }
      throw error;
    }
    if (generation !== this.connectGeneration) {
      return;
    }
    this.info = info;
    this.bootId = info.bootId;
    this.connected = true;
    this.pollConnectionFailed = false;
    this.consecutivePollFailures = 0;
    this.consumeProjectManifest(info.project);
    this.consumeRuntimeState(info.runtimeJson);
    const initialState = await this.readInitialState(info);
    this.emitStatus(
      initialState?.state ?? "ready",
      initialState?.detail ??
        `${info.robotName} · ${this.connectionDescription(info)} · course ${info.courseRelease}`,
    );
    this.emitConsole(
      "system",
      `Connected to ${info.robotName} · ${this.connectionDescription(info)}`,
      {
        action: "connect",
        phase: "result",
        requestId,
      },
    );
    this.emit({
      type: "project-provider",
      active: this.projectRunProvider !== null,
      available: this.projectRunProvider !== null,
    });
    const networkMode = info.network?.mode;
    const networkAddress = info.network?.address ?? info.address;
    if (
      (networkMode === "access_point" || networkMode === "station") &&
      networkAddress
    ) {
      this.emit({
        type: "physical-network",
        mode: networkMode,
        address: normalizePhysicalEndpoint(networkAddress),
        ssid: info.network?.ssid,
        ...(info.network?.requested_mode
          ? { requestedMode: info.network.requested_mode }
          : {}),
        ...(typeof info.network?.fallback === "boolean"
          ? { fallback: info.network.fallback }
          : {}),
        ...(info.robotId ? { robotId: info.robotId } : {}),
        ...(info.robotName ? { hostname: info.robotName } : {}),
      });
    }
    this.schedulePoll(0);
  }

  /**
   * Begin a new browser session at the device log tail.
   *
   * Transactional course services retain a bounded log across the entire
   * controller boot. Replaying that boot history through many small telemetry
   * pages made a newly opened IDE spend several seconds rendering unrelated
   * earlier runs before it could process Stop. The full history remains on the
   * XRP for diagnostics; the IDE starts with work performed in this browser
   * session and subsequently retains every line it receives.
   */
  private async readInitialState(
    info: PhysicalInfo,
  ): Promise<PhysicalState | null> {
    if (!info.capabilities.includes("logs.poll")) return null;
    try {
      const state = await this.getJson<PhysicalState>(
        "/api/v1/state?afterLogSeq=0",
        Math.min(this.connectTimeoutMs, 1_500),
      );
      if (state.bootId !== info.bootId) return null;
      this.lastLogSeq = state.logs.reduce(
        (maximum, entry) =>
          Number.isSafeInteger(entry.seq)
            ? Math.max(maximum, entry.seq)
            : maximum,
        0,
      );
      this.lastRunId = state.runId;
      const latestSample = state.sample ?? state.samples?.at(-1);
      if (latestSample && Number.isSafeInteger(latestSample.seq)) {
        this.lastSampleSeq = latestSample.seq;
        this.emitTelemetry(latestSample);
      }
      this.consumeProjectManifest(state.project);
      this.consumeRuntimeState(state.runtimeJson);
      return state;
    } catch {
      // Older compatible services can advertise logs.poll without the compact
      // state snapshot. Normal polling from sequence zero remains the fallback.
      return null;
    }
  }

  disconnect(): void {
    this.connectGeneration += 1;
    this.connected = false;
    this.pollGeneration += 1;
    this.stopPolling();
    this.abortActivePoll();
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
    const portabilityError = portableProjectError(project);
    if (portabilityError) {
      const requestId = `web-${Date.now()}-${this.nextRequest++}`;
      this.emitConsole("system", `Compile requested · ${projectName}`, {
        action: "validate",
        phase: "request",
        requestId,
      });
      this.emitConsole(
        "system",
        `Compilation failed · ${portabilityError.message}`,
        {
          action: "validate",
          phase: "error",
          requestId,
        },
      );
      return { ok: false, detail: portabilityError.message };
    }
    await this.pausePollingForCommand();
    try {
      const result = await this.command<{ detail: string }>(
        "check",
        { project },
        {
          action: "validate",
          label: "Compile",
          detail: projectName,
        },
      );
      return { ok: true, detail: result.detail };
    } catch (error) {
      if (
        error instanceof PhysicalTargetError &&
        error.code === "syntax_error"
      ) {
        return { ok: false, detail: error.message };
      }
      throw error;
    } finally {
      this.resumePollingAfterCommand();
    }
  }

  async synchronize(project: CourseProject): Promise<void> {
    const portabilityError = portableProjectError(project);
    if (portabilityError) {
      this.emitConsole(
        "system",
        `Prepare failed · ${portabilityError.message}`,
        {
          action: "prepare",
          phase: "error",
        },
      );
      throw portabilityError;
    }
    await this.pausePollingForCommand();
    try {
      await this.prepareWhilePollingPaused(project);
    } finally {
      this.resumePollingAfterCommand();
    }
  }

  async run(project: CourseProject): Promise<void> {
    validatePortableProject(project);
    this.stagedProject = project;
    const descriptor = await describeProject(project);
    let started = false;
    await this.pausePollingForCommand();
    try {
      const projectNeedsPreparing =
        !this.currentProject ||
        this.currentProject.stale ||
        descriptor.revision !== this.currentProject.revision;
      if (projectNeedsPreparing) {
        if (!this.info?.capabilities.includes("project.run")) {
          throw new PhysicalTargetError(
            "capability_mismatch",
            "This XRP needs the current course software before it can run edited projects reliably. Open Set up or Repair, update the XRP, then reconnect.",
          );
        }
        started = await this.prepareAndStartWhilePollingPaused(
          project,
          descriptor,
        );
      } else {
        started = await this.startCurrentProjectWhilePollingPaused();
      }
    } finally {
      this.resumePollingAfterCommand(started ? RUN_STARTUP_QUIET_MS : 0);
    }
  }

  async runCurrent(): Promise<void> {
    if (this.projectRunProvider) {
      await this.run(this.projectRunProvider().project);
      return;
    }
    if (
      this.stagedProject &&
      (!this.currentProject || this.currentProject.stale)
    ) {
      await this.run(this.stagedProject);
      return;
    }
    if (!this.currentProject) {
      const error = new PhysicalTargetError(
        "no_project",
        "No project is ready. Run or prepare a project in the IDE first.",
      );
      this.emitConsole("system", `Run failed · ${error.message}`, {
        action: "run",
        phase: "error",
      });
      throw error;
    }
    if (this.currentProject.stale) {
      const error = new PhysicalTargetError(
        "stale_project",
        "The IDE project has changed. Run or prepare it in the IDE first.",
      );
      this.emitConsole("system", `Run failed · ${error.message}`, {
        action: "run",
        phase: "error",
      });
      throw error;
    }
    if (this.currentState === "loading" || this.currentState === "running") {
      this.emitConsole(
        "system",
        "Run request ignored · program already active",
        {
          action: "run",
          phase: "result",
        },
      );
      return;
    }
    let started = false;
    await this.pausePollingForCommand();
    try {
      started = await this.startCurrentProjectWhilePollingPaused();
    } finally {
      this.resumePollingAfterCommand(started ? RUN_STARTUP_QUIET_MS : 0);
    }
  }

  private async prepareWhilePollingPaused(
    project: CourseProject,
    knownDescriptor?: Awaited<ReturnType<typeof describeProject>>,
  ): Promise<void> {
    const descriptor = knownDescriptor ?? (await describeProject(project));
    const catalog = worldCatalogForProject(project);
    let result: Pick<PrepareResult, "detail" | "project">;
    try {
      result = await this.command<PrepareResult>(
        "prepare",
        { project },
        { action: "prepare", label: "Prepare", detail: descriptor.name },
        undefined,
        true,
      );
      if (
        result.project?.revision !== descriptor.revision ||
        result.project.lifetime !== "boot"
      ) {
        throw new PhysicalTargetError(
          "project_revision_mismatch",
          "The XRP prepared a different project revision",
        );
      }
    } catch (error) {
      const interrupted =
        error instanceof PhysicalTargetError &&
        (error.code === "network_error" || error.code === "timeout");
      if (!interrupted) {
        throw error;
      }
      // Prepare is transactional for the current boot: the RAM project may be
      // ready even when Chrome misses both correlated replies. Read the device's
      // retained manifest before reporting failure or sending the project again.
      const info = await this.getJson<PhysicalInfo>("/api/v1/info", 1_500);
      assertCompatiblePhysicalInfo(info);
      assertExpectedRobotIdentity(info, this.expectedRobotId);
      if (info.project?.revision !== descriptor.revision) {
        throw error;
      }
      result = {
        detail: "Project prepared",
        project: {
          ...info.project,
          revision: descriptor.revision,
          lifetime: "boot",
        },
      };
      this.emitConsole(
        "system",
        `Prepare verified · ${descriptor.name} is ready in XRP memory`,
        {
          action: "prepare",
          phase: "result",
        },
      );
    }
    this.setCurrentProject({
      ...descriptor,
      revision: result.project.revision,
      name: result.project.name ?? descriptor.name,
      entrypoint: result.project.entrypoint ?? descriptor.entrypoint,
      stale: false,
    });
    this.emitStatus("ready", result.detail);
    this.stagedProject = project;
    this.emit({
      type: "world",
      catalog,
      selectedWorldId: catalog.defaultWorldId,
    });
    // The service also retains its own state transition. Its log event has a
    // device sequence ID, while the request/result events above have browser
    // IDs, so both remain traceable across the IDE and Monitor.
  }

  private async startCurrentProjectWhilePollingPaused(): Promise<boolean> {
    if (!this.currentProject) {
      throw new PhysicalTargetError(
        "no_project",
        "No project is ready. Run or prepare a project in the IDE first.",
      );
    }
    if (this.currentProject.stale) {
      throw new PhysicalTargetError(
        "stale_project",
        "The IDE project has changed. Run or prepare it in the IDE first.",
      );
    }
    if (this.currentState === "loading" || this.currentState === "running") {
      this.emitConsole(
        "system",
        "Run request ignored · program already active",
        { action: "run", phase: "result" },
      );
      return false;
    }

    // Leave the XRP service quiet while its second core starts the already
    // prepared project. Telemetry polling resumes after the startup quiet window.
    const previousState = this.currentState;
    this.emitStatus("loading", `Starting ${this.currentProject.entrypoint}…`);
    try {
      const result = await this.command<RunResult>(
        "run",
        {},
        {
          action: "run",
          label: "Run",
          detail: this.currentProject.name,
        },
        undefined,
        true,
      );
      if (result.runId !== this.lastRunId) {
        this.lastSampleSeq = 0;
      }
      this.lastRunId = result.runId;
      // The service records the start event. Use that retained entry as the
      // console source; the status below still updates the controls immediately.
      this.emitStatus("loading", result.detail);
      return true;
    } catch (error) {
      if (
        error instanceof PhysicalTargetError &&
        (error.code === "network_error" || error.code === "timeout")
      ) {
        this.emitStatus("error", error.message);
      } else {
        this.emitStatus(previousState, `Run failed · ${errorDetail(error)}`);
      }
      throw error;
    }
  }

  /** Compile, prepare, and start an edited project in one XRP request. */
  private async prepareAndStartWhilePollingPaused(
    project: CourseProject,
    descriptor: Awaited<ReturnType<typeof describeProject>>,
  ): Promise<boolean> {
    if (this.currentState === "loading" || this.currentState === "running") {
      this.emitConsole(
        "system",
        "Run request ignored · program already active",
        { action: "run", phase: "result" },
      );
      return false;
    }

    const previousState = this.currentState;
    this.emitStatus(
      "loading",
      `Compiling and starting ${descriptor.entrypoint}…`,
    );
    try {
      const result = await this.command<RunResult>(
        "run",
        { project },
        {
          action: "run",
          label: "Run",
          detail: descriptor.name,
        },
        undefined,
        true,
      );
      if (
        result.project?.revision !== descriptor.revision ||
        result.project.lifetime !== "boot"
      ) {
        throw new PhysicalTargetError(
          "project_revision_mismatch",
          "The XRP started a different project revision",
        );
      }
      this.setCurrentProject({
        ...descriptor,
        revision: result.project.revision,
        name: result.project.name ?? descriptor.name,
        entrypoint: result.project.entrypoint ?? descriptor.entrypoint,
        stale: false,
      });
      this.stagedProject = project;
      const catalog = worldCatalogForProject(project);
      this.emit({
        type: "world",
        catalog,
        selectedWorldId: catalog.defaultWorldId,
      });
      if (result.runId !== this.lastRunId) {
        this.lastSampleSeq = 0;
      }
      this.lastRunId = result.runId;
      this.emitStatus("loading", `Starting ${descriptor.entrypoint}`);
      return true;
    } catch (error) {
      if (
        error instanceof PhysicalTargetError &&
        (error.code === "network_error" || error.code === "timeout")
      ) {
        this.emitStatus("error", error.message);
      } else {
        this.emitStatus(previousState, `Run failed · ${errorDetail(error)}`);
      }
      throw error;
    }
  }

  async markProjectStale(project: CourseProject): Promise<void> {
    const descriptor = await describeProject(project);
    const worldChanged =
      this.stagedProject === null ||
      this.stagedProject.files["world.json"] !== project.files["world.json"];
    this.stagedProject = project;
    this.setCurrentProject({
      ...descriptor,
      stale: this.currentProject?.revision !== descriptor.revision,
    });
    if (worldChanged) {
      const catalog = worldCatalogForProject(project);
      this.emit({
        type: "world",
        catalog,
        selectedWorldId: catalog.defaultWorldId,
      });
    }
  }

  setProjectRunProvider(
    provider: ProjectRunProvider | null,
    _options?: { takeover?: boolean },
  ): void {
    this.projectRunProvider = provider;
    if (this.connected) {
      this.emit({
        type: "project-provider",
        active: provider !== null,
        available: provider !== null,
      });
    }
  }

  markProjectChanged(project: ProjectRevisionNotice): void {
    this.setCurrentProject({
      name: project.name,
      entrypoint: project.entrypoint,
      // This is an IDE revision, not the content digest still reported by the
      // XRP. Keeping the two identities distinct prevents the next telemetry
      // poll from making an edited project appear ready again.
      revision: `ide:${project.projectId}:${project.revision}`,
      stale: true,
    });
  }

  async stop(): Promise<void> {
    this.reconnecting = true;
    await this.pausePollingForCommand();
    try {
      const result = await this.command<{
        detail: string;
        reconnecting: boolean;
      }>("stop", {}, { action: "stop", label: "Stop" }, undefined, true);
      if (result.reconnecting) {
        this.emitStatus("connecting", `${result.detail}; reconnecting…`);
        await this.reconnectAfterReset();
      } else if (result.detail === "Program already stopped") {
        this.emitStatus("ready", result.detail);
      } else {
        this.emitStatus("loading", result.detail);
        await this.waitForProgramStop();
      }
    } catch (error) {
      if (
        error instanceof PhysicalTargetError &&
        (error.code === "network_error" || error.code === "timeout")
      ) {
        this.emitConsole(
          "system",
          `Stop reply was interrupted · checking XRP state`,
          { action: "stop", phase: "error" },
        );
        this.emitStatus(
          "connecting",
          "Stop reply was interrupted; checking the XRP…",
        );
        try {
          await this.recoverAfterInterruptedStop();
          return;
        } catch (recoveryError) {
          error = recoveryError;
        }
      }
      this.emitConsole(
        "system",
        `Stop recovery failed · ${errorDetail(error)}`,
        { action: "stop", phase: "error" },
      );
      this.emitStatus("error", errorDetail(error));
      throw error;
    } finally {
      this.reconnecting = false;
      this.resumePollingAfterCommand(0);
    }
  }

  async reset(): Promise<void> {
    this.reconnecting = true;
    await this.pausePollingForCommand();
    try {
      const result = await this.command<{
        detail: string;
        reconnecting: boolean;
      }>("reset", {}, { action: "reset", label: "Reset" });
      if (result.reconnecting) {
        this.emitStatus("connecting", `${result.detail}; reconnecting…`);
        await this.reconnectAfterReset();
      } else if (result.detail === "Program state reset") {
        this.emitStatus("ready", result.detail);
      } else {
        this.emitStatus("loading", result.detail);
        await this.waitForProgramStop();
      }
    } catch (error) {
      this.emitConsole(
        "system",
        `Reset recovery failed · ${errorDetail(error)}`,
        { action: "reset", phase: "error" },
      );
      this.emitStatus("error", errorDetail(error));
      throw error;
    } finally {
      this.reconnecting = false;
      this.resumePollingAfterCommand(0);
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
    await this.pausePollingForCommand();
    try {
      const result = await this.command<{ runtimeJson: string }>(
        "parameter",
        { name, value },
        { action: "parameter", label: "Live parameter", detail: name },
      );
      this.consumeRuntimeState(result.runtimeJson);
    } finally {
      this.resumePollingAfterCommand(0);
    }
  }

  subscribe(listener: (event: TargetEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async command<T>(
    name: string,
    value: Record<string, unknown>,
    activity?: CommandActivity,
    requestController?: AbortController,
    retryInterrupted = false,
  ): Promise<T> {
    if (!this.connected) {
      throw new PhysicalTargetError(
        "not_connected",
        "Physical XRP is not connected",
      );
    }
    const requestId = `web-${Date.now()}-${this.nextRequest++}`;
    if (activity) {
      this.emitConsole(
        "system",
        `${activity.label} requested${activity.detail ? ` · ${activity.detail}` : ""}`,
        {
          action: activity.action,
          phase: "request",
          requestId,
        },
      );
    }
    try {
      const body = JSON.stringify({ ...value, requestId });
      let reply: CommandReply<T> | null = null;
      for (
        let attempt = 0;
        attempt < (retryInterrupted ? 2 : 1);
        attempt += 1
      ) {
        try {
          reply = await this.fetchJson<CommandReply<T>>(
            `/api/v1/${name}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body,
            },
            this.requestTimeoutMs,
            requestController,
          );
          break;
        } catch (error) {
          const interrupted =
            error instanceof PhysicalTargetError &&
            (error.code === "network_error" || error.code === "timeout");
          if (!interrupted || !retryInterrupted || attempt > 0) {
            throw error;
          }
          if (activity) {
            this.emitConsole(
              "system",
              `${activity.label} reply interrupted · retrying the same request`,
              {
                action: activity.action,
                phase: "request",
                requestId,
              },
            );
          }
        }
      }
      if (!reply) {
        throw new PhysicalTargetError(
          "network_error",
          `The XRP did not return a ${name} reply`,
        );
      }
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
      if (activity) {
        const candidate = reply.result as { detail?: unknown };
        const detail =
          typeof candidate.detail === "string" ? candidate.detail : "accepted";
        this.emitConsole("system", `${activity.label} · ${detail}`, {
          action: activity.action,
          phase: "result",
          requestId,
        });
      }
      return reply.result;
    } catch (error) {
      if (activity) {
        this.emitConsole(
          "system",
          `${activity.label} failed · ${errorDetail(error)}`,
          {
            action: activity.action,
            phase: "error",
            requestId,
          },
        );
      }
      throw error;
    }
  }

  private async getJson<T>(
    path: string,
    timeoutMs = this.requestTimeoutMs,
    controller?: AbortController,
  ): Promise<T> {
    return this.fetchJson<T>(path, { method: "GET" }, timeoutMs, controller);
  }

  private async fetchJson<T>(
    path: string,
    init: RequestInit,
    timeoutMs = this.requestTimeoutMs,
    requestController?: AbortController,
  ): Promise<T> {
    const controller = requestController ?? new AbortController();
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
          `XRP did not reply within ${timeoutMs / 1000} seconds. ${physicalConnectionRecovery(this.endpoint)}`,
        );
      }
      throw new PhysicalTargetError(
        "network_error",
        `Cannot reach ${this.endpoint}: ${errorDetail(error)}. ${physicalConnectionRecovery(this.endpoint)}`,
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

  private abortActivePoll(): void {
    this.pollAbortController?.abort();
    this.pollAbortController = null;
  }

  private async pausePollingForCommand(): Promise<void> {
    this.pollingPaused = true;
    this.pollGeneration += 1;
    this.stopPolling();
    const activePoll = this.pollInFlight;
    if (activePoll) {
      // The XRP serves one HTTP response at a time. Let that bounded poll
      // finish before issuing a command; aborting its socket can make Chrome
      // reject the immediately following Stop even though the robot is still
      // reachable. The poll already owns the ordinary request timeout.
      await activePoll.catch(() => undefined);
    }
  }

  private resumePollingAfterCommand(delay = 0): void {
    this.pollingPaused = false;
    this.schedulePoll(delay);
  }

  private async poll(): Promise<void> {
    if (!this.connected || this.reconnecting) {
      return;
    }
    const generation = this.pollGeneration;
    const controller = new AbortController();
    this.pollAbortController = controller;
    try {
      const runQuery = this.lastRunId > 0 ? `&runId=${this.lastRunId}` : "";
      const state = await this.getJson<PhysicalState>(
        `/api/v1/telemetry?afterLogSeq=${this.lastLogSeq}&afterSampleSeq=${this.lastSampleSeq}${runQuery}`,
        this.requestTimeoutMs,
        controller,
      );
      if (
        !this.connected ||
        this.reconnecting ||
        generation !== this.pollGeneration
      ) {
        return;
      }
      if (this.pollConnectionFailed) {
        this.pollConnectionFailed = false;
        this.consecutivePollFailures = 0;
        this.emitConsole("system", "XRP connection restored", {
          action: "telemetry",
          phase: "result",
        });
      }
      this.consecutivePollFailures = 0;
      this.consumeState(state);
      const hasBacklog = state.moreLogs === true || state.moreSamples === true;
      this.schedulePoll(
        hasBacklog
          ? 0
          : state.state === "running"
            ? this.activePollIntervalMs
            : this.pollIntervalMs,
      );
    } catch (error) {
      if (
        this.connected &&
        !this.reconnecting &&
        !this.pollingPaused &&
        generation === this.pollGeneration
      ) {
        this.consecutivePollFailures += 1;
        if (!this.pollConnectionFailed) {
          this.pollConnectionFailed = true;
          this.emitConsole(
            "system",
            `Telemetry connection interrupted · ${errorDetail(error)}`,
            {
              action: "telemetry",
              phase: "error",
            },
          );
        }
        if (this.consecutivePollFailures >= POLL_FAILURES_BEFORE_ERROR) {
          this.emitStatus("error", errorDetail(error));
        } else {
          this.emitStatus(
            "connecting",
            "Telemetry was interrupted; reconnecting to the XRP…",
          );
        }
        this.schedulePoll(POLL_RECOVERY_DELAY_MS);
      }
    } finally {
      if (this.pollAbortController === controller) {
        this.pollAbortController = null;
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
        if (this.lastSampleSeq > 0 && sample.seq > this.lastSampleSeq + 1) {
          const firstMissing = this.lastSampleSeq + 1;
          const lastMissing = sample.seq - 1;
          this.emitConsole(
            "system",
            `Telemetry gap · ${lastMissing - firstMissing + 1} sample${lastMissing === firstMissing ? "" : "s"} unavailable`,
            {
              action: "telemetry",
              phase: "error",
              eventId: `${state.bootId}:sample-gap:${firstMissing}-${lastMissing}`,
            },
          );
        }
        this.emitTelemetry(sample);
        this.lastSampleSeq = sample.seq;
      }
    }
    const orderedLogs = [...state.logs].sort(
      (left, right) => left.seq - right.seq,
    );
    for (const entry of orderedLogs) {
      if (!Number.isSafeInteger(entry.seq) || entry.seq <= this.lastLogSeq) {
        continue;
      }
      if (entry.seq > this.lastLogSeq + 1) {
        const firstMissing = this.lastLogSeq + 1;
        const lastMissing = entry.seq - 1;
        this.emitConsole(
          "system",
          `XRP log gap · ${lastMissing - firstMissing + 1} line${lastMissing === firstMissing ? "" : "s"} unavailable`,
          {
            action: "telemetry",
            phase: "error",
            eventId: `${state.bootId}:log-gap:${firstMissing}-${lastMissing}`,
          },
        );
      }
      this.lastLogSeq = entry.seq;
      this.emitConsole(entry.stream, entry.line, {
        phase: entry.stream === "system" ? "result" : "output",
        eventId: `${state.bootId}:log:${entry.seq}`,
        targetTimeMs: entry.tMs,
      });
    }
    // Deliver all output from a finishing poll before the ready/error status.
    // The Monitor can then archive the complete run rather than closing its
    // capture immediately before the final stdout or traceback arrives.
    const nextState =
      state.state === "error" &&
      state.detail.toLowerCase().includes("program stopped after an exception")
        ? "ready"
        : state.state;
    const terminalBacklog =
      (nextState === "ready" || nextState === "error") &&
      (state.moreLogs === true || state.moreSamples === true);
    if (!terminalBacklog) {
      this.emitStatus(nextState, state.detail);
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
    // A controller reset includes boot, Wi-Fi association, DHCP, and service
    // startup. Keep this explicit recovery window separate from the much
    // shorter ordinary-command timeout.
    const deadline = performance.now() + RESET_RECONNECT_TIMEOUT_MS;
    let lastError: unknown = null;
    while (performance.now() < deadline && this.connected) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      try {
        const info = await this.getJson<PhysicalInfo>("/api/v1/info", 1_500);
        assertCompatiblePhysicalInfo(info);
        assertExpectedRobotIdentity(info, this.expectedRobotId);
        this.info = info;
        this.bootId = info.bootId;
        this.lastLogSeq = 0;
        this.lastSampleSeq = 0;
        this.pollConnectionFailed = false;
        this.consecutivePollFailures = 0;
        this.emitStatus(
          "ready",
          `${info.robotName} · ${info.address} · course ${info.courseRelease}`,
        );
        this.emitConsole("system", `${info.robotName} reconnected and ready`, {
          action: "connect",
          phase: "result",
        });
        const networkMode = info.network?.mode;
        const networkAddress = info.network?.address ?? info.address;
        if (
          (networkMode === "access_point" || networkMode === "station") &&
          networkAddress
        ) {
          this.emit({
            type: "physical-network",
            mode: networkMode,
            address: normalizePhysicalEndpoint(networkAddress),
            ssid: info.network?.ssid,
            ...(info.network?.requested_mode
              ? { requestedMode: info.network.requested_mode }
              : {}),
            ...(typeof info.network?.fallback === "boolean"
              ? { fallback: info.network.fallback }
              : {}),
            ...(info.robotId ? { robotId: info.robotId } : {}),
            ...(info.robotName ? { hostname: info.robotName } : {}),
          });
        }
        this.consumeProjectManifest(info.project);
        this.consumeRuntimeState(info.runtimeJson);
        return;
      } catch (error) {
        if (
          error instanceof PhysicalTargetError &&
          (error.code === "robot_identity_mismatch" ||
            error.code === "robot_identity_missing")
        ) {
          throw error;
        }
        lastError = error;
      }
    }
    throw new PhysicalTargetError(
      "reconnect_failed",
      `Physical XRP did not return after reset: ${errorDetail(lastError)}`,
    );
  }

  private async waitForProgramStop(): Promise<void> {
    const deadline = performance.now() + 2_000;
    let lastError: unknown = null;
    while (performance.now() < deadline && this.connected) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      try {
        const state = await this.getJson<PhysicalState>(
          `/api/v1/telemetry?afterLogSeq=${this.lastLogSeq}&afterSampleSeq=${this.lastSampleSeq}`,
          1_000,
        );
        this.consumeState(state);
        if (
          state.state === "ready" ||
          (state.state === "error" &&
            state.detail.toLowerCase().includes("stopped after an exception"))
        ) {
          return;
        }
        if (state.state === "error") {
          lastError = new PhysicalTargetError("target_error", state.detail);
          break;
        }
      } catch (error) {
        lastError = error;
        break;
      }
    }
    // Older services and non-cooperative programs reset the controller. Poll
    // the actual run state through that transition; /info alone cannot tell
    // whether the old program is still active on the same boot.
    this.emitStatus("connecting", "Checking program stop…");
    try {
      await this.recoverAfterInterruptedStop();
    } catch (error) {
      throw lastError ?? error;
    }
  }

  private async recoverAfterInterruptedStop(): Promise<void> {
    this.stopPolling();
    const deadline = performance.now() + RESET_RECONNECT_TIMEOUT_MS;
    let lastError: unknown = null;
    while (performance.now() < deadline && this.connected) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      try {
        const state = await this.getJson<PhysicalState>(
          "/api/v1/telemetry?afterLogSeq=0&afterSampleSeq=0",
          1_500,
        );
        this.pollConnectionFailed = false;
        this.consecutivePollFailures = 0;
        this.consumeState(state);
        if (
          state.state === "ready" ||
          (state.state === "error" &&
            state.detail.toLowerCase().includes("stopped after an exception"))
        ) {
          this.emitConsole("system", "XRP stop state verified", {
            action: "stop",
            phase: "result",
          });
          return;
        }
        if (state.state === "error") {
          lastError = new PhysicalTargetError("target_error", state.detail);
        }
      } catch (error) {
        lastError = error;
      }
    }
    throw new PhysicalTargetError(
      "reconnect_failed",
      `Could not verify that the physical XRP stopped: ${errorDetail(lastError)}`,
    );
  }

  private emitStatus(state: TargetRunState, detail: string): void {
    if (this.currentState === state && this.currentDetail === detail) {
      return;
    }
    this.currentState = state;
    this.currentDetail = detail;
    this.emit({ type: "status", state, detail });
  }

  private emitConsole(
    stream: "stdout" | "stderr" | "system",
    line: string,
    metadata: TargetConsoleMetadata = {},
  ): void {
    const eventId = metadata.eventId ?? this.nextConsoleEventId();
    this.emit({
      type: "console",
      stream,
      line,
      ...metadata,
      eventId,
      timestampMs: metadata.timestampMs ?? Date.now(),
    });
  }

  private nextConsoleEventId(): string {
    const eventId = `physical-${this.eventSession}-${this.nextEvent}`;
    this.nextEvent += 1;
    return eventId;
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
    if (
      this.currentProject?.stale &&
      this.currentProject.revision !== manifest.revision
    ) {
      return;
    }
    this.setCurrentProject({
      name: manifest.name || manifest.entrypoint,
      entrypoint: manifest.entrypoint,
      revision: manifest.revision,
      // A matching device manifest is authoritative evidence that an
      // interrupted Prepare reply still completed on the XRP.
      stale: false,
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
        this.emitConsole(
          "system",
          `The XRP project has an invalid world.json: ${errorDetail(error)}`,
          {
            phase: "error",
          },
        );
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
  private readonly seenConsoleEventIds = new Set<string>();
  private readonly consoleEventOrder: string[] = [];
  private nextRequest = 1;
  private localNetworkPermissionPrimed = false;
  private pageLifecycleObserved = false;
  private readonly candidateEndpoints: readonly string[];
  private readonly discoveryTimeoutMs: number;
  private readonly directMode: boolean;
  private projectRunProvider: ProjectRunProvider | null = null;

  constructor(endpoint: string, options: PhysicalTargetOptions = {}) {
    this.endpoint = normalizePhysicalEndpoint(endpoint);
    this.options = options;
    this.candidateEndpoints = [
      ...new Set([
        this.endpoint,
        ...(options.candidateEndpoints ?? []).map(normalizePhysicalEndpoint),
      ]),
    ];
    this.discoveryTimeoutMs = options.discoveryTimeoutMs ?? 1_000;
    this.directMode = Boolean(options.fetch) || !("SharedWorker" in globalThis);
  }

  async connect(): Promise<void> {
    this.observePageLifecycle();
    if (this.directMode) {
      if (this.direct) {
        await this.direct.connect();
        return;
      }
      await this.connectDirectCandidate();
      return;
    }
    if (!this.worker) {
      try {
        this.worker = new SharedWorker(
          new URL("./physical-target.shared-worker.ts", import.meta.url),
          // Change the name when connection discovery semantics change so an
          // already-open course app cannot retain an older worker indefinitely.
          { type: "module", name: "ucsb-xrp-physical-target-v11" },
        );
        this.worker.port.onmessage = (
          event: MessageEvent<PhysicalWorkerMessage>,
        ) => this.handleWorkerMessage(event.data);
        this.worker.onerror = (event) => {
          event.preventDefault();
          this.releaseWorker(
            event.message
              ? `Physical target worker failed: ${event.message}`
              : "Physical target worker failed",
          );
        };
        this.worker.port.start();
        this.worker.port.postMessage({
          type: "set-role",
          role: this.projectRunProvider !== null ? "ide" : "monitor",
        } satisfies PhysicalWorkerCommand);
      } catch (error) {
        this.releaseWorker(errorDetail(error));
        await this.useDirectClient().connect();
        return;
      }
    }
    const connectWorker = (endpoints: readonly string[]) =>
      this.request({
        type: "connect",
        endpoints,
        discoveryTimeoutMs: this.discoveryTimeoutMs,
        expectedRobotId: this.options.expectedRobotId,
        providesProject: this.projectRunProvider !== null,
        role: this.projectRunProvider !== null ? "ide" : "monitor",
      });

    // Join the shared connection first. A healthy IDE/Monitor peer can then
    // restore this tab without a second document fetch or permission prompt.
    try {
      await connectWorker(this.candidateEndpoints);
      return;
    } catch (firstError) {
      if (!this.shouldPrimeLocalNetworkPermission(firstError)) {
        throw firstError;
      }
    }

    // Chrome grants private-network access to a document, not to its worker.
    // Only a failed worker discovery needs this one document-level probe.
    const reachableEndpoint = await this.primeLocalNetworkPermission();
    const endpoints = reachableEndpoint
      ? [
          reachableEndpoint,
          ...this.candidateEndpoints.filter(
            (candidate) => candidate !== reachableEndpoint,
          ),
        ]
      : this.candidateEndpoints;
    await connectWorker(endpoints);
  }

  disconnect(): void {
    this.stopObservingPageLifecycle();
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
    await this.request({ type: "prepare", project });
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

  setProjectRunProvider(
    provider: ProjectRunProvider | null,
    options?: { takeover?: boolean },
  ): void {
    this.projectRunProvider = provider;
    this.direct?.setProjectRunProvider(provider, options);
    this.worker?.port.postMessage({
      type: "set-role",
      role: provider !== null ? "ide" : "monitor",
    } satisfies PhysicalWorkerCommand);
    this.worker?.port.postMessage({
      type: "set-project-run-provider",
      providesProject: provider !== null,
      takeover: options?.takeover === true,
    } satisfies PhysicalWorkerCommand);
  }

  markProjectChanged(project: ProjectRevisionNotice): void {
    if (this.direct) {
      this.direct.markProjectChanged(project);
      return;
    }
    this.worker?.port.postMessage({
      type: "mark-project-changed",
      project,
    } satisfies PhysicalWorkerCommand);
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
      this.direct.setProjectRunProvider(this.projectRunProvider);
      this.direct.subscribe((event) => this.emit(event));
    }
    return this.direct;
  }

  private async connectDirectCandidate(): Promise<void> {
    let lastError: unknown = new Error("No XRP address is available");
    for (const endpoint of this.candidateEndpoints) {
      const candidate = new DirectPhysicalTargetClient(endpoint, {
        ...this.options,
        discoveryTimeoutMs: this.discoveryTimeoutMs,
        candidateEndpoints: undefined,
      });
      candidate.setProjectRunProvider(this.projectRunProvider);
      const buffered: TargetEvent[] = [];
      const unsubscribe = candidate.subscribe((event) => buffered.push(event));
      try {
        await candidate.connect();
        unsubscribe();
        this.direct = candidate;
        candidate.subscribe((event) => this.emit(event));
        for (const event of buffered) this.emit(event);
        return;
      } catch (error) {
        unsubscribe();
        candidate.disconnect();
        lastError = error;
      }
    }
    throw lastError;
  }

  private async primeLocalNetworkPermission(): Promise<string | null> {
    if (
      this.localNetworkPermissionPrimed ||
      typeof window === "undefined" ||
      window.location.protocol !== "https:" ||
      new URL(this.endpoint).protocol !== "http:"
    ) {
      return null;
    }
    let lastError: unknown = new Error("No XRP address is available");
    for (const endpoint of this.candidateEndpoints) {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        this.discoveryTimeoutMs,
      );
      try {
        const response = await globalThis.fetch(
          `${endpoint}/api/v1/info`,
          localNetworkRequestInit(
            endpoint,
            {
              cache: "no-store",
              method: "GET",
              signal: controller.signal,
            },
            window.location.protocol,
          ),
        );
        if (!response.ok)
          throw new Error(`XRP returned HTTP ${response.status}`);
        if (this.options.expectedRobotId) {
          const info = (await response.json()) as PhysicalInfo;
          assertExpectedRobotIdentity(info, this.options.expectedRobotId);
        }
        this.localNetworkPermissionPrimed = true;
        return endpoint;
      } catch (error) {
        lastError = error;
      } finally {
        clearTimeout(timeout);
      }
    }
    if (
      lastError instanceof PhysicalTargetError &&
      (lastError.code === "robot_identity_mismatch" ||
        lastError.code === "robot_identity_missing")
    ) {
      throw lastError;
    }
    const detail =
      lastError instanceof DOMException && lastError.name === "AbortError"
        ? `Known XRP addresses did not reply within ${this.discoveryTimeoutMs / 1_000} second per address`
        : `Cannot reach a known XRP address: ${errorDetail(lastError)}`;
    throw new PhysicalTargetError(
      "network_error",
      `${detail}. ${physicalConnectionRecovery(this.endpoint)}`,
    );
  }

  private shouldPrimeLocalNetworkPermission(error: unknown): boolean {
    return (
      error instanceof PhysicalTargetError &&
      (error.code === "network_error" || error.code === "timeout") &&
      !this.localNetworkPermissionPrimed &&
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      this.candidateEndpoints.some(
        (endpoint) => new URL(endpoint).protocol === "http:",
      )
    );
  }

  private request(
    command:
      | {
          type: "connect";
          endpoints: readonly string[];
          discoveryTimeoutMs: number;
          expectedRobotId?: string;
          providesProject: boolean;
          role: TargetWorkerRole;
        }
      | { type: "check"; project: CourseProject }
      | { type: "prepare"; project: CourseProject }
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
      // The direct target owns the bounded network and recovery deadlines.
      // Duplicating those clocks here can reject a valid reply at the boundary,
      // especially when a worker serializes requests from two application tabs.
      this.pending.set(requestId, { resolve, reject });
      this.worker?.port.postMessage({ ...command, requestId });
    });
  }

  private handleWorkerMessage(message: PhysicalWorkerMessage): void {
    if (message.type === "project-run-snapshot-request") {
      try {
        const provider = this.projectRunProvider;
        if (!provider) {
          throw new Error(
            "The IDE is not ready to provide its current project.",
          );
        }
        this.worker?.port.postMessage({
          type: "project-run-snapshot",
          requestId: message.requestId,
          snapshot: provider(),
        } satisfies PhysicalWorkerCommand);
      } catch (error) {
        this.worker?.port.postMessage({
          type: "project-run-snapshot",
          requestId: message.requestId,
          error: errorDetail(error),
        } satisfies PhysicalWorkerCommand);
      }
      return;
    }
    if (message.type === "telemetry-batch") {
      for (const event of message.events) {
        this.emit({ ...event, replayed: true });
      }
      return;
    }
    if (message.type === "event") {
      this.emit(message.event);
      return;
    }
    const pending = this.pending.get(message.requestId);
    if (!pending) {
      return;
    }
    this.pending.delete(message.requestId);
    if (message.ok) {
      pending.resolve(message.result);
    } else {
      pending.reject(
        new PhysicalTargetError(
          message.errorCode ?? "worker_request_failed",
          message.error,
        ),
      );
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

  private readonly releaseOnPageHide = (event: PageTransitionEvent): void => {
    if (!event.persisted) this.disconnect();
  };

  private readonly releaseOnBeforeUnload = (): void => this.disconnect();

  private observePageLifecycle(): void {
    if (
      this.pageLifecycleObserved ||
      typeof window === "undefined" ||
      typeof window.addEventListener !== "function"
    )
      return;
    window.addEventListener("pagehide", this.releaseOnPageHide);
    window.addEventListener("beforeunload", this.releaseOnBeforeUnload);
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
    window.removeEventListener("beforeunload", this.releaseOnBeforeUnload);
    this.pageLifecycleObserved = false;
  }

  private rejectPending(detail: string): void {
    for (const pending of this.pending.values()) {
      pending.reject(new Error(detail));
    }
    this.pending.clear();
  }

  private emit(event: TargetEvent): void {
    if (event.type === "console" && event.eventId) {
      if (this.seenConsoleEventIds.has(event.eventId)) {
        return;
      }
      this.seenConsoleEventIds.add(event.eventId);
      this.consoleEventOrder.push(event.eventId);
      if (this.consoleEventOrder.length > 4_000) {
        const removed = this.consoleEventOrder.shift();
        if (removed) {
          this.seenConsoleEventIds.delete(removed);
        }
      }
    }
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
