import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { loadMicroPython } from "@micropython/micropython-webassembly-pyscript";

const repositoryRoot = new URL("../", import.meta.url);
const packageDirectory = new URL("vendor/current/ucsb_xrp/", repositoryRoot);
const referenceDirectory = new URL(
  "vendor/current/reference_mpy/ucsb_xrp_reference/",
  repositoryRoot,
);
const output = [];
const efforts = { left: 0, right: 0 };

const micropython = await loadMicroPython({
  heapsize: 2 * 1024 * 1024,
  stdout: (line) => output.push(line),
  stderr: (line) => output.push(line),
});

micropython.registerJsModule("xrp_sim_bridge", {
  set_motor_effort(side, effort) {
    efforts[side] = Number(effort);
  },
});

function ensureDirectory(path) {
  try {
    micropython.FS.mkdir(path);
  } catch (error) {
    if (!String(error).includes("File exists")) {
      throw error;
    }
  }
}

ensureDirectory("/ucsb_xrp");
for (const name of (await readdir(packageDirectory)).sort()) {
  if (!name.endsWith(".py")) {
    continue;
  }
  const source = await readFile(join(packageDirectory.pathname, name), "utf8");
  micropython.FS.writeFile(`/ucsb_xrp/${name}`, source);
}

ensureDirectory("/ucsb_xrp_reference");
for (const name of (await readdir(referenceDirectory)).sort()) {
  if (!name.endsWith(".mpy")) {
    continue;
  }
  const bytecode = await readFile(join(referenceDirectory.pathname, name));
  micropython.FS.writeFile(`/ucsb_xrp_reference/${name}`, bytecode);
}

ensureDirectory("/XRPLib");
micropython.FS.writeFile(
  "/XRPLib/__init__.py",
  '"""Deterministic XRPLib boundary for the parity check."""\n',
);
micropython.FS.writeFile(
  "/XRPLib/encoded_motor.py",
  `import xrp_sim_bridge


class EncodedMotor:
    _instances = {}

    def __init__(self, side):
        self.side = side
        self.position = 0

    @classmethod
    def get_default_encoded_motor(cls, index=1):
        if index not in cls._instances:
            cls._instances[index] = cls("left" if index == 1 else "right")
        return cls._instances[index]

    def set_effort(self, effort):
        xrp_sim_bridge.set_motor_effort(self.side, effort)

    def get_position_counts(self):
        return self.position

    def reset_encoder_position(self):
        self.position = 0
`,
);
micropython.FS.writeFile(
  "/XRPLib/board.py",
  `class Board:
    _instance = None

    @classmethod
    def get_default_board(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def is_button_pressed(self):
        return False

    def wait_for_button(self):
        return None
`,
);
micropython.FS.writeFile(
  "/XRPLib/rangefinder.py",
  `class Rangefinder:
    _instance = None

    @classmethod
    def get_default_rangefinder(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def distance(self):
        return 24.75
`,
);

micropython.runPython(`
import math
import sys

from ucsb_xrp import (
    ArenaMap,
    GridCell,
    MotorEfforts,
    MotionCommand,
    NavigationConfig,
    NavigationGoal,
    OccupancyGrid,
    Pose,
    RawSensors,
    RobotConfig,
    WheelSpeeds,
    XRPBot,
    wrap_angle_rad,
)
from ucsb_xrp_reference import (
    DifferentialDrive,
    GridPlanner,
    NavigationController,
    Odometry,
    SensorModel,
    WheelSpeedController,
)

assert RobotConfig().max_effort == 1.0

configured = XRPBot(
    RobotConfig(
        left_motor_sign=-1,
        right_motor_sign=1,
        max_effort=0.4,
    )
)
configured.set_efforts(MotorEfforts(0.9, -0.7))
sample = configured.read(include_range=True)
assert abs(sample.range_mm - 247.5) < 0.001
assert abs(Pose(0, 0, math.pi).heading_rad + math.pi) < 0.00001
assert -math.pi <= wrap_angle_rad(14.0) < math.pi

component_config = RobotConfig(
    wheel_diameter_mm=100.0 / math.pi,
    encoder_counts_per_revolution=100.0,
    left_encoder_sign=1,
    right_encoder_sign=-1,
    left_start_effort=0.10,
    right_start_effort=0.12,
    left_speed_effort_gain=0.002,
    right_speed_effort_gain=0.0015,
    wheel_speed_kp=0.001,
    max_effort=0.5,
)
sensor_model = SensorModel(component_config)
sensor_model.reset(RawSensors(1000, 100, 200, None, False))
measurements = sensor_model.update(RawSensors(1250, 110, 185, None, False))
assert abs(measurements.left_position_mm - 10.0) < 0.0001
assert abs(measurements.right_speed_mm_s - 60.0) < 0.0001

wheel_controller = WheelSpeedController(component_config)
component_efforts = wheel_controller.update(
    WheelSpeeds(100.0, -80.0),
    WheelSpeeds(90.0, -60.0),
)
assert abs(component_efforts.left - 0.31) < 0.0001
assert abs(component_efforts.right + 0.26) < 0.0001

drive = DifferentialDrive(RobotConfig(track_width_mm=100.0))
wheel_speeds = drive.wheel_speeds(MotionCommand(200.0, 1.0))
assert wheel_speeds == WheelSpeeds(150.0, 250.0)

odometry = Odometry(RobotConfig(track_width_mm=100.0))
odometry.reset(Pose(0, 0, 0))
assert odometry.update(20, 20) == Pose(20, 0, 0)

arena = ArenaMap((0, 0, 300, 200), obstacles=((100, 0, 200, 100),))
grid = OccupancyGrid.from_arena(arena, 100)
path = GridPlanner().plan(grid, GridCell(0, 0), GridCell(2, 1))
assert path is not None
assert path.cells[0] == GridCell(0, 0)
assert path.cells[-1] == GridCell(2, 1)

navigation = NavigationController(
    NavigationConfig(120, 45, 150, 0.8, 10, 0.08, 0.25)
)
navigation.start((NavigationGoal(200, 0, 0),))
assert navigation.update(Pose(0, 0, 0)).forward_speed_mm_s == 120

print("MicroPython", ".".join(str(part) for part in sys.implementation.version[:3]))
print("MicroPython _mpy", getattr(sys.implementation, "_mpy", None))
print("reference .mpy public contracts passed")
print("canonical ucsb_xrp source parity passed")
`);

if (
  Math.abs(efforts.left + 0.4) > 1e-6 ||
  Math.abs(efforts.right + 0.4) > 1e-6
) {
  throw new Error(
    `Unexpected hardware-boundary efforts: ${JSON.stringify(efforts)}`,
  );
}
if (!output.includes("canonical ucsb_xrp source parity passed")) {
  throw new Error(
    `Expected parity output was not captured: ${output.join("\n")}`,
  );
}
if (!output.includes("reference .mpy public contracts passed")) {
  throw new Error(
    `Expected reference bytecode output was not captured: ${output.join("\n")}`,
  );
}

const wasmMpyLine = output.find((line) => line.startsWith("MicroPython _mpy "));
const wasmMpy = Number.parseInt(wasmMpyLine?.split(" ").at(-1) ?? "", 10);
const recordedPhysicalMpy = 7942;
const portableAbiMask = 0x3ff;
if (
  !Number.isInteger(wasmMpy) ||
  (wasmMpy & portableAbiMask) !== (recordedPhysicalMpy & portableAbiMask)
) {
  throw new Error(
    `Portable .mpy ABI differs: WebAssembly=${wasmMpy}, RP2350=${recordedPhysicalMpy}`,
  );
}

process.stdout.write(`${output.join("\n")}\n`);
process.stdout.write(`hardware-boundary efforts: ${JSON.stringify(efforts)}\n`);
process.stdout.write(
  `portable .mpy ABI: ${wasmMpy & portableAbiMask} (WebAssembly ${wasmMpy}; RP2350 ${recordedPhysicalMpy})\n`,
);
