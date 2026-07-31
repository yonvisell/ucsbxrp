import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { loadMicroPython } from "@micropython/micropython-webassembly-pyscript";

const repositoryRoot = new URL("../", import.meta.url);
const packageDirectory = new URL("vendor/current/ucsb_xrp/", repositoryRoot);
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

from ucsb_xrp import MotorEfforts, Pose, RobotConfig, XRPBot, wrap_angle_rad

locked = XRPBot(RobotConfig())
locked.set_efforts(MotorEfforts(1.0, -1.0))
assert locked.config.is_motion_locked

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

print("MicroPython", ".".join(str(part) for part in sys.implementation.version[:3]))
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

process.stdout.write(`${output.join("\n")}\n`);
process.stdout.write(`hardware-boundary efforts: ${JSON.stringify(efforts)}\n`);
