/// <reference lib="webworker" />

import {
  DEFAULT_WORLD_CATALOG,
  XrpSimulator,
  simulatorConfigForWorld,
  worldById,
  type SimulationScenario,
  type WorldCatalog,
  type WorldDefinition,
  type XrpSimulatorState,
} from "@ucsb-xrp/simulator";

import { RunOwnerLease } from "./run-owner-lease";
import { ProjectRunProviderBroker } from "./project-run-provider";
import { VirtualTargetEventHub } from "./virtual-target-event-hub";
import { worldCatalogForProject } from "./project-world";
import {
  EMPTY_RUNTIME_STATE,
  encodeRuntimeParameter,
} from "./runtime-controls";
import type {
  CourseTelemetryState,
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
import { virtualTelemetrySample } from "./virtual-telemetry";

declare const self: SharedWorkerGlobalScope;

let currentCatalog: WorldCatalog = DEFAULT_WORLD_CATALOG;
let currentScenario: SimulationScenario = currentCatalog.defaultWorldId;
let currentWorld: WorldDefinition = worldById(currentCatalog, currentScenario);
let simulator = new XrpSimulator(simulatorConfigForWorld(currentWorld));
let simulatorState: XrpSimulatorState = simulator.reset(
  currentWorld.initialPose,
);
const events = new VirtualTargetEventHub();
const runOwnerLease = new RunOwnerLease<MessagePort>(1_600);
const projectRunProvider = new ProjectRunProviderBroker<MessagePort>(
  (port, request) => send(port, request),
  () => publishProjectProviderState(),
);
let activeRunId = 0;
let currentState: TargetRunState = "ready";
let currentDetail = "Virtual target ready";
let currentProject: CourseProject | null = null;
let currentProjectDescriptor: SynchronizedProject | null = null;
let runtimeState: RuntimeState = EMPTY_RUNTIME_STATE;
let runtimeSlots: Record<string, number> = {};
let courseTelemetryState: CourseTelemetryState | null = null;

function send(port: MessagePort, message: TargetWorkerMessage): void {
  events.send(port, message);
}

function broadcast(event: TargetEvent): void {
  events.broadcast(event);
}

function broadcastMessage(message: TargetWorkerMessage): void {
  events.broadcastMessage(message);
}

function status(state: TargetRunState, detail: string): void {
  currentState = state;
  currentDetail = detail;
  broadcast({ type: "status", state, detail });
}

function sendProjectProviderState(port: MessagePort): void {
  send(port, {
    type: "event",
    event: {
      type: "project-provider",
      active: projectRunProvider.providerIs(port),
      available: projectRunProvider.hasProvider(),
    },
  });
}

function publishProjectProviderState(): void {
  events.forEachPort((port) => sendProjectProviderState(port as MessagePort));
}

function clearRuntimeState(): void {
  runtimeState = EMPTY_RUNTIME_STATE;
  runtimeSlots = {};
  courseTelemetryState = null;
  broadcast({ type: "runtime", state: runtimeState });
}

function telemetryEvent(): TargetEvent {
  return {
    type: "telemetry",
    sample: virtualTelemetrySample(
      simulatorState,
      courseTelemetryState,
      runtimeState.plots,
    ),
  };
}

function stopRuntime(): void {
  if (courseTelemetryState) {
    courseTelemetryState = {
      ...courseTelemetryState,
      measuredLeftWheelSpeedMmS: 0,
      measuredRightWheelSpeedMmS: 0,
      requestedForwardSpeedMmS: null,
      requestedTurnRateRadS: null,
      targetLeftWheelSpeedMmS: null,
      targetRightWheelSpeedMmS: null,
    };
  }
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
  const nextCatalog = worldCatalogForProject(project);
  const worldFileUnchanged =
    currentProject?.files["world.json"] === project.files["world.json"];
  const selectedWorldStillExists = nextCatalog.worlds.some(
    (world) => world.id === currentScenario,
  );
  currentCatalog = nextCatalog;
  currentScenario =
    worldFileUnchanged && selectedWorldStillExists
      ? currentScenario
      : currentCatalog.defaultWorldId;
  currentWorld = worldById(currentCatalog, currentScenario);
  simulator = new XrpSimulator(simulatorConfigForWorld(currentWorld));
  simulatorState = simulator.reset(currentWorld.initialPose);
  currentProject = project;
  currentProjectDescriptor = { ...descriptor, stale: false };
  broadcast({ type: "project", project: currentProjectDescriptor });
  broadcast({
    type: "world",
    catalog: currentCatalog,
    selectedWorldId: currentScenario,
  });
  broadcast(telemetryEvent());
}

function stageProject(
  project: CourseProject,
  descriptor: SynchronizedProject,
): void {
  const worldFileChanged =
    currentProject?.files["world.json"] !== project.files["world.json"];
  currentProject = project;
  currentProjectDescriptor = { ...descriptor, stale: true };
  broadcast({ type: "project", project: currentProjectDescriptor });
  if (!worldFileChanged) return;

  currentCatalog = worldCatalogForProject(project);
  if (!currentCatalog.worlds.some((world) => world.id === currentScenario)) {
    currentScenario = currentCatalog.defaultWorldId;
  }
  currentWorld = worldById(currentCatalog, currentScenario);
  simulator = new XrpSimulator(simulatorConfigForWorld(currentWorld));
  simulatorState = simulator.reset(currentWorld.initialPose);
  broadcast({
    type: "world",
    catalog: currentCatalog,
    selectedWorldId: currentScenario,
  });
  broadcast(telemetryEvent());
}

function markProjectChanged(project: {
  projectId: string;
  revision: number;
  name: string;
  entrypoint: string;
}): void {
  const nextDescriptor: SynchronizedProject = {
    name: project.name,
    entrypoint: project.entrypoint,
    revision:
      currentProjectDescriptor?.revision ??
      `ide:${project.projectId}:${project.revision}`,
    stale: true,
  };
  if (
    currentProjectDescriptor?.stale &&
    currentProjectDescriptor.name === nextDescriptor.name &&
    currentProjectDescriptor.entrypoint === nextDescriptor.entrypoint
  ) {
    return;
  }
  currentProjectDescriptor = nextDescriptor;
  broadcast({ type: "project", project: nextDescriptor });
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
      error: "No project is ready. Run or flash a project in the IDE first.",
    });
    return;
  }
  if (currentProjectDescriptor.stale) {
    send(port, {
      type: "response",
      requestId: command.requestId,
      ok: false,
      error: "The IDE project has changed. Run or flash it in the IDE first.",
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
  simulatorState = simulator.reset(currentWorld.initialPose);
  runOwnerLease.begin(port, activeRunId, performance.now());
  broadcast(telemetryEvent());
  broadcast({
    type: "console",
    stream: "system",
    line: `Starting ${currentProjectDescriptor.name} (${currentProjectDescriptor.entrypoint}) on the virtual XRP`,
    action: "run",
    phase: "request",
    requestId: `virtual-run-${activeRunId}`,
  });
  status("loading", "Loading MicroPython 1.28");
  send(port, {
    type: "response",
    requestId: command.requestId,
    ok: true,
    result: {
      runId: activeRunId,
      scenario: currentScenario,
      world: currentWorld,
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
    broadcast({
      type: "console",
      stream: "system",
      line: `MicroPython ${message.version} ready; program running`,
      action: "run",
      phase: "output",
      requestId: `virtual-run-${runId}`,
    });
  } else if (message.type === "effort") {
    // The runtime-owned simulator sends the authoritative state immediately
    // after each effort change.
  } else if (message.type === "simulator-state") {
    simulatorState = message.state;
    broadcast(telemetryEvent());
  } else if (message.type === "course-state") {
    courseTelemetryState = message.state;
  } else if (message.type === "console") {
    broadcast({
      type: "console",
      stream: message.stream,
      line: message.line,
      action: "run",
      phase: "output",
      requestId: `virtual-run-${runId}`,
    });
  } else if (message.type === "runtime-state") {
    runtimeState = message.state;
    runtimeSlots = message.slots;
    broadcast({ type: "runtime", state: runtimeState });
  } else if (message.type === "run-complete") {
    runOwnerLease.clear();
    stopRuntime();
    broadcast({
      type: "console",
      stream: "system",
      line: "Program completed; drive command is zero",
      action: "run",
      phase: "result",
      requestId: `virtual-run-${runId}`,
    });
    status("ready", "Program completed; drive command is zero");
    broadcastMessage({ type: "terminate-runtime", runId });
  } else if (message.type === "error") {
    runOwnerLease.clear();
    stopRuntime();
    broadcast({
      type: "console",
      stream: "stderr",
      line: message.detail,
      action: "run",
      phase: "error",
      requestId: `virtual-run-${runId}`,
    });
    broadcast({
      type: "console",
      stream: "system",
      line: "Program stopped after a MicroPython exception",
      action: "run",
      phase: "error",
      requestId: `virtual-run-${runId}`,
    });
    status("error", "Program stopped after a MicroPython exception");
    broadcastMessage({ type: "terminate-runtime", runId });
  }
}

function handleCommand(port: MessagePort, command: TargetWorkerCommand): void {
  if (command.type === "disconnect") {
    const providerChanged = projectRunProvider.unregister(port);
    if (runOwnerLease.ownsPort(port)) {
      invalidateRun("Run owner disconnected; drive command set to zero");
    }
    events.detach(port);
    if (providerChanged) publishProjectProviderState();
    if (events.size === 0) {
      stopRuntime();
      currentState = "ready";
      currentDetail = "Virtual target ready";
    }
    return;
  }

  if (command.type === "connect") {
    if (command.providesProject) projectRunProvider.register(port);
    publishProjectProviderState();
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
    send(port, {
      type: "event",
      event: { type: "project", project: currentProjectDescriptor },
    });
    send(port, {
      type: "event",
      event: {
        type: "world",
        catalog: currentCatalog,
        selectedWorldId: currentScenario,
      },
    });
    if (events.replayTelemetry(port) === 0) {
      send(port, { type: "event", event: telemetryEvent() });
    }
    events.replayConsole(port);
  } else if (command.type === "set-project-run-provider") {
    if (command.providesProject) {
      projectRunProvider.register(port, command.takeover === true);
    } else {
      projectRunProvider.unregister(port);
    }
    publishProjectProviderState();
  } else if (command.type === "project-run-snapshot") {
    projectRunProvider.accept(port, command);
  } else if (command.type === "mark-project-changed") {
    if (projectRunProvider.providerIs(port)) {
      markProjectChanged(command.project);
    }
  } else if (command.type === "publish-console") {
    broadcast(command.event);
  } else if (command.type === "prepare-run") {
    prepareRuntime(port, command);
  } else if (command.type === "store-project") {
    storeProject(command.project, command.descriptor);
    send(port, { type: "response", requestId: command.requestId, ok: true });
  } else if (command.type === "mark-project-stale") {
    stageProject(command.project, command.descriptor);
    send(port, { type: "response", requestId: command.requestId, ok: true });
  } else if (command.type === "get-project") {
    void projectRunProvider
      .request()
      .then((snapshot) => {
        send(port, {
          type: "response",
          requestId: command.requestId,
          ok: true,
          result: {
            project: snapshot.project,
            descriptor: currentProjectDescriptor ?? undefined,
          },
        });
      })
      .catch((error) => {
        send(port, {
          type: "response",
          requestId: command.requestId,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      });
  } else if (command.type === "set-scenario") {
    if (command.scenario === currentScenario) {
      send(port, {
        type: "response",
        requestId: command.requestId,
        ok: true,
        result: { scenario: currentScenario },
      });
      return;
    }
    if (currentState === "loading" || currentState === "running") {
      send(port, {
        type: "response",
        requestId: command.requestId,
        ok: false,
        error: "Stop the program before changing the virtual environment",
      });
      return;
    }
    try {
      currentWorld = worldById(currentCatalog, command.scenario);
    } catch (error) {
      send(port, {
        type: "response",
        requestId: command.requestId,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }
    currentScenario = command.scenario;
    simulator = new XrpSimulator(simulatorConfigForWorld(currentWorld));
    simulatorState = simulator.reset(currentWorld.initialPose);
    broadcast({
      type: "world",
      catalog: currentCatalog,
      selectedWorldId: currentScenario,
    });
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
      action: "stop",
      phase: "result",
      requestId: command.requestId,
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
    simulatorState = simulator.reset(currentWorld.initialPose);
    broadcast(telemetryEvent());
    broadcast({
      type: "console",
      stream: "system",
      line: "Virtual XRP reset",
      action: "reset",
      phase: "result",
      requestId: command.requestId,
    });
    status("ready", "Virtual XRP reset");
    send(port, { type: "response", requestId: command.requestId, ok: true });
  }
}

self.onconnect = (event: MessageEvent) => {
  const port = event.ports[0];
  if (!port) {
    return;
  }
  events.attach(port);
  sendProjectProviderState(port);
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
