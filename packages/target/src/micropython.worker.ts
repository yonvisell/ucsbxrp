/// <reference lib="webworker" />

import { loadMicroPython } from "@micropython/micropython-webassembly-pyscript";
import micropythonWasmUrl from "@micropython/micropython-webassembly-pyscript/micropython.wasm?url";
import {
  XrpSimulator,
  defaultWorld,
  simulatorConfigForWorld,
} from "@ucsb-xrp/simulator";

import { COURSE_PACKAGE_FILES, COURSE_REFERENCE_FILES } from "./course-python";
import {
  parseMicroPythonDiagnostics,
  studentFacingMicroPythonError,
} from "./micropython-error";
import { prepareProject } from "./project-validation";
import { MAX_RUNTIME_PARAMETERS, parseRuntimeState } from "./runtime-controls";
import { SIMULATED_XRPLIB_FILES } from "./simulated-python";
import { SimulationClock } from "./simulation-clock";
import { RuntimeOutput } from "./runtime-output";
import { decodeVirtualAcquisition } from "./telemetry-timing";
import {
  VirtualMemoryGuard,
  virtualLinearMemoryBytes,
  virtualMemoryStopDetail,
} from "./virtual-memory-guard";
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

function rawErrorDetail(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function microPythonErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("type" in error)) {
    return undefined;
  }
  const type = error.type;
  return typeof type === "string" && type.trim().length > 0
    ? type.trim()
    : undefined;
}

function telemetryNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

self.onmessage = async (event: MessageEvent<RuntimeWorkerRequest>) => {
  const output = new RuntimeOutput((lines, omitted) =>
    post({ type: "console-batch", lines, omitted }),
  );
  const world = event.data.world ?? defaultWorld(event.data.scenario);
  const simulator = new XrpSimulator(simulatorConfigForWorld(world));
  simulator.reset(world.initialPose);
  let leftEncoderOrigin = 0;
  let rightEncoderOrigin = 0;
  const clock = new SimulationClock(simulator.config.fixedStepMs);
  const timingClockId = `virtual:${crypto.randomUUID()}`;
  const cancellation = event.data.cancellationBuffer
    ? new Int32Array(event.data.cancellationBuffer)
    : null;
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
  let memoryGuard: VirtualMemoryGuard | undefined;
  const checkMemory = () => {
    if (programStarted) memoryGuard?.check();
  };
  let coursePublicationSeq = 0;
  let diagnosticProjectPaths: string[] = [];
  const postSimulatorState = (
    observationKind: "initial" | "physics" | "actuator" | "stop" = "physics",
  ) =>
    post({ type: "simulator-state", state: simulator.state, observationKind });
  const advanceSimulator = () => {
    checkMemory();
    output.flush();
    const steps = clock.advance(
      () => simulator.step(),
      () => !cancellation || Atomics.load(cancellation, 0) === 0,
    );
    if (steps > 0) {
      postSimulatorState();
    }
    return simulator.state;
  };
  try {
    let runtimeVersion = "unknown";
    const runtime = await loadMicroPython({
      heapsize: 2 * 1024 * 1024,
      url: micropythonWasmUrl,
      stdout: (line) => {
        checkMemory();
        return event.data.mode === "run"
          ? output.write("stdout", line)
          : post({ type: "console", stream: "stdout", line });
      },
      stderr: (line) => {
        checkMemory();
        return event.data.mode === "run"
          ? output.write("stderr", line)
          : post({ type: "console", stream: "stderr", line });
      },
    });
    virtualLinearMemoryBytes(runtime);
    memoryGuard = new VirtualMemoryGuard(
      () => virtualLinearMemoryBytes(runtime),
      (bytes) =>
        post({
          type: "console",
          stream: "stderr",
          line: `Virtual run memory is ${Math.ceil(bytes / 1024 / 1024)} MiB and rising. Finish this run and save your results; a new run starts with fresh runtime memory.`,
        }),
      (bytes) => {
        simulator.stop();
        postSimulatorState("stop");
        output.flush();
        post({
          type: "error",
          detail: virtualMemoryStopDetail(bytes),
          stage: "run",
          reason: "memory-limit",
        });
      },
    );
    runtime.registerJsModule("xrp_sim_bridge", {
      set_motor_effort(side: "left" | "right", effort: number) {
        advanceSimulator();
        post({ type: "effort", side, effort });
        simulator.setMotorEffort(side, effort);
        postSimulatorState("actuator");
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
      get_reflectance(side: "left" | "right") {
        const state = advanceSimulator();
        return side === "left" ? state.leftReflectance : state.rightReflectance;
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
      advance_simulator() {
        advanceSimulator();
      },
      program_time_ms() {
        checkMemory();
        return clock.elapsedMs();
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
        plotValuesJson?: unknown,
        timingJson?: unknown,
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
            publicationSeq: coursePublicationSeq++,
            publishedAtMs: clock.elapsedMs(),
            timing:
              timingJson === undefined
                ? undefined
                : decodeVirtualAcquisition(timingJson, timingClockId),
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
            plotValues:
              plotValuesJson === undefined
                ? []
                : parseRuntimeState(
                    `{"revision":0,"parameters":[],"watches":[],"plots":${String(plotValuesJson)}}`,
                  ).plots,
          },
        });
      },
      publish_sensor_sample(timingJson: unknown) {
        const timing = decodeVirtualAcquisition(timingJson, timingClockId);
        if (timing) post({ type: "sensor-acquisition", timing });
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
    diagnosticProjectPaths = project.pythonPaths;
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
        diagnostics: [],
      });
      return;
    }

    if (event.data.mode === "test") {
      const entrypoint = project.entrypoint;
      programStarted = true;
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
      diagnostics: [],
    });

    postSimulatorState("initial");
    // Program time begins here. Loading MicroPython and copying project files
    // must not move the virtual robot before the student's code starts.
    clock.reset();
    const entrypoint = project.entrypoint;
    programStarted = true;
    runtime.runPython(`
import sys
import os
import time
import xrp_sim_bridge

__ucsb_original_sleep_ms = time.sleep_ms
__ucsb_tick_period = time.ticks_add(0, -1) + 1
def __ucsb_simulated_sleep_ms(duration_ms):
    if duration_ms < 0:
        return __ucsb_original_sleep_ms(duration_ms)
    __ucsb_deadline = xrp_sim_bridge.program_time_ms() + duration_ms
    while True:
        __ucsb_remaining = __ucsb_deadline - xrp_sim_bridge.program_time_ms()
        if __ucsb_remaining <= 0:
            break
        __ucsb_original_sleep_ms(max(1, min(20, int(__ucsb_remaining))))
        xrp_sim_bridge.advance_simulator()
    xrp_sim_bridge.advance_simulator()
def __ucsb_simulated_sleep(duration_s):
    __ucsb_simulated_sleep_ms(duration_s * 1000.0)
time.sleep_ms = __ucsb_simulated_sleep_ms
time.sleep = __ucsb_simulated_sleep
time.ticks_ms = lambda: int(xrp_sim_bridge.program_time_ms()) % __ucsb_tick_period
time.ticks_us = lambda: int(xrp_sim_bridge.program_time_ms() * 1000) % __ucsb_tick_period

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
    postSimulatorState("stop");
    output.flush();
    post({ type: "run-complete" });
  } catch (error) {
    output.flush();
    simulator.stop();
    postSimulatorState("stop");
    if (memoryGuard?.stopped) return;
    const rawDetail = rawErrorDetail(error);
    const detail = errorDetail(error);
    const phase = programStarted ? "runtime" : "compile";
    post({
      type: "error",
      detail,
      rawDetail,
      stage: programStarted ? "run" : "compile",
      diagnostics: parseMicroPythonDiagnostics(detail, {
        phase,
        code: microPythonErrorCode(error),
        projectPaths: diagnosticProjectPaths,
      }),
    });
  }
};

export {};
