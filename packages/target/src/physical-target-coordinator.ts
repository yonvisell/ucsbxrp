import type {
  PhysicalWorkerCommand,
  PhysicalWorkerMessage,
} from "./physical-worker-protocol";
import type { TargetClient, TargetEvent } from "./types";

export interface PhysicalWorkerPort {
  postMessage(message: PhysicalWorkerMessage): void;
  close(): void;
}

type PhysicalTargetFactory = (endpoint: string) => TargetClient;
type ConsoleEvent = Extract<TargetEvent, { type: "console" }>;

const CONSOLE_HISTORY_LIMIT = 2_000;

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
  private readonly deliveredConsoleIds = new Map<
    PhysicalWorkerPort,
    { ids: Set<string>; order: string[] }
  >();
  private readonly consoleHistory: ConsoleEvent[] = [];
  private readonly retainedConsoleIds = new Set<string>();
  private target: TargetClient | null = null;
  private targetEndpoint: string | null = null;
  private connection: Promise<void> | null = null;
  private commandQueue: Promise<void> = Promise.resolve();
  private workerEventSequence = 0;
  private latestStatus: TargetEvent = {
    type: "status",
    state: "disconnected",
    detail: "Physical XRP disconnected",
  };
  private latestTelemetry: TargetEvent | null = null;
  private latestProject: TargetEvent = { type: "project", project: null };
  private latestRuntime: TargetEvent | null = null;
  private latestWorld: TargetEvent | null = null;

  constructor(private readonly makeTarget: PhysicalTargetFactory) {}

  attach(port: PhysicalWorkerPort): void {
    this.ports.add(port);
    this.deliveredConsoleIds.set(port, { ids: new Set(), order: [] });
  }

  handle(port: PhysicalWorkerPort, command: PhysicalWorkerCommand): void {
    if (command.type === "disconnect") {
      this.detach(port);
      return;
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
    this.ports.delete(port);
    this.deliveredConsoleIds.delete(port);
    port.close();
    if (this.ports.size !== 0) {
      return;
    }
    this.target?.disconnect();
    this.target = null;
    this.targetEndpoint = null;
    this.connection = null;
    this.clearRetainedState();
  }

  private async execute(
    port: PhysicalWorkerPort,
    command: Exclude<PhysicalWorkerCommand, { type: "disconnect" }>,
  ): Promise<void> {
    try {
      if (command.type === "connect") {
        const replayRequired = await this.connectTarget(command.endpoint);
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
      } else if (command.type === "sync") {
        await this.target.synchronize(command.project);
      } else if (command.type === "run") {
        await this.target.run(command.project);
      } else if (command.type === "run-current") {
        await this.target.runCurrent();
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

  /** Return true only when the caller joined an already-settled target. */
  private async connectTarget(endpoint: string): Promise<boolean> {
    if (this.target && this.targetEndpoint === endpoint) {
      if (this.connection) {
        await this.connection;
        return false;
      }
      return true;
    }

    this.target?.disconnect();
    this.clearRetainedState();
    const nextTarget = this.makeTarget(endpoint);
    this.target = nextTarget;
    this.targetEndpoint = endpoint;
    nextTarget.subscribe((event) => this.broadcast(event));
    const pendingConnection = nextTarget.connect();
    this.connection = pendingConnection;
    try {
      await pendingConnection;
      if (this.target !== nextTarget) {
        throw new Error("Physical XRP target changed while connecting");
      }
      return false;
    } catch (error) {
      if (this.target === nextTarget) {
        // Retain the broadcast error state, but release the failed target. All
        // attached tabs remain available for the next shared Retry action.
        this.target = null;
        this.targetEndpoint = null;
      }
      throw error;
    } finally {
      if (this.connection === pendingConnection) {
        this.connection = null;
      }
    }
  }

  private clearRetainedState(): void {
    this.consoleHistory.length = 0;
    this.retainedConsoleIds.clear();
    this.latestStatus = {
      type: "status",
      state: "disconnected",
      detail: "Physical XRP disconnected",
    };
    this.latestTelemetry = null;
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
    const event =
      rawEvent.type === "console"
        ? this.normalizeConsoleEvent(rawEvent)
        : rawEvent;
    if (event.type === "status") {
      this.latestStatus = event;
    } else if (event.type === "telemetry") {
      this.latestTelemetry = event;
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
    this.send(port, { type: "event", event: this.latestStatus });
    if (this.latestTelemetry) {
      this.send(port, { type: "event", event: this.latestTelemetry });
    }
    this.send(port, { type: "event", event: this.latestProject });
    if (this.latestRuntime) {
      this.send(port, { type: "event", event: this.latestRuntime });
    }
    if (this.latestWorld) {
      this.send(port, { type: "event", event: this.latestWorld });
    }
    for (const event of this.consoleHistory) {
      this.send(port, { type: "event", event });
    }
  }

  private send(port: PhysicalWorkerPort, message: PhysicalWorkerMessage): void {
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
}
