/// <reference lib="webworker" />

import { XrpSimulator } from "@ucsb-xrp/simulator";

import { RunOwnerLease } from "./run-owner-lease";
import type {
  RuntimeWorkerMessage,
  TargetWorkerCommand,
  TargetWorkerMessage,
} from "./worker-protocol";
import type { TargetEvent, TargetRunState } from "./types";

declare const self: SharedWorkerGlobalScope;

const simulator = new XrpSimulator();
const ports = new Set<MessagePort>();
const consoleHistory: TargetEvent[] = [];
const runOwnerLease = new RunOwnerLease<MessagePort>(1_600);
let activeRunId = 0;
let currentState: TargetRunState = "ready";
let currentDetail = "Virtual target ready";

function send(port: MessagePort, message: TargetWorkerMessage): void {
  port.postMessage(message);
}

function broadcast(event: TargetEvent): void {
  if (event.type === "console") {
    consoleHistory.push(event);
    if (consoleHistory.length > 200) {
      consoleHistory.shift();
    }
  }
  for (const port of ports) {
    send(port, { type: "event", event });
  }
}

function broadcastMessage(message: TargetWorkerMessage): void {
  for (const port of ports) {
    send(port, message);
  }
}

function status(state: TargetRunState, detail: string): void {
  currentState = state;
  currentDetail = detail;
  broadcast({ type: "status", state, detail });
}

function telemetryEvent(): TargetEvent {
  const state = simulator.state;
  return {
    type: "telemetry",
    sample: {
      tMs: state.tMs,
      seq: state.seq,
      xMm: state.pose.xMm,
      yMm: state.pose.yMm,
      headingRad: state.pose.headingRad,
      leftEffort: state.leftEffort,
      rightEffort: state.rightEffort,
      leftWheelSpeedMmS: state.leftWheelSpeedMmS,
      rightWheelSpeedMmS: state.rightWheelSpeedMmS,
      leftEncoderCount: state.leftEncoderCount,
      rightEncoderCount: state.rightEncoderCount,
      collision: state.collision,
    },
  };
}

function stopRuntime(): void {
  simulator.stop();
  broadcast(telemetryEvent());
}

function invalidateRun(detail: string): void {
  const stoppedRunId = activeRunId;
  activeRunId += 1;
  runOwnerLease.clear();
  stopRuntime();
  if (stoppedRunId > 0) {
    broadcastMessage({ type: "terminate-runtime", runId: stoppedRunId });
  }
  broadcast({ type: "console", stream: "system", line: detail });
  status("error", detail);
}

function prepareRuntime(port: MessagePort, requestId: string): void {
  const previousRunId = activeRunId;
  activeRunId += 1;
  if (previousRunId > 0) {
    broadcastMessage({
      type: "terminate-runtime",
      runId: previousRunId,
    });
  }
  stopRuntime();
  consoleHistory.length = 0;
  simulator.reset();
  runOwnerLease.begin(port, activeRunId, performance.now());
  broadcast(telemetryEvent());
  status("loading", "Loading MicroPython 1.28");
  send(port, {
    type: "response",
    requestId,
    ok: true,
    result: { runId: activeRunId },
  });
}

function handleRuntimeMessage(
  port: MessagePort,
  runId: number,
  message: RuntimeWorkerMessage,
): void {
  if (runId !== activeRunId || !runOwnerLease.owns(port, runId)) {
    return;
  }
  if (message.type === "runtime-ready") {
    status("running", `MicroPython ${message.version} · virtual XRP`);
  } else if (message.type === "effort") {
    simulator.setMotorEffort(message.side, message.effort);
  } else if (message.type === "console") {
    broadcast({
      type: "console",
      stream: message.stream,
      line: message.line,
    });
  } else if (message.type === "run-complete") {
    runOwnerLease.clear();
    stopRuntime();
    status("ready", "Program completed; motor effort is zero");
    broadcastMessage({ type: "terminate-runtime", runId });
  } else if (message.type === "error") {
    runOwnerLease.clear();
    stopRuntime();
    broadcast({ type: "console", stream: "stderr", line: message.detail });
    status("error", "Program stopped after a MicroPython exception");
    broadcastMessage({ type: "terminate-runtime", runId });
  }
}

function handleCommand(port: MessagePort, command: TargetWorkerCommand): void {
  if (command.type === "disconnect") {
    if (runOwnerLease.ownsPort(port)) {
      invalidateRun("Run owner disconnected; motor effort set to zero");
    }
    ports.delete(port);
    port.close();
    if (ports.size === 0) {
      stopRuntime();
      currentState = "ready";
      currentDetail = "Virtual target ready";
    }
    return;
  }

  if (command.type === "connect") {
    send(port, { type: "response", requestId: command.requestId, ok: true });
    send(port, {
      type: "event",
      event: {
        type: "status",
        state: currentState,
        detail: currentDetail,
      },
    });
    send(port, { type: "event", event: telemetryEvent() });
    for (const event of consoleHistory) {
      send(port, { type: "event", event });
    }
  } else if (command.type === "prepare-run") {
    prepareRuntime(port, command.requestId);
  } else if (command.type === "runtime-message") {
    handleRuntimeMessage(port, command.runId, command.message);
  } else if (command.type === "run-owner-heartbeat") {
    runOwnerLease.heartbeat(port, command.runId, performance.now());
  } else if (command.type === "stop") {
    const stoppedRunId = activeRunId;
    activeRunId += 1;
    runOwnerLease.clear();
    stopRuntime();
    if (stoppedRunId > 0) {
      broadcastMessage({
        type: "terminate-runtime",
        runId: stoppedRunId,
      });
    }
    broadcast({
      type: "console",
      stream: "system",
      line: "Run stopped; motor effort set to zero",
    });
    status("ready", "Stopped");
    send(port, { type: "response", requestId: command.requestId, ok: true });
  } else if (command.type === "reset") {
    const stoppedRunId = activeRunId;
    activeRunId += 1;
    runOwnerLease.clear();
    stopRuntime();
    if (stoppedRunId > 0) {
      broadcastMessage({
        type: "terminate-runtime",
        runId: stoppedRunId,
      });
    }
    simulator.reset();
    consoleHistory.length = 0;
    broadcast(telemetryEvent());
    status("ready", "Virtual XRP reset");
    send(port, { type: "response", requestId: command.requestId, ok: true });
  }
}

self.onconnect = (event: MessageEvent) => {
  const port = event.ports[0];
  if (!port) {
    return;
  }
  ports.add(port);
  port.onmessage = (message: MessageEvent<TargetWorkerCommand>) => {
    handleCommand(port, message.data);
  };
  port.start();
};

setInterval(() => {
  if (runOwnerLease.expired(performance.now())) {
    invalidateRun("Run owner heartbeat expired; motor effort set to zero");
    return;
  }
  const state = simulator.state;
  const isCoasting =
    state.leftWheelSpeedMmS !== 0 || state.rightWheelSpeedMmS !== 0;
  if (currentState === "running" || isCoasting) {
    simulator.step();
    broadcast(telemetryEvent());
  }
}, simulator.config.fixedStepMs);

export {};
