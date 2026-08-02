/// <reference lib="webworker" />

import {
  XrpSimulator,
  simulatorConfigForScenario,
  type SimulationScenario,
  type XrpSimulatorState,
} from "@ucsb-xrp/simulator";

import { RunOwnerLease } from "./run-owner-lease";
import {
  EMPTY_RUNTIME_STATE,
  encodeRuntimeParameter,
} from "./runtime-controls";
import type {
  RuntimeWorkerMessage,
  TargetWorkerCommand,
  TargetWorkerMessage,
} from "./worker-protocol";
import type {
  CourseProject,
  RuntimeState,
  SynchronizedProject,
  TargetEvent,
  TargetRunState,
} from "./types";

declare const self: SharedWorkerGlobalScope;

let currentScenario: SimulationScenario = "open";
let simulator = new XrpSimulator(simulatorConfigForScenario(currentScenario));
let simulatorState: XrpSimulatorState = simulator.state;
const ports = new Set<MessagePort>();
const consoleHistory: TargetEvent[] = [];
const runOwnerLease = new RunOwnerLease<MessagePort>(1_600);
let activeRunId = 0;
let currentState: TargetRunState = "ready";
let currentDetail = "Virtual target ready";
let currentProject: CourseProject | null = null;
let currentProjectDescriptor: SynchronizedProject | null = null;
let runtimeState: RuntimeState = EMPTY_RUNTIME_STATE;
let runtimeSlots: Record<string, number> = {};

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

function clearRuntimeState(): void {
  runtimeState = EMPTY_RUNTIME_STATE;
  runtimeSlots = {};
  broadcast({ type: "runtime", state: runtimeState });
}

function telemetryEvent(): TargetEvent {
  const state = simulatorState;
  return {
    type: "telemetry",
    sample: {
      tMs: state.tMs,
      seq: state.seq,
      source: "virtual",
      poseAvailable: true,
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
      rangeMm: state.rangeMm,
      buttonPressed: state.buttonPressed,
      accelerationMg: state.accelerationMg,
      angularRateMdps: state.angularRateMdps,
      temperatureC: state.temperatureC,
      batteryV: state.batteryV,
      sensorError: null,
    },
  };
}

function stopRuntime(): void {
  simulatorState = {
    ...simulatorState,
    seq: simulatorState.seq + 1,
    leftEffort: 0,
    rightEffort: 0,
    leftWheelSpeedMmS: 0,
    rightWheelSpeedMmS: 0,
    accelerationMg: [0, 0, 1000],
    angularRateMdps: [0, 0, 0],
  };
  broadcast(telemetryEvent());
}

function invalidateRun(detail: string): void {
  const stoppedRunId = activeRunId;
  activeRunId += 1;
  runOwnerLease.clear();
  stopRuntime();
  clearRuntimeState();
  if (stoppedRunId > 0) {
    broadcastMessage({ type: "terminate-runtime", runId: stoppedRunId });
  }
  broadcast({ type: "console", stream: "system", line: detail });
  status("error", detail);
}

function storeProject(
  project: CourseProject,
  descriptor: SynchronizedProject,
): void {
  currentProject = project;
  currentProjectDescriptor = { ...descriptor, stale: false };
  broadcast({ type: "project", project: currentProjectDescriptor });
}

function prepareRuntime(
  port: MessagePort,
  command: Extract<TargetWorkerCommand, { type: "prepare-run" }>,
): void {
  if (command.project && command.descriptor) {
    storeProject(command.project, command.descriptor);
  }
  if (!currentProject || !currentProjectDescriptor) {
    send(port, {
      type: "response",
      requestId: command.requestId,
      ok: false,
      error:
        "No project is ready. Run or synchronize a project in the IDE first.",
    });
    return;
  }
  if (currentProjectDescriptor.stale) {
    send(port, {
      type: "response",
      requestId: command.requestId,
      ok: false,
      error:
        "The IDE project has changed. Run or synchronize it in the IDE first.",
    });
    return;
  }
  const previousRunId = activeRunId;
  activeRunId += 1;
  if (previousRunId > 0) {
    broadcastMessage({
      type: "terminate-runtime",
      runId: previousRunId,
    });
  }
  stopRuntime();
  clearRuntimeState();
  consoleHistory.length = 0;
  simulatorState = simulator.reset();
  runOwnerLease.begin(port, activeRunId, performance.now());
  broadcast(telemetryEvent());
  status("loading", "Loading MicroPython 1.28");
  send(port, {
    type: "response",
    requestId: command.requestId,
    ok: true,
    result: {
      runId: activeRunId,
      scenario: currentScenario,
      project: currentProject,
      descriptor: currentProjectDescriptor,
    },
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
    // The runtime-owned simulator sends the authoritative state immediately
    // after each effort change.
  } else if (message.type === "simulator-state") {
    simulatorState = message.state;
    broadcast(telemetryEvent());
  } else if (message.type === "console") {
    broadcast({
      type: "console",
      stream: message.stream,
      line: message.line,
    });
  } else if (message.type === "runtime-state") {
    runtimeState = message.state;
    runtimeSlots = message.slots;
    broadcast({ type: "runtime", state: runtimeState });
  } else if (message.type === "run-complete") {
    runOwnerLease.clear();
    stopRuntime();
    status("ready", "Program completed; drive command is zero");
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
      invalidateRun("Run owner disconnected; drive command set to zero");
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
    send(port, {
      type: "event",
      event: { type: "runtime", state: runtimeState },
    });
    send(port, { type: "event", event: telemetryEvent() });
    send(port, {
      type: "event",
      event: { type: "project", project: currentProjectDescriptor },
    });
    for (const event of consoleHistory) {
      send(port, { type: "event", event });
    }
  } else if (command.type === "prepare-run") {
    prepareRuntime(port, command);
  } else if (command.type === "store-project") {
    storeProject(command.project, command.descriptor);
    send(port, { type: "response", requestId: command.requestId, ok: true });
  } else if (command.type === "mark-project-stale") {
    if (
      currentProjectDescriptor &&
      currentProjectDescriptor.revision !== command.revision &&
      !currentProjectDescriptor.stale
    ) {
      currentProjectDescriptor = { ...currentProjectDescriptor, stale: true };
      broadcast({ type: "project", project: currentProjectDescriptor });
    }
    send(port, { type: "response", requestId: command.requestId, ok: true });
  } else if (command.type === "set-scenario") {
    if (currentState === "loading" || currentState === "running") {
      send(port, {
        type: "response",
        requestId: command.requestId,
        ok: false,
        error: "Stop the program before changing the virtual environment",
      });
      return;
    }
    if (command.scenario === currentScenario) {
      send(port, {
        type: "response",
        requestId: command.requestId,
        ok: true,
        result: { scenario: currentScenario },
      });
      return;
    }
    currentScenario = command.scenario;
    simulator = new XrpSimulator(simulatorConfigForScenario(currentScenario));
    simulatorState = simulator.state;
    consoleHistory.length = 0;
    broadcast(telemetryEvent());
    status("ready", "Virtual environment changed and XRP reset");
    broadcast({
      type: "console",
      stream: "system",
      line: `Virtual environment: ${currentScenario}`,
    });
    send(port, {
      type: "response",
      requestId: command.requestId,
      ok: true,
      result: { scenario: currentScenario },
    });
  } else if (command.type === "runtime-message") {
    handleRuntimeMessage(port, command.runId, command.message);
  } else if (command.type === "run-owner-heartbeat") {
    runOwnerLease.heartbeat(port, command.runId, performance.now());
  } else if (command.type === "set-runtime-parameter") {
    if (currentState !== "running") {
      send(port, {
        type: "response",
        requestId: command.requestId,
        ok: false,
        error: "Start a program before adjusting its live parameters",
      });
      return;
    }
    const parameter = runtimeState.parameters.find(
      (item) => item.name === command.name,
    );
    const slot = runtimeSlots[command.name];
    const owner = runOwnerLease.ownerFor(activeRunId);
    if (!parameter || slot === undefined || !owner) {
      send(port, {
        type: "response",
        requestId: command.requestId,
        ok: false,
        error: "That live parameter is not available in the running program",
      });
      return;
    }
    try {
      const encoded = encodeRuntimeParameter(parameter, command.value);
      send(owner, {
        type: "apply-runtime-parameter",
        runId: activeRunId,
        slot,
        encoded,
      });
      runtimeState = {
        ...runtimeState,
        revision: runtimeState.revision + 1,
        parameters: runtimeState.parameters.map((item) =>
          item.name === command.name
            ? { ...item, pendingValue: command.value }
            : item,
        ),
      };
      broadcast({ type: "runtime", state: runtimeState });
      send(port, {
        type: "response",
        requestId: command.requestId,
        ok: true,
      });
    } catch (error) {
      send(port, {
        type: "response",
        requestId: command.requestId,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else if (command.type === "stop") {
    const stoppedRunId = activeRunId;
    activeRunId += 1;
    runOwnerLease.clear();
    stopRuntime();
    clearRuntimeState();
    if (stoppedRunId > 0) {
      broadcastMessage({
        type: "terminate-runtime",
        runId: stoppedRunId,
      });
    }
    broadcast({
      type: "console",
      stream: "system",
      line: "Run stopped; drive command set to zero",
    });
    status("ready", "Stopped");
    send(port, { type: "response", requestId: command.requestId, ok: true });
  } else if (command.type === "reset") {
    const stoppedRunId = activeRunId;
    activeRunId += 1;
    runOwnerLease.clear();
    stopRuntime();
    clearRuntimeState();
    if (stoppedRunId > 0) {
      broadcastMessage({
        type: "terminate-runtime",
        runId: stoppedRunId,
      });
    }
    simulatorState = simulator.reset();
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
    invalidateRun("Run owner heartbeat expired; drive command set to zero");
  }
}, 100);

export {};
