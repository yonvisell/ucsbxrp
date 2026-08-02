/// <reference lib="webworker" />

import { DirectPhysicalTargetClient } from "./physical-target";
import type {
  PhysicalWorkerCommand,
  PhysicalWorkerMessage,
} from "./physical-worker-protocol";
import type { TargetEvent } from "./types";

declare const self: SharedWorkerGlobalScope;

const ports = new Set<MessagePort>();
const consoleHistory: TargetEvent[] = [];
let target: DirectPhysicalTargetClient | null = null;
let targetEndpoint: string | null = null;
let connection: Promise<void> | null = null;
let latestStatus: TargetEvent = {
  type: "status",
  state: "disconnected",
  detail: "Physical XRP disconnected",
};
let latestTelemetry: TargetEvent | null = null;
let latestProject: TargetEvent = { type: "project", project: null };

function errorDetail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function send(port: MessagePort, message: PhysicalWorkerMessage): void {
  port.postMessage(message);
}

function broadcast(event: TargetEvent): void {
  if (event.type === "status") {
    latestStatus = event;
  } else if (event.type === "telemetry") {
    latestTelemetry = event;
  } else if (event.type === "project") {
    latestProject = event;
  } else if (event.type === "console") {
    consoleHistory.push(event);
    if (consoleHistory.length > 200) {
      consoleHistory.shift();
    }
  }
  for (const port of ports) {
    send(port, { type: "event", event });
  }
}

function sendCurrentState(port: MessagePort): void {
  send(port, { type: "event", event: latestStatus });
  if (latestTelemetry) {
    send(port, { type: "event", event: latestTelemetry });
  }
  send(port, { type: "event", event: latestProject });
  for (const event of consoleHistory) {
    send(port, { type: "event", event });
  }
}

async function connectTarget(endpoint: string): Promise<void> {
  if (target && targetEndpoint === endpoint) {
    if (connection) {
      await connection;
    }
    return;
  }

  target?.disconnect();
  const nextTarget = new DirectPhysicalTargetClient(endpoint);
  target = nextTarget;
  targetEndpoint = endpoint;
  consoleHistory.length = 0;
  latestTelemetry = null;
  latestProject = { type: "project", project: null };
  nextTarget.subscribe(broadcast);
  const pendingConnection = nextTarget.connect();
  connection = pendingConnection;
  try {
    await pendingConnection;
    if (target !== nextTarget) {
      throw new Error("Physical XRP target changed while connecting");
    }
  } catch (error) {
    if (target === nextTarget) {
      nextTarget.disconnect();
      target = null;
      targetEndpoint = null;
    }
    throw error;
  } finally {
    if (connection === pendingConnection) {
      connection = null;
    }
  }
}

async function handleCommand(
  port: MessagePort,
  command: PhysicalWorkerCommand,
): Promise<void> {
  if (command.type === "disconnect") {
    ports.delete(port);
    port.close();
    if (ports.size === 0) {
      target?.disconnect();
      target = null;
      targetEndpoint = null;
      connection = null;
      latestTelemetry = null;
      latestProject = { type: "project", project: null };
      consoleHistory.length = 0;
    }
    return;
  }

  try {
    if (command.type === "connect") {
      await connectTarget(command.endpoint);
      send(port, { type: "response", requestId: command.requestId, ok: true });
      sendCurrentState(port);
      return;
    }
    if (!target) {
      throw new Error("Physical XRP is not connected");
    }

    let result;
    if (command.type === "check") {
      result = await target.check(command.project);
    } else if (command.type === "sync") {
      await target.synchronize(command.project);
    } else if (command.type === "run") {
      await target.run(command.project);
    } else if (command.type === "run-current") {
      await target.runCurrent();
    } else if (command.type === "mark-project-stale") {
      await target.markProjectStale(command.project);
    } else if (command.type === "stop") {
      await target.stop();
    } else if (command.type === "reset") {
      await target.reset();
    }
    send(port, {
      type: "response",
      requestId: command.requestId,
      ok: true,
      result,
    });
  } catch (error) {
    send(port, {
      type: "response",
      requestId: command.requestId,
      ok: false,
      error: errorDetail(error),
    });
  }
}

self.onconnect = (event: MessageEvent) => {
  const port = event.ports[0];
  if (!port) {
    return;
  }
  ports.add(port);
  port.onmessage = (message: MessageEvent<PhysicalWorkerCommand>) => {
    void handleCommand(port, message.data);
  };
  port.start();
};

export {};
