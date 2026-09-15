import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { loadMicroPython } from "@micropython/micropython-webassembly-pyscript";

const root = new URL("../", import.meta.url);
const dataModule = (source) =>
  "data:text/javascript;base64," + Buffer.from(source).toString("base64");
const ts = async (path) =>
  stripTypeScriptTypes(await readFile(new URL(path, root), "utf8"), {
    mode: "transform",
  });
const worldModule = dataModule(await ts("packages/simulator/src/world.ts"));
const { XrpSimulator } = await import(
  dataModule(
    (await ts("packages/simulator/src/index.ts")).replaceAll(
      '"./world"',
      JSON.stringify(worldModule),
    ),
  )
);
const { SIMULATED_XRPLIB_FILES } = await import(
  dataModule(await ts("packages/target/src/simulated-python.ts"))
);

const { VirtualMemoryGuard, virtualLinearMemoryBytes } = await import(
  dataModule(await ts("packages/target/src/virtual-memory-guard.ts"))
);

async function measure(kind, iterations = 15000, expectStop = false) {
  const simulator = new XrpSimulator();
  let timeMs = 0;
  let publications = 0;
  let lastTiming;
  let maximumMemory = 0;
  const output = [];
  const runtime = await loadMicroPython({
    heapsize: 2 * 1024 * 1024,
    stdout: (line) => output.push(String(line)),
    stderr: (line) => output.push(String(line)),
  });
  const warnings = [];
  let stoppedAtBytes = null;
  const guard = new VirtualMemoryGuard(
    () => virtualLinearMemoryBytes(runtime),
    (bytes) => warnings.push(bytes),
    (bytes) => {
      stoppedAtBytes = bytes;
      simulator.stop();
    },
  );
  const checkpoint = () => {
    maximumMemory = Math.max(maximumMemory, virtualLinearMemoryBytes(runtime));
    guard.check();
  };
  runtime.registerJsModule("xrp_sim_bridge", {
    set_motor_effort(side, effort) {
      checkpoint();
      simulator.setMotorEffort(side, Number(effort));
    },
    get_encoder_count(side) {
      checkpoint();
      return side === "left"
        ? simulator.state.leftEncoderCount
        : simulator.state.rightEncoderCount;
    },
    reset_encoder() {
      checkpoint();
    },
    get_range_mm() {
      checkpoint();
      return simulator.state.rangeMm;
    },
    get_reflectance(side) {
      checkpoint();
      return side === "left"
        ? simulator.state.leftReflectance
        : simulator.state.rightReflectance;
    },
    is_button_pressed() {
      checkpoint();
      return false;
    },
    get_acceleration_mg() {
      checkpoint();
      return simulator.state.accelerationMg;
    },
    get_angular_rate_mdps() {
      checkpoint();
      return simulator.state.angularRateMdps;
    },
    get_temperature_c() {
      checkpoint();
      return simulator.state.temperatureC;
    },
    get_battery_v() {
      checkpoint();
      return simulator.state.batteryV;
    },
    program_time_ms() {
      checkpoint();
      return timeMs;
    },
    sleep_ms(duration) {
      checkpoint();
      for (let elapsed = 0; elapsed < Number(duration); elapsed += 20)
        simulator.step();
      timeMs += Number(duration);
    },
    publish_sensor_sample(encoded) {
      checkpoint();
      lastTiming = JSON.parse(String(encoded)).timing;
      publications += 1;
    },
    publish_course_state(...args) {
      checkpoint();
      lastTiming = JSON.parse(String(args[12])).timing;
      publications += 1;
    },
    publish_runtime_state() {
      checkpoint();
    },
  });
  const directories = new Set(["/"]);
  const put = (path, data) => {
    let dir = "";
    for (const part of path.split("/").slice(0, -1)) {
      if (!part) continue;
      dir += "/" + part;
      if (!directories.has(dir)) {
        runtime.FS.mkdir(dir);
        directories.add(dir);
      }
    }
    runtime.FS.writeFile(path.startsWith("/") ? path : "/" + path, data);
  };
  for (const [path, data] of Object.entries(SIMULATED_XRPLIB_FILES))
    put(path, data);
  for (const name of await readdir(new URL("vendor/current/ucsb_xrp/", root)))
    if (name.endsWith(".py"))
      put(
        "ucsb_xrp/" + name,
        await readFile(
          new URL("vendor/current/ucsb_xrp/" + name, root),
          "utf8",
        ),
      );
  for (const name of await readdir(
    new URL("vendor/current/reference_mpy/ucsb_xrp_reference/", root),
  ))
    if (name.endsWith(".mpy"))
      put(
        "ucsb_xrp_reference/" + name,
        await readFile(
          new URL(
            "vendor/current/reference_mpy/ucsb_xrp_reference/" + name,
            root,
          ),
        ),
      );
  const started = performance.now();
  try {
    runtime.runPython(`
import time, gc, json, xrp_sim_bridge as bridge
time.ticks_ms = lambda: int(bridge.program_time_ms())
time.sleep_ms = bridge.sleep_ms
from ucsb_xrp import Robot, RobotConfig, XRPBot, Pose, MotionCommand
from ucsb_xrp.robot import _set_managed_start
from ucsb_xrp_reference import SensorModel, WheelSpeedController, DifferentialDrive, Odometry
_set_managed_start(True)
config = RobotConfig()
bot = XRPBot(config)
robot = Robot(config, bot, SensorModel(config), WheelSpeedController(config), DifferentialDrive(config), Odometry(config))
if "${kind}" == "robot": robot.start(Pose(0, 0, 0))
for index in range(${iterations}):
    if "${kind}" == "robot":
        robot.step(MotionCommand(100, 0.1))
    else:
        bot.read()
        time.sleep_ms(20)
robot.stop()
print(json.dumps({"allocatedBeforeReturn":gc.mem_alloc(),"simulatedSeconds":time.ticks_ms()/1000}))
`);
  } catch (error) {
    if (!guard.stopped) {
      console.error(output.join("\n"));
      throw new Error(String(error));
    }
  }
  maximumMemory = Math.max(maximumMemory, virtualLinearMemoryBytes(runtime));
  assert.equal(guard.stopped, expectStop);
  assert.equal(simulator.state.leftEffort, 0);
  assert.equal(simulator.state.rightEffort, 0);
  if (!expectStop) assert.equal(timeMs, iterations * 20);
  else {
    assert.ok(timeMs >= 300000);
    assert.ok(warnings.length <= 1);
    assert.ok(stoppedAtBytes >= 128 * 1024 * 1024);
  }
  assert.ok(lastTiming);
  return {
    kind,
    iterations,
    simulatedSeconds: timeMs / 1000,
    hostElapsedMs: Number((performance.now() - started).toFixed(1)),
    publications,
    maximumLinearMemoryBytes: maximumMemory,
    output,
    warnings,
    stoppedAtBytes,
    lastAcquisition: lastTiming?.[2],
    zeroEffort: true,
    physicalHardware: false,
  };
}

console.log(
  JSON.stringify({
    harness: "scripts/prove-virtual-memory.mjs",
    runtime: "@micropython/micropython-webassembly-pyscript@1.28.0-6",
    accelerated: true,
    results: [
      await measure("raw"),
      await measure("robot"),
      await measure("robot", 40000, true),
      await measure("raw", 100),
    ],
  }),
);
