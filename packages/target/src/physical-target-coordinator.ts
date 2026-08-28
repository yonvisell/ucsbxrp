import type {
  PhysicalWorkerCommand,
  PhysicalWorkerMessage,
} from "./physical-worker-protocol";
import {
  TelemetryEventHistory,
  type TelemetryEvent,
} from "./telemetry-event-history";
import { ProjectRunProviderBroker } from "./project-run-provider";
import type { TargetClient, TargetEvent } from "./types";
import type { TargetWorkerRole, WorkerTelemetryEvent } from "./worker-protocol";

export interface PhysicalWorkerPort {
  postMessage(message: PhysicalWorkerMessage): void;
  close(): void;
}

type PhysicalTargetFactory = (
  endpoint: string,
  requestTimeoutMs?: number,
  expectedRobotId?: string,
) => TargetClient;
type ConsoleEvent = Extract<TargetEvent, { type: "console" }>;

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
export class PhysicalTargetCoordinator {
  private readonly ports = new Set<PhysicalWorkerPort>();
  private readonly roles = new Map<PhysicalWorkerPort, TargetWorkerRole>();
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
  private retainingRunTelemetry = false;
  private readonly projectRunProvider =
    new ProjectRunProviderBroker<PhysicalWorkerPort>(
      (port, request) => this.send(port, request),
      () => this.publishProjectProviderState(),
    );
  private target: TargetClient | null = null;
  private targetEndpoint: string | null = null;
  private targetExpectedRobotId: string | null = null;
  private connection: Promise<void> | null = null;
  private commandQueue: Promise<void> = Promise.resolve();
  private workerEventSequence = 0;
  private latestStatus: TargetEvent = {
    type: "status",
    state: "disconnected",
    detail: "Physical XRP disconnected",
  };
  private latestProject: TargetEvent = { type: "project", project: null };
  private latestRuntime: TargetEvent | null = null;
  private latestWorld: TargetEvent | null = null;

  constructor(private readonly makeTarget: PhysicalTargetFactory) {}

  attach(port: PhysicalWorkerPort): void {
    this.ports.add(port);
    this.deliveredConsoleIds.set(port, { ids: new Set(), order: [] });
    this.deliveredTelemetry.set(port, new WeakSet());
    this.sendProjectProviderState(port);
  }

  handle(port: PhysicalWorkerPort, command: PhysicalWorkerCommand): void {
    if (command.type === "set-role") {
      this.roles.set(port, command.role);
      return;
    }
    if (command.type === "disconnect") {
      this.detach(port);
      return;
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
    if (command.type === "connect" && command.providesProject) {
      this.projectRunProvider.register(port);
      this.publishProjectProviderState();
    }
    if (command.type === "connect") {
      this.roles.set(
        port,
        command.role ?? (command.providesProject ? "ide" : "monitor"),
      );
    }
    const operation = this.commandQueue.then(async () => {
      if (!this.ports.has(port)) {
        return;
      }
      await this.execute(port, command);
    });
    this.commandQueue = operation.catch(() => undefined);
  }

  private detach(port: PhysicalWorkerPort): void {
    const providerChanged = this.projectRunProvider.unregister(port);
    this.ports.delete(port);
    this.roles.delete(port);
    this.deliveredConsoleIds.delete(port);
    this.deliveredTelemetry.delete(port);
    port.close();
    if (providerChanged) this.publishProjectProviderState();
    if (this.ports.size !== 0) {
      return;
    }
    this.target?.disconnect();
    this.target = null;
    this.targetEndpoint = null;
    this.targetExpectedRobotId = null;
    this.connection = null;
    this.clearRetainedState();
  }

  private async execute(
    port: PhysicalWorkerPort,
    command: Exclude<
      PhysicalWorkerCommand,
      | { type: "set-role" }
      | { type: "disconnect" }
      | { type: "set-project-run-provider" }
      | { type: "project-run-snapshot" }
      | { type: "mark-project-changed" }
    >,
  ): Promise<void> {
    try {
      if (command.type === "connect") {
        const replayRequired = await this.connectTarget(
          command.endpoints ?? (command.endpoint ? [command.endpoint] : []),
          command.discoveryTimeoutMs ?? 1_000,
          command.expectedRobotId,
        );
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
      if (command.type === "check") {
        result = await this.target.check(command.project);
      } else if (command.type === "prepare") {
        await this.target.synchronize(command.project);
      } else if (command.type === "run") {
        await this.target.run(command.project);
      } else if (command.type === "run-current") {
        const snapshot = await this.projectRunProvider.request();
        await this.target.run(snapshot.project);
      } else if (command.type === "mark-project-stale") {
        await this.target.markProjectStale(command.project);
      } else if (command.type === "stop") {
        await this.target.stop();
      } else if (command.type === "reset") {
        await this.target.reset();
      } else if (command.type === "set-runtime-parameter") {
        await this.target.setRuntimeParameter(command.name, command.value);
      }
      this.send(port, {
        type: "response",
        requestId: command.requestId,
        ok: true,
        result,
      });
    } catch (error) {
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
      (!normalizedExpectedRobotId ||
        normalizedExpectedRobotId === this.targetExpectedRobotId)
    ) {
      if (this.connection) {
        await this.connection;
        return false;
      }
      return true;
    }

    this.target?.disconnect();
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
        unsubscribe();
        this.target = nextTarget;
        this.targetEndpoint = endpoint;
        this.targetExpectedRobotId = normalizedExpectedRobotId;
        nextTarget.subscribe((event) => this.broadcast(event));
        for (const event of buffered) this.broadcast(event);
        return false;
      } catch (error) {
        unsubscribe();
        nextTarget.disconnect();
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
    this.retainingRunTelemetry = false;
    this.latestStatus = {
      type: "status",
      state: "disconnected",
      detail: "Physical XRP disconnected",
    };
    this.latestProject = { type: "project", project: null };
    this.latestRuntime = null;
    this.latestWorld = null;
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
    if (event.type === "status") {
      this.latestStatus = event;
      if (
        this.retainingRunTelemetry &&
        event.state !== "loading" &&
        event.state !== "running"
      ) {
        // A late Monitor needs the completed run, not the continuing idle
        // telemetry stream. Live telemetry is still broadcast below.
        this.retainingRunTelemetry = false;
      }
    } else if (event.type === "telemetry") {
      if (this.retainingRunTelemetry) {
        this.telemetryHistory.retain(event);
      }
    } else if (event.type === "project") {
      this.latestProject = event;
    } else if (event.type === "runtime") {
      this.latestRuntime = event;
    } else if (event.type === "world") {
      this.latestWorld = event;
    } else if (event.type === "console") {
      if (event.eventId && this.retainedConsoleIds.has(event.eventId)) {
        return;
      }
      if (event.action === "run" && event.phase === "request") {
        // A physical run restarts the device telemetry sequence. Retaining
        // only this run prevents a late Monitor from combining separate runs.
        this.telemetryHistory.clear();
        this.retainingRunTelemetry = true;
      }
      if (event.eventId) {
        this.retainedConsoleIds.add(event.eventId);
      }
      this.consoleHistory.push(event);
      if (this.consoleHistory.length > CONSOLE_HISTORY_LIMIT) {
        const removed = this.consoleHistory.shift();
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
  }

  private retainedRun(): Omit<
    Extract<TargetEvent, { type: "run-history" }>,
    "phase"
  > | null {
    const request = this.consoleHistory.findLast(
      (event) => event.action === "run" && event.phase === "request",
    );
    const runId = request?.requestId ?? request?.eventId;
    if (!request || !runId || this.latestStatus.type !== "status") return null;
    const terminal = this.consoleHistory.findLast(
      (event) =>
        event.requestId === runId &&
        (event.phase === "result" || event.phase === "error"),
    );
    return {
      type: "run-history",
      runId,
      startedAtMs: request.timestampMs ?? Date.now(),
      ...(terminal?.timestampMs === undefined
        ? {}
        : { finishedAtMs: terminal.timestampMs }),
      state: this.latestStatus.state,
      detail: this.latestStatus.detail,
    };
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
