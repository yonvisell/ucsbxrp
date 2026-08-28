/// <reference lib="webworker" />

import { loadMicroPython } from "@micropython/micropython-webassembly-pyscript";
import micropythonWasmUrl from "@micropython/micropython-webassembly-pyscript/micropython.wasm?url";
import {
  XrpSimulator,
  defaultWorld,
  simulatorConfigForWorld,
} from "@ucsb-xrp/simulator";

import { COURSE_PACKAGE_FILES, COURSE_REFERENCE_FILES } from "./course-python";
import { studentFacingMicroPythonError } from "./micropython-error";
import { prepareProject } from "./project-validation";
import { MAX_RUNTIME_PARAMETERS, parseRuntimeState } from "./runtime-controls";
import { SIMULATED_XRPLIB_FILES } from "./simulated-python";
import type {
  RuntimeWorkerMessage,
  RuntimeWorkerRequest,
} from "./worker-protocol";

declare const self: DedicatedWorkerGlobalScope;

function post(message: RuntimeWorkerMessage): void {
  self.postMessage(message);
}

function createDirectories(
  fs: { mkdir(path: string): void },
  filePath: string,
  created: Set<string>,
): void {
  const parts = filePath.split("/").slice(0, -1);
  let current = "";
  for (const part of parts) {
    current += `/${part}`;
    if (!created.has(current)) {
      fs.mkdir(current);
      created.add(current);
    }
  }
}

function errorDetail(error: unknown): string {
  if (error instanceof Error) {
    return studentFacingMicroPythonError(error.message);
  }
  return studentFacingMicroPythonError(String(error));
}

function telemetryNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

self.onmessage = async (event: MessageEvent<RuntimeWorkerRequest>) => {
  const world = event.data.world ?? defaultWorld(event.data.scenario);
  const simulator = new XrpSimulator(simulatorConfigForWorld(world));
  simulator.reset(world.initialPose);
  let leftEncoderOrigin = 0;
  let rightEncoderOrigin = 0;
  let lastSimulationTime = performance.now();
  let pendingSimulationMs = 0;
  let explicitSimulationClock = false;
  const liveValuesAreShared = event.data.liveParameterBuffer !== undefined;
  const liveValues = event.data.liveParameterBuffer
    ? new Int32Array(event.data.liveParameterBuffer)
    : new Int32Array(MAX_RUNTIME_PARAMETERS);
  const storeLiveValue = (slot: number, value: number) => {
    if (liveValuesAreShared) {
      Atomics.store(liveValues, slot, value);
    } else {
      liveValues[slot] = value;
    }
  };
  const readLiveValue = (slot: number) =>
    liveValuesAreShared ? Atomics.load(liveValues, slot) : liveValues[slot]!;
  const liveSlots = new Map<string, number>();
  let programStarted = false;
  const postSimulatorState = () =>
    post({ type: "simulator-state", state: simulator.state });
  const advanceSimulator = (requestedElapsedMs?: number) => {
    const now = performance.now();
    const elapsedMs =
      requestedElapsedMs === undefined
        ? explicitSimulationClock
          ? 0
          : Math.max(0, Math.min(now - lastSimulationTime, 5000))
        : Math.max(0, Math.min(Number(requestedElapsedMs), 5000));
    if (requestedElapsedMs !== undefined) {
      explicitSimulationClock = true;
    }
    lastSimulationTime = now;
    pendingSimulationMs += elapsedMs;
    const steps = Math.floor(
      pendingSimulationMs / simulator.config.fixedStepMs,
    );
    for (let index = 0; index < steps; index += 1) {
      simulator.step();
    }
    if (steps > 0) {
      pendingSimulationMs -= steps * simulator.config.fixedStepMs;
      postSimulatorState();
    }
    return simulator.state;
  };
  try {
    let runtimeVersion = "unknown";
    const runtime = await loadMicroPython({
      heapsize: 2 * 1024 * 1024,
      url: micropythonWasmUrl,
      stdout: (line) => post({ type: "console", stream: "stdout", line }),
      stderr: (line) => post({ type: "console", stream: "stderr", line }),
    });
    runtime.registerJsModule("xrp_sim_bridge", {
      set_motor_effort(side: "left" | "right", effort: number) {
        advanceSimulator();
        post({ type: "effort", side, effort });
        simulator.setMotorEffort(side, effort);
        postSimulatorState();
      },
      get_encoder_count(side: "left" | "right") {
        const state = advanceSimulator();
        return side === "left"
          ? state.leftEncoderCount - leftEncoderOrigin
          : state.rightEncoderCount - rightEncoderOrigin;
      },
      reset_encoder(side: "left" | "right") {
        const state = advanceSimulator();
        if (side === "left") {
          leftEncoderOrigin = state.leftEncoderCount;
        } else {
          rightEncoderOrigin = state.rightEncoderCount;
        }
      },
      get_range_mm() {
        return advanceSimulator().rangeMm;
      },
      is_button_pressed() {
        return advanceSimulator().buttonPressed;
      },
      get_acceleration_mg() {
        return advanceSimulator().accelerationMg;
      },
      get_angular_rate_mdps() {
        return advanceSimulator().angularRateMdps;
      },
      get_temperature_c() {
        return advanceSimulator().temperatureC;
      },
      get_battery_v() {
        return advanceSimulator().batteryV;
      },
      advance_simulator(elapsedMs?: number) {
        advanceSimulator(elapsedMs);
      },
      set_runtime_version(version: string) {
        runtimeVersion = String(version);
      },
      register_live_parameter(descriptorJson: string, encodedDefault: number) {
        const descriptor = JSON.parse(String(descriptorJson)) as {
          name?: unknown;
        };
        if (typeof descriptor.name !== "string") {
          throw new Error("Live parameter descriptor has no name");
        }
        const existing = liveSlots.get(descriptor.name);
        if (existing !== undefined) {
          return existing;
        }
        const slot = liveSlots.size;
        if (slot >= MAX_RUNTIME_PARAMETERS) {
          throw new Error("Too many live parameters");
        }
        liveSlots.set(descriptor.name, slot);
        storeLiveValue(slot, Number(encodedDefault));
        return slot;
      },
      read_live_parameter(slot: number) {
        if (slot < 0 || slot >= liveSlots.size) {
          throw new Error("Live parameter slot is unavailable");
        }
        return readLiveValue(Number(slot));
      },
      publish_runtime_state(runtimeJson: string) {
        post({
          type: "runtime-state",
          state: parseRuntimeState(String(runtimeJson)),
          slots: Object.fromEntries(liveSlots),
        });
      },
      publish_course_state(
        estimatedXmm: unknown,
        estimatedYmm: unknown,
        estimatedHeadingRad: unknown,
        measuredLeftWheelSpeedMmS: unknown,
        measuredRightWheelSpeedMmS: unknown,
        measuredLeftWheelDistanceMm: unknown,
        measuredRightWheelDistanceMm: unknown,
        requestedForwardSpeedMmS: unknown,
        requestedTurnRateRadS: unknown,
        targetLeftWheelSpeedMmS: unknown,
        targetRightWheelSpeedMmS: unknown,
      ) {
        const estimatedX = telemetryNumber(estimatedXmm);
        const estimatedY = telemetryNumber(estimatedYmm);
        const estimatedHeading = telemetryNumber(estimatedHeadingRad);
        const measuredLeft = telemetryNumber(measuredLeftWheelSpeedMmS);
        const measuredRight = telemetryNumber(measuredRightWheelSpeedMmS);
        const measuredLeftDistance = telemetryNumber(
          measuredLeftWheelDistanceMm,
        );
        const measuredRightDistance = telemetryNumber(
          measuredRightWheelDistanceMm,
        );
        if (
          estimatedX === null ||
          estimatedY === null ||
          estimatedHeading === null ||
          measuredLeft === null ||
          measuredRight === null ||
          measuredLeftDistance === null ||
          measuredRightDistance === null
        ) {
          return;
        }
        post({
          type: "course-state",
          state: {
            estimatedXmm: estimatedX,
            estimatedYmm: estimatedY,
            estimatedHeadingRad: estimatedHeading,
            measuredLeftWheelSpeedMmS: measuredLeft,
            measuredRightWheelSpeedMmS: measuredRight,
            measuredLeftWheelDistanceMm: measuredLeftDistance,
            measuredRightWheelDistanceMm: measuredRightDistance,
            requestedForwardSpeedMmS: telemetryNumber(requestedForwardSpeedMmS),
            requestedTurnRateRadS: telemetryNumber(requestedTurnRateRadS),
            targetLeftWheelSpeedMmS: telemetryNumber(targetLeftWheelSpeedMmS),
            targetRightWheelSpeedMmS: telemetryNumber(targetRightWheelSpeedMmS),
          },
        });
      },
    });

    const createdDirectories = new Set<string>(["/"]);
    const runtimeFiles = {
      ...SIMULATED_XRPLIB_FILES,
      ...COURSE_PACKAGE_FILES,
    };
    for (const [unsafePath, content] of Object.entries(runtimeFiles)) {
      const path = unsafePath;
      createDirectories(runtime.FS, path, createdDirectories);
      runtime.FS.writeFile(`/${path}`, content);
    }
    for (const [unsafePath, url] of Object.entries(COURSE_REFERENCE_FILES)) {
      const path = unsafePath.replace(/^reference_mpy\//, "");
      createDirectories(runtime.FS, path, createdDirectories);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Reference artifact could not be loaded: ${path}`);
      }
      runtime.FS.writeFile(
        `/${path}`,
        new Uint8Array(await response.arrayBuffer()),
      );
    }

    runtime.runPython(`
import xrp_sim_bridge
xrp_sim_bridge.set_runtime_version(
    ".".join(
        str(part)
        for part in __import__("sys").implementation.version[:3]
    )
)
`);
    post({ type: "runtime-ready", version: runtimeVersion });

    const project = prepareProject(event.data.project);
    const projectPaths = project.pythonPaths.map((path) => `/project/${path}`);
    runtime.FS.mkdir("/project");
    createdDirectories.add("/project");
    for (const [path, content] of project.files) {
      createDirectories(runtime.FS, `project/${path}`, createdDirectories);
      runtime.FS.writeFile(`/project/${path}`, content);
    }

    runtime.globals.set("__ucsb_check_paths", projectPaths);
    runtime.runPython(`
for __ucsb_path in __ucsb_check_paths:
    compile(open(__ucsb_path).read(), __ucsb_path, "exec")
`);
    runtime.globals.delete("__ucsb_check_paths");

    if (event.data.mode === "check") {
      post({
        type: "check-complete",
        detail: `${projectPaths.length} Python file${projectPaths.length === 1 ? "" : "s"} compiled with MicroPython ${runtimeVersion}`,
      });
      return;
    }

    if (event.data.mode === "test") {
      const entrypoint = project.entrypoint;
      runtime.runPython(`
import sys
import os
sys.path.insert(0, "/project")
sys.path.insert(1, "/")
os.chdir("/project")
__ucsb_entrypoint = "/project/${entrypoint}"
exec(
    compile(
        open(__ucsb_entrypoint).read(),
        __ucsb_entrypoint,
        "exec",
    ),
    {"__name__": "__main__", "__file__": __ucsb_entrypoint},
)
`);
      post({
        type: "test-complete",
        detail: `Component checks completed with MicroPython ${runtimeVersion}`,
      });
      return;
    }

    post({
      type: "compile-complete",
      detail: `${projectPaths.length} Python file${projectPaths.length === 1 ? "" : "s"} compiled with MicroPython ${runtimeVersion}`,
    });

    postSimulatorState();
    // Program time begins here. Loading MicroPython and copying project files
    // must not move the virtual robot before the student's code starts.
    lastSimulationTime = performance.now();
    pendingSimulationMs = 0;
    explicitSimulationClock = false;
    const entrypoint = project.entrypoint;
    programStarted = true;
    runtime.runPython(`
import sys
import os
import time
import xrp_sim_bridge

__ucsb_original_sleep_ms = time.sleep_ms
__ucsb_original_sleep = time.sleep
def __ucsb_simulated_sleep_ms(duration_ms):
    __ucsb_original_sleep_ms(duration_ms)
    xrp_sim_bridge.advance_simulator(duration_ms)
def __ucsb_simulated_sleep(duration_s):
    __ucsb_original_sleep(duration_s)
    xrp_sim_bridge.advance_simulator(duration_s * 1000.0)
time.sleep_ms = __ucsb_simulated_sleep_ms
time.sleep = __ucsb_simulated_sleep

sys.path.insert(0, "/project")
sys.path.insert(1, "/")
os.chdir("/project")
from ucsb_xrp.robot import _set_managed_start
_set_managed_start(True)
__ucsb_entrypoint = "/project/${entrypoint}"
exec(
    compile(
        open(__ucsb_entrypoint).read(),
        __ucsb_entrypoint,
        "exec",
    ),
    {"__name__": "__main__", "__file__": __ucsb_entrypoint},
)
`);
    advanceSimulator();
    simulator.stop();
    postSimulatorState();
    post({ type: "run-complete" });
  } catch (error) {
    simulator.stop();
    postSimulatorState();
    post({
      type: "error",
      detail: errorDetail(error),
      stage: programStarted ? "run" : "compile",
    });
  }
};

export {};
