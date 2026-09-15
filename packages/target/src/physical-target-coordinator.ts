import type {
  PhysicalWorkerCommand,
  PhysicalWorkerMessage,
} from "./physical-worker-protocol";
import {
  TelemetryEventHistory,
  type TelemetryEvent,
} from "./telemetry-event-history";
import { ProjectRunProviderBroker } from "./project-run-provider";
import { RetainedRun } from "./retained-run";
import type { TargetClient, TargetEvent } from "./types";
import type { TargetWorkerRole, WorkerTelemetryEvent } from "./worker-protocol";

export interface PhysicalWorkerPort {
  postMessage(message: PhysicalWorkerMessage): void;
  close(): void;
}

type PollDrivenPhysicalTarget = TargetClient & {
  requestPollIfDue?(): void;
  interruptPendingCommands?(): void;
};

type PhysicalTargetFactory = (
  endpoint: string,
  requestTimeoutMs?: number,
  expectedRobotId?: string,
) => PollDrivenPhysicalTarget;
type ConsoleEvent = Extract<TargetEvent, { type: "console" }>;

interface PhysicalConnectionRequest {
  endpoints: readonly string[];
  discoveryTimeoutMs: number;
  expectedRobotId?: string;
}

const CONSOLE_HISTORY_LIMIT = 2_000;
export const PHYSICAL_TELEMETRY_REPLAY_BATCH_SIZE = 128;

function errorDetail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function errorCode(error: unknown): string | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  return undefined;
}

/**
 * Owns the one physical connection shared by the IDE and Monitor.
 *
 * Commands are serialized here, rather than independently in each tab. A tab
 * joining an established connection receives one retained snapshot; a tab
 * that observed a failed connection remains attached and can recover when
 * either app retries.
 */
class PhysicalTargetSession {
  private readonly ports = new Set<PhysicalWorkerPort>();
  private readonly roles = new Map<PhysicalWorkerPort, TargetWorkerRole>();
  private readonly departureEpochs = new Map<PhysicalWorkerPort, number>();
  private runInitiator: PhysicalWorkerPort | null = null;
  private runInitiatorStarting = false;
  private departureStop: Promise<void> | null = null;
  private readonly deliveredConsoleIds = new Map<
    PhysicalWorkerPort,
    { ids: Set<string>; order: string[] }
  >();
  private readonly deliveredTelemetry = new Map<
    PhysicalWorkerPort,
    WeakSet<TelemetryEvent>
  >();
  private readonly consoleHistory: ConsoleEvent[] = [];
  private readonly retainedConsoleIds = new Set<string>();
  private readonly telemetryHistory = new TelemetryEventHistory();
  private readonly pendingLiveTelemetry = new Map<
    PhysicalWorkerPort,
    WorkerTelemetryEvent[]
  >();
  private liveTelemetryFlushScheduled = false;
  private retainingRunTelemetry = false;
  private readonly projectRunProvider =
    new ProjectRunProviderBroker<PhysicalWorkerPort>(
      (port, request) => this.send(port, request),
      () => this.publishProjectProviderState(),
    );
  private target: PollDrivenPhysicalTarget | null = null;
  private targetEndpoint: string | null = null;
  private targetExpectedRobotId: string | null = null;
  private connection: Promise<void> | null = null;
  private lastConnectionRequest: PhysicalConnectionRequest | null = null;
  private resumeRecoveryArmedTarget: TargetClient | null = null;
  private resumeRecovery: Promise<void> | null = null;
  private commandQueue: Promise<void> = Promise.resolve();
  private commandGeneration = 0;
  private connectionGeneration = 0;
  private readonly queued = new Map<string, () => void>();
  private readonly latestParameterRequest = new Map<string, string>();
  private suppressCancelledEvents = false;
  private nextCommand = 0;
  private readonly run = new RetainedRun();
  readonly bindingEndpoints: readonly string[];
  readonly bindingRobotId: string | null;
  private workerEventSequence = 0;
  private latestStatus: TargetEvent = {
    type: "status",
    state: "disconnected",
    detail: "Physical XRP disconnected",
  };
  private latestProject: TargetEvent = { type: "project", project: null };
  private latestRuntime: TargetEvent | null = null;
  private latestWorld: TargetEvent | null = null;
  private latestControl: TargetEvent | null = null;

  constructor(
    private readonly makeTarget: PhysicalTargetFactory,
    endpoints: readonly string[],
    robotId?: string,
    private readonly onEmpty: () => void = () => undefined,
  ) {
    this.bindingEndpoints = endpoints;
    this.bindingRobotId = robotId?.trim().toLowerCase() || null;
  }

  get size(): number {
    return this.ports.size;
  }
  matches(endpoints: readonly string[], robotId?: string): boolean {
    const id = robotId?.trim().toLowerCase() || null;
    if (id !== this.bindingRobotId) return false;
    return (
      id !== null ||
      endpoints.includes(this.targetEndpoint ?? this.bindingEndpoints[0] ?? "")
    );
  }

  attach(port: PhysicalWorkerPort): void {
    this.ports.add(port);
    this.departureEpochs.set(port, 0);
    this.deliveredConsoleIds.set(port, { ids: new Set(), order: [] });
    this.deliveredTelemetry.set(port, new WeakSet());
    this.sendProjectProviderState(port);
  }

  handle(port: PhysicalWorkerPort, command: PhysicalWorkerCommand): void {
    let stoppingForDeparture = false;
    if (command.type === "stop-owned-run") {
      this.departureEpochs.set(port, (this.departureEpochs.get(port) ?? 0) + 1);
      if (this.runInitiator !== port || this.departureStop) return;
      if (this.latestControl?.type === "control" && !this.latestControl.owned) {
        this.projectRunProvider.cancelPending();
        if (this.runInitiatorStarting)
          this.target?.interruptPendingCommands?.();
        return;
      }
      // Authority belongs to the port that initiated this run, not every port
      // sharing the browser's device control session. Keep the admitted Stop
      // alive even if that window actually departs before its response.
      stoppingForDeparture = true;
      command = { type: "stop", requestId: `departure-${++this.nextCommand}` };
    }
    if (command.type === "set-role") {
      if (this.roles.get(port) !== command.role) {
        this.pendingLiveTelemetry.delete(port);
      }
      this.roles.set(port, command.role);
      return;
    }
    if (command.type === "poll-frame") {
      if (this.ports.has(port)) {
        this.target?.requestPollIfDue?.();
      }
      return;
    }
    if (command.type === "disconnect") {
      this.detach(port);
      return;
    }
    const priority = command.type === "stop" || command.type === "reset";
    if (priority) {
      this.commandGeneration += 1;
      this.projectRunProvider.cancelPending();
      for (const cancel of this.queued.values()) cancel();
      this.queued.clear();
      this.suppressCancelledEvents = true;
      this.target?.interruptPendingCommands?.();
      this.broadcast({
        type: "status",
        state: "loading",
        detail:
          command.type === "stop"
            ? "Stop requested; cancelling pending work and checking the XRP…"
            : "Reset requested; cancelling pending work…",
      });
    }
    if (command.type === "set-project-run-provider") {
      if (command.providesProject) {
        this.projectRunProvider.register(port, command.takeover === true);
      } else {
        this.projectRunProvider.unregister(port);
      }
      this.publishProjectProviderState();
      return;
    }
    if (command.type === "project-run-snapshot") {
      this.projectRunProvider.accept(port, command);
      return;
    }
    if (command.type === "mark-project-changed") {
      if (!this.projectRunProvider.providerIs(port)) return;
      const operation = this.commandQueue.then(() => {
        if (this.ports.has(port))
          this.target?.markProjectChanged(command.project);
      });
      this.commandQueue = operation.catch(() => undefined);
      return;
    }
    if (command.type === "resume") {
      this.armResumeRecovery(port);
      return;
    }
    if (command.type === "connect" && command.providesProject) {
      this.projectRunProvider.register(port);
      this.publishProjectProviderState();
    }
    if (command.type === "connect") {
      const role =
        command.role ?? (command.providesProject ? "ide" : "monitor");
      if (this.roles.get(port) !== role) {
        this.pendingLiveTelemetry.delete(port);
      }
      this.roles.set(port, role);
    }
    const generation = this.commandGeneration;
    const departureEpoch = this.departureEpochs.get(port);
    const admittedAt = Date.now();
    const queueKey = String(++this.nextCommand);
    if (command.type === "set-runtime-parameter")
      this.latestParameterRequest.set(command.name, queueKey);
    let cancelled = false;
    const cancel = () => {
      if (cancelled) return;
      cancelled = true;
      if ("requestId" in command)
        this.send(port, {
          type: "response",
          requestId: command.requestId,
          ok: false,
          error: "Operation cancelled by Stop, Reset, or a newer request.",
          errorCode: "operation_cancelled",
        });
    };
    if ("requestId" in command && !stoppingForDeparture)
      this.queued.set(queueKey, cancel);
    const operation = this.commandQueue.then(async () => {
      if ("requestId" in command) this.queued.delete(queueKey);
      if (cancelled) return;
      if (!this.ports.has(port) && !stoppingForDeparture) {
        cancel();
        return;
      }
      if (
        !priority &&
        (generation !== this.commandGeneration ||
          departureEpoch !== this.departureEpochs.get(port) ||
          Date.now() - admittedAt > 5_000 ||
          (command.type === "set-runtime-parameter" &&
            this.latestParameterRequest.get(command.name) !== queueKey))
      ) {
        cancel();
        return;
      }
      if (priority) this.suppressCancelledEvents = false;
      await this.execute(port, command, generation, departureEpoch);
    });
    this.commandQueue = operation.catch(() => undefined);
    if (stoppingForDeparture) {
      this.departureStop = operation;
      void this.commandQueue.then(() => {
        if (this.departureStop !== operation) return;
        this.departureStop = null;
        if (this.ports.size === 0) this.releaseEmptySession();
      });
    }
  }

  private detach(port: PhysicalWorkerPort): void {
    this.handle(port, { type: "stop-owned-run" });
    const providerChanged = this.projectRunProvider.unregister(port);
    this.ports.delete(port);
    this.roles.delete(port);
    this.departureEpochs.delete(port);
    this.pendingLiveTelemetry.delete(port);
    this.deliveredConsoleIds.delete(port);
    this.deliveredTelemetry.delete(port);
    port.close();
    if (providerChanged) this.publishProjectProviderState();
    if (this.ports.size !== 0 || this.departureStop) {
      return;
    }
    this.releaseEmptySession();
  }

  private releaseEmptySession(): void {
    this.connectionGeneration += 1;
    this.commandGeneration += 1;
    this.projectRunProvider.cancelPending();
    this.target?.disconnect();
    this.target = null;
    this.targetEndpoint = null;
    this.targetExpectedRobotId = null;
    this.connection = null;
    this.lastConnectionRequest = null;
    this.resumeRecoveryArmedTarget = null;
    this.resumeRecovery = null;
    this.clearRetainedState();
    this.onEmpty();
  }

  private armResumeRecovery(port: PhysicalWorkerPort): void {
    const target = this.target;
    if (!this.ports.has(port) || !target || !this.lastConnectionRequest) {
      return;
    }
    this.resumeRecoveryArmedTarget = target;
    this.startArmedResumeRecovery();
  }

  private startArmedResumeRecovery(): void {
    const target = this.resumeRecoveryArmedTarget;
    const connectionRequest = this.lastConnectionRequest;
    if (
      this.resumeRecovery ||
      !target ||
      this.target !== target ||
      !connectionRequest ||
      this.latestStatus.type !== "status" ||
      this.latestStatus.state !== "error"
    ) {
      return;
    }
    this.resumeRecoveryArmedTarget = null;
    const operation = this.commandQueue.then(async () => {
      if (
        this.ports.size === 0 ||
        this.target !== target ||
        this.lastConnectionRequest !== connectionRequest ||
        this.latestStatus.type !== "status" ||
        this.latestStatus.state !== "error"
      ) {
        return;
      }
      this.broadcast({
        type: "status",
        state: "connecting",
        detail: "Checking the XRP after the browser resumed",
      });
      try {
        await this.connectTarget(
          connectionRequest.endpoints,
          connectionRequest.discoveryTimeoutMs,
          connectionRequest.expectedRobotId,
          true,
        );
      } catch (error) {
        this.broadcast({
          type: "status",
          state: "error",
          detail: errorDetail(error),
        });
      }
    });
    this.resumeRecovery = operation;
    this.commandQueue = operation.finally(() => {
      if (this.resumeRecovery === operation) {
        this.resumeRecovery = null;
      }
    });
  }

  private async execute(
    port: PhysicalWorkerPort,
    command: Exclude<
      PhysicalWorkerCommand,
      | { type: "set-role" }
      | { type: "poll-frame" }
      | { type: "disconnect" }
      | { type: "stop-owned-run" }
      | { type: "resume" }
      | { type: "set-project-run-provider" }
      | { type: "project-run-snapshot" }
      | { type: "mark-project-changed" }
    >,
    generation = this.commandGeneration,
    departureEpoch = this.departureEpochs.get(port),
  ): Promise<void> {
    let ownsStart = false;
    try {
      if (command.type === "connect") {
        const connectionRequest: PhysicalConnectionRequest = {
          endpoints: [
            ...(command.endpoints ??
              (command.endpoint ? [command.endpoint] : [])),
          ],
          discoveryTimeoutMs: command.discoveryTimeoutMs ?? 1_000,
          ...(command.expectedRobotId === undefined
            ? {}
            : { expectedRobotId: command.expectedRobotId }),
        };
        const replayRequired = await this.connectTarget(
          connectionRequest.endpoints,
          connectionRequest.discoveryTimeoutMs,
          connectionRequest.expectedRobotId,
        );
        if (generation !== this.commandGeneration)
          throw new Error("Connection cancelled by Stop or Reset");
        if (!replayRequired || !this.lastConnectionRequest)
          this.lastConnectionRequest = connectionRequest;
        this.send(port, {
          type: "response",
          requestId: command.requestId,
          ok: true,
        });
        if (replayRequired) {
          this.sendCurrentState(port);
        }
        return;
      }
      if (!this.target) {
        throw new Error("Physical XRP is not connected");
      }

      let result;
      const startsRun =
        command.type === "run" || command.type === "run-current";
      if (
        startsRun &&
        this.runInitiator === null &&
        this.latestStatus.type === "status" &&
        this.latestStatus.state !== "running" &&
        this.latestStatus.state !== "loading"
      ) {
        this.runInitiator = port;
        this.runInitiatorStarting = true;
        ownsStart = true;
      }
      if (command.type === "check") {
        result = await this.target.check(command.project);
      } else if (command.type === "prepare") {
        await this.target.synchronize(command.project, command.projectId);
      } else if (command.type === "run") {
        await this.target.run(command.project, command.projectId);
      } else if (command.type === "run-current") {
        const snapshot = await this.projectRunProvider.request();
        if (
          generation !== this.commandGeneration ||
          departureEpoch !== this.departureEpochs.get(port) ||
          !this.ports.has(port)
        )
          throw new Error("Run cancelled");
        await this.target.run(snapshot.project, snapshot.projectId);
      } else if (command.type === "mark-project-stale") {
        await this.target.markProjectStale(command.project, command.projectId);
      } else if (command.type === "stop") {
        await this.target.stop();
      } else if (command.type === "reset") {
        await this.target.reset();
      } else if (command.type === "claim-control") {
        if (!this.target.claimControl)
          throw new Error("This XRP does not provide control ownership");
        await this.target.claimControl();
      } else if (command.type === "set-runtime-parameter") {
        await this.target.setRuntimeParameter(command.name, command.value);
      }
      if (generation !== this.commandGeneration)
        throw new Error("Operation cancelled by Stop or Reset");
      this.send(port, {
        type: "response",
        requestId: command.requestId,
        ok: true,
        result,
      });
    } catch (error) {
      if (generation !== this.commandGeneration) {
        this.send(port, {
          type: "response",
          requestId: command.requestId,
          ok: false,
          error: "Operation cancelled by Stop or Reset",
          errorCode: "operation_cancelled",
        });
        return;
      }
      if (
        command.type === "connect" &&
        (!this.latestStatus ||
          this.latestStatus.type !== "status" ||
          this.latestStatus.state !== "error")
      ) {
        this.broadcast({
          type: "status",
          state: "error",
          detail: errorDetail(error),
        });
      }
      this.send(port, {
        type: "response",
        requestId: command.requestId,
        ok: false,
        error: errorDetail(error),
        errorCode: errorCode(error),
      });
      if (command.type !== "connect") {
        // App-level command handlers temporarily show the rejected operation.
        // Re-broadcast the shared target state after that response so one tab
        // cannot remain in a private error state while the other is ready.
        this.broadcast(this.latestStatus);
      }
    } finally {
      if (ownsStart) {
        this.runInitiatorStarting = false;
        if (
          this.runInitiator === port &&
          this.latestStatus.type === "status" &&
          this.latestStatus.state === "ready"
        )
          this.runInitiator = null;
      }
    }
  }

  private sendProjectProviderState(port: PhysicalWorkerPort): void {
    this.send(port, {
      type: "event",
      event: {
        type: "project-provider",
        active: this.projectRunProvider.providerIs(port),
        available: this.projectRunProvider.hasProvider(),
      },
    });
  }

  private publishProjectProviderState(): void {
    for (const port of this.ports) this.sendProjectProviderState(port);
  }

  /** Return true only when the caller joined an already-settled target. */
  private async connectTarget(
    endpoints: readonly string[],
    discoveryTimeoutMs: number,
    expectedRobotId?: string,
    forceRediscovery = false,
  ): Promise<boolean> {
    const normalizedExpectedRobotId =
      expectedRobotId?.trim().toLocaleLowerCase() || null;
    const currentConnectionIsHealthy =
      this.latestStatus.type === "status" &&
      this.latestStatus.state !== "error" &&
      this.latestStatus.state !== "disconnected";
    if (
      this.target &&
      this.targetEndpoint &&
      endpoints.includes(this.targetEndpoint) &&
      currentConnectionIsHealthy &&
      !forceRediscovery &&
      (!normalizedExpectedRobotId ||
        normalizedExpectedRobotId === this.targetExpectedRobotId)
    ) {
      if (this.connection) {
        await this.connection;
        return false;
      }
      return true;
    }

    const generation = ++this.connectionGeneration;
    this.target?.disconnect();
    this.resumeRecoveryArmedTarget = null;
    this.target = null;
    this.targetEndpoint = null;
    this.targetExpectedRobotId = null;
    this.clearRetainedState();
    let lastError: unknown = new Error("No XRP address is available");
    for (const endpoint of endpoints) {
      const nextTarget = this.makeTarget(
        endpoint,
        discoveryTimeoutMs,
        normalizedExpectedRobotId ?? undefined,
      );
      const buffered: TargetEvent[] = [];
      const unsubscribe = nextTarget.subscribe((event) => buffered.push(event));
      const pendingConnection = nextTarget.connect();
      this.connection = pendingConnection;
      try {
        await pendingConnection;
        if (generation !== this.connectionGeneration || this.ports.size === 0) {
          unsubscribe();
          nextTarget.disconnect();
          throw new Error(
            "Connection cancelled because its window or session changed",
          );
        }
        unsubscribe();
        this.target = nextTarget;
        this.targetEndpoint = endpoint;
        this.targetExpectedRobotId = normalizedExpectedRobotId;
        nextTarget.subscribe((event) => {
          if (
            this.target === nextTarget &&
            generation === this.connectionGeneration &&
            !this.suppressCancelledEvents
          )
            this.broadcast(event);
        });
        for (const event of buffered) this.broadcast(event);
        return false;
      } catch (error) {
        unsubscribe();
        nextTarget.disconnect();
        if (generation !== this.connectionGeneration || this.ports.size === 0)
          throw error;
        lastError = error;
      } finally {
        if (this.connection === pendingConnection) this.connection = null;
      }
    }
    throw lastError;
  }

  private clearRetainedState(): void {
    this.consoleHistory.length = 0;
    this.retainedConsoleIds.clear();
    this.telemetryHistory.clear();
    this.pendingLiveTelemetry.clear();
    this.retainingRunTelemetry = false;
    this.latestStatus = {
      type: "status",
      state: "disconnected",
      detail: "Physical XRP disconnected",
    };
    this.latestProject = { type: "project", project: null };
    this.latestRuntime = null;
    this.latestWorld = null;
    this.latestControl = null;
    this.runInitiator = null;
    this.runInitiatorStarting = false;
    this.run.clear();
  }

  private normalizeConsoleEvent(event: ConsoleEvent): ConsoleEvent {
    if (event.eventId) {
      return event;
    }
    this.workerEventSequence += 1;
    return {
      ...event,
      eventId: `physical-worker-${this.workerEventSequence}`,
      timestampMs: event.timestampMs ?? Date.now(),
    };
  }

  private broadcast(rawEvent: TargetEvent): void {
    if (rawEvent.type === "telemetry") {
      if (this.retainingRunTelemetry) {
        this.telemetryHistory.retain(rawEvent);
      }
      this.queueLiveTelemetry(rawEvent);
      return;
    }
    // One physical response can contain many samples followed by output and
    // status. Deliver its samples in one worker message, before the boundary
    // event that follows them.
    this.flushLiveTelemetry();
    if (rawEvent.type === "project-provider") {
      // The shared backend has no document-local project provider and reports
      // its own local state as unavailable during connect. Project authority
      // belongs to this coordinator's broker, which knows which attached IDE
      // owns Run. Never let the backend overwrite that per-port state.
      this.publishProjectProviderState();
      return;
    }
    const event =
      rawEvent.type === "console"
        ? this.normalizeConsoleEvent(rawEvent)
        : rawEvent;
    const previousRunId = this.run.snapshot()?.runId;
    this.run.observe(event);
    if (this.run.snapshot()?.runId !== previousRunId) {
      this.telemetryHistory.clear();
      this.retainingRunTelemetry = !this.run.completed;
    }
    if (this.run.completed) this.retainingRunTelemetry = false;
    if (event.type === "status") {
      this.latestStatus = event;
      if (event.state === "ready" && !this.runInitiatorStarting)
        this.runInitiator = null;
      if (event.state === "error") {
        this.startArmedResumeRecovery();
      }
      if (
        this.retainingRunTelemetry &&
        event.state !== "loading" &&
        event.state !== "running" &&
        event.state !== "connecting"
      ) {
        // A late Monitor needs the completed run, not the continuing idle
        // telemetry stream. Live telemetry is still broadcast below.
        this.retainingRunTelemetry = false;
      }
    } else if (event.type === "project") {
      this.latestProject = event;
    } else if (event.type === "runtime") {
      this.latestRuntime = event;
    } else if (event.type === "world") {
      this.latestWorld = event;
    } else if (event.type === "control") {
      this.latestControl = event;
      if (!event.owned && !this.runInitiatorStarting) this.runInitiator = null;
    } else if (event.type === "run" && event.phase === "end") {
      this.runInitiator = null;
    } else if (event.type === "console") {
      if (event.eventId && this.retainedConsoleIds.has(event.eventId)) {
        return;
      }
      if (event.eventId) {
        this.retainedConsoleIds.add(event.eventId);
      }
      this.consoleHistory.push(event);
      if (this.consoleHistory.length > CONSOLE_HISTORY_LIMIT) {
        const removed = this.consoleHistory.shift();
        this.run.discardedOutput();
        if (removed?.eventId) {
          this.retainedConsoleIds.delete(removed.eventId);
        }
      }
    }
    for (const port of this.ports) {
      this.send(port, { type: "event", event });
    }
  }

  private sendCurrentState(port: PhysicalWorkerPort): void {
    this.send(port, { type: "event", event: this.latestProject });
    if (this.latestRuntime) {
      this.send(port, { type: "event", event: this.latestRuntime });
    }
    if (this.latestWorld) {
      this.send(port, { type: "event", event: this.latestWorld });
    }
    if (this.latestControl)
      this.send(port, { type: "event", event: this.latestControl });

    const retainedRun = this.retainedRun();
    if (retainedRun) {
      this.send(port, {
        type: "event",
        event: { ...retainedRun, phase: "begin" },
      });
    }
    // Only the current device status is live. The history envelope restores a
    // completed run for display without starting or archiving it again.
    this.send(port, { type: "event", event: this.latestStatus });
    this.replayTelemetry(port);
    for (const event of this.consoleHistory) {
      this.send(port, {
        type: "event",
        event: { ...event, replayed: true },
      });
    }
    if (retainedRun) {
      this.send(port, {
        type: "event",
        event: { ...retainedRun, phase: "end" },
      });
    }
    this.flushLiveTelemetry();
  }

  private retainedRun(): Omit<
    Extract<TargetEvent, { type: "run-history" }>,
    "phase"
  > | null {
    const run = this.run.snapshot();
    return run
      ? {
          ...run,
          type: "run-history",
          retainedTelemetryDropped: this.telemetryHistory.discardedCount,
        }
      : null;
  }

  private send(port: PhysicalWorkerPort, message: PhysicalWorkerMessage): void {
    if (message.type === "telemetry-batch") {
      if (this.roles.get(port) !== "monitor") return;
      const delivered = this.deliveredTelemetry.get(port);
      const pending = message.events.filter((event) => !delivered?.has(event));
      if (pending.length === 0) return;
      try {
        port.postMessage({ type: "telemetry-batch", events: pending });
        for (const event of pending) delivered?.add(event);
      } catch {
        // A closing tab must not interrupt the shared physical session.
      }
      return;
    }
    if (message.type === "event" && message.event.type === "telemetry") {
      if (this.roles.get(port) !== "monitor") return;
      const delivered = this.deliveredTelemetry.get(port);
      if (delivered?.has(message.event)) return;
      try {
        port.postMessage(message);
        delivered?.add(message.event);
      } catch {
        // A closing tab must not interrupt the shared physical session.
      }
      return;
    }
    if (
      message.type === "event" &&
      message.event.type === "console" &&
      message.event.eventId
    ) {
      const delivered = this.deliveredConsoleIds.get(port);
      if (delivered?.ids.has(message.event.eventId)) {
        return;
      }
      if (delivered) {
        delivered.ids.add(message.event.eventId);
        delivered.order.push(message.event.eventId);
        if (delivered.order.length > CONSOLE_HISTORY_LIMIT * 2) {
          const removed = delivered.order.shift();
          if (removed) {
            delivered.ids.delete(removed);
          }
        }
      }
    }
    try {
      port.postMessage(message);
    } catch {
      // A tab can close while a target request is finishing. The remaining
      // ports and the physical operation must continue unaffected.
    }
  }

  private queueLiveTelemetry(event: WorkerTelemetryEvent): void {
    for (const port of this.ports) {
      if (this.roles.get(port) !== "monitor") continue;
      const pending = this.pendingLiveTelemetry.get(port);
      if (pending) {
        pending.push(event);
      } else {
        this.pendingLiveTelemetry.set(port, [event]);
      }
    }
    if (this.pendingLiveTelemetry.size === 0) return;
    if (this.liveTelemetryFlushScheduled) return;
    this.liveTelemetryFlushScheduled = true;
    queueMicrotask(() => {
      this.liveTelemetryFlushScheduled = false;
      this.flushLiveTelemetry();
    });
  }

  private flushLiveTelemetry(): void {
    if (this.pendingLiveTelemetry.size === 0) return;
    const pending = [...this.pendingLiveTelemetry];
    this.pendingLiveTelemetry.clear();
    for (const [port, events] of pending) {
      this.send(port, { type: "telemetry-batch", events });
    }
  }

  private replayTelemetry(port: PhysicalWorkerPort): number {
    if (this.roles.get(port) !== "monitor") return 0;
    let replayed = 0;
    let batch: WorkerTelemetryEvent[] = [];
    for (const event of this.telemetryHistory.chronological()) {
      const delivered = this.deliveredTelemetry.get(port);
      if (delivered?.has(event)) continue;
      batch.push(event);
      replayed += 1;
      if (batch.length === PHYSICAL_TELEMETRY_REPLAY_BATCH_SIZE) {
        this.send(port, { type: "telemetry-batch", events: batch });
        batch = [];
      }
    }
    if (batch.length > 0) {
      this.send(port, { type: "telemetry-batch", events: batch });
    }
    return replayed;
  }
}

/** Ports retain their own robot binding; attaching another robot cannot retarget them. */
export class PhysicalTargetCoordinator {
  private readonly ports = new Map<
    PhysicalWorkerPort,
    {
      session?: PhysicalTargetSession;
      proxy?: PhysicalWorkerPort;
      role?: TargetWorkerRole;
      provider?: Extract<
        PhysicalWorkerCommand,
        { type: "set-project-run-provider" }
      >;
    }
  >();
  private readonly sessions = new Set<PhysicalTargetSession>();
  constructor(private readonly makeTarget: PhysicalTargetFactory) {}

  attach(port: PhysicalWorkerPort): void {
    this.ports.set(port, {});
    port.postMessage({
      type: "event",
      event: { type: "project-provider", active: false, available: false },
    });
  }

  handle(port: PhysicalWorkerPort, command: PhysicalWorkerCommand): void {
    const binding = this.ports.get(port);
    if (!binding) return;
    if (command.type === "disconnect") {
      this.release(binding);
      this.ports.delete(port);
      port.close();
      return;
    }
    if (command.type === "set-role") binding.role = command.role;
    if (command.type === "set-project-run-provider") binding.provider = command;
    if (command.type === "connect") {
      const endpoints =
        command.endpoints ?? (command.endpoint ? [command.endpoint] : []);
      if (!binding.session?.matches(endpoints, command.expectedRobotId)) {
        this.release(binding);
        let session = [...this.sessions].find((candidate) =>
          candidate.matches(endpoints, command.expectedRobotId),
        );
        if (!session) {
          session = new PhysicalTargetSession(
            this.makeTarget,
            endpoints,
            command.expectedRobotId,
            () => this.sessions.delete(currentSession),
          );
          this.sessions.add(session);
        }
        const currentSession = session;
        const proxy: PhysicalWorkerPort = {
          postMessage: (message) => {
            if (this.ports.get(port) === binding && binding.proxy === proxy)
              port.postMessage(message);
          },
          close: () => undefined,
        };
        binding.session = currentSession;
        binding.proxy = proxy;
        session.attach(proxy);
        if (binding.role)
          session.handle(proxy, { type: "set-role", role: binding.role });
        if (binding.provider) session.handle(proxy, binding.provider);
      }
    }
    if (binding.session && binding.proxy) {
      binding.session.handle(binding.proxy, command);
    } else if ("requestId" in command) {
      port.postMessage({
        type: "response",
        requestId: command.requestId,
        ok: false,
        error: "Connect this window to its XRP before sending a command.",
        errorCode: "not_connected",
      });
    }
  }

  private release(binding: {
    session?: PhysicalTargetSession;
    proxy?: PhysicalWorkerPort;
  }): void {
    const { session, proxy } = binding;
    binding.session = undefined;
    binding.proxy = undefined;
    if (session && proxy) {
      session.handle(proxy, { type: "disconnect" });
    }
  }
}
