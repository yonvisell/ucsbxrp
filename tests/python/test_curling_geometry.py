"""Run the Curling entrypoint against an ideal, motion-free Robot boundary."""
import ast
import contextlib
import importlib.util
import io
import json
import math
import os
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
VENDOR = ROOT / "vendor/current"
PROJECT = VENDOR / "starters/new_challenge_1_robot_curling"
sys.path[:0] = [str(VENDOR), str(VENDOR / "reference_source")]


@contextlib.contextmanager
def curling_program(world):
    names = {path.stem for path in PROJECT.glob("*.py")}
    saved = {name: sys.modules.pop(name) for name in names if name in sys.modules}
    previous_cwd = os.getcwd()
    sys.path.insert(0, str(PROJECT))
    try:
        with tempfile.TemporaryDirectory() as directory:
            Path(directory, "world.json").write_text(json.dumps(world))
            os.chdir(directory)
            spec = importlib.util.spec_from_file_location("challenge", PROJECT / "challenge.py")
            challenge = importlib.util.module_from_spec(spec)
            sys.modules["challenge"] = challenge
            spec.loader.exec_module(challenge)
            tree = ast.parse((PROJECT / "main.py").read_text())
            # Exercise run_challenge explicitly after replacing only the Robot
            # construction boundary; no XRPBot or hardware object is created.
            last = tree.body[-1]
            assert isinstance(last, ast.Expr) and isinstance(last.value, ast.Call)
            assert isinstance(last.value.func, ast.Name) and last.value.func.id == "run_challenge"
            tree.body.pop()
            values = {}
            exec(compile(tree, str(PROJECT / "main.py"), "exec"), values)
            yield values
    finally:
        os.chdir(previous_cwd)
        sys.path.remove(str(PROJECT))
        for name in names:
            sys.modules.pop(name, None)
        sys.modules.update(saved)


def lane(heading, start, finish=None):
    world = json.loads((PROJECT / "world.json").read_text())
    case = world["worlds"][0]
    x, y = start
    case["initial_pose"] = {"x_mm": x, "y_mm": y, "heading_rad": heading}
    end = finish or (x + 1000 * math.cos(heading), y + 1000 * math.sin(heading))
    case["markers"] = [{"type": "waypoint", "name": "finish", "x_mm": end[0], "y_mm": end[1]}]
    return world


class IdealStraightRobot:
    """Instant wheel-speed tracking supplies deterministic measured state."""
    def __init__(self):
        # Full discovery may have replaced package modules in service tests.
        import ucsb_xrp
        self.api = ucsb_xrp
        self.time_ms = 0
        self.position_mm = 0.0
        self.commands = []
        self.stopped = False

    def state(self, increment=0.0, speed=0.0):
        pose = self.api.Pose(
            self.initial.x_mm + self.position_mm * math.cos(self.initial.heading_rad),
            self.initial.y_mm + self.position_mm * math.sin(self.initial.heading_rad),
            self.initial.heading_rad,
        )
        measurements = self.api.Measurements(
            self.time_ms, 0.02, self.position_mm, self.position_mm,
            increment, increment, speed, speed, None, False,
        )
        return self.api.RobotState(measurements, pose)

    def start(self, initial):
        self.initial = initial
        return self.state()

    def step(self, command):
        if self.time_ms >= 30_000:
            raise AssertionError("Curling exceeded its bounded loop")
        if command.turn_rate_rad_s != 0:
            raise AssertionError("Curling unexpectedly commanded steering")
        self.commands.append(command)
        increment = command.forward_speed_mm_s * 0.02
        self.position_mm += increment
        self.time_ms += 20
        return self.state(increment, command.forward_speed_mm_s)

    def stop(self):
        self.stopped = True


class CurlingGeometryTests(unittest.TestCase):
    def tearDown(self):
        from ucsb_xrp import live
        live.clear()

    def test_translated_and_rotated_lane_error_uses_the_actual_finish(self):
        for heading, start in ((0, (-500, 200)), (math.pi / 2, (200, -500)), (math.pi, (500, -200)), (math.pi / 4, (-350, -350))):
            with self.subTest(heading=heading), curling_program(lane(heading, start)) as program:
                robot = IdealStraightRobot()
                program["make_robot"] = lambda config: robot
                output = io.StringIO()
                with contextlib.redirect_stdout(output):
                    state = program["run_challenge"]()
                finish = program["FINISH"]
                expected = math.hypot(state.pose.x_mm - finish.x_mm, state.pose.y_mm - finish.y_mm)
                line = next(line for line in output.getvalue().splitlines() if line.startswith("estimated_axle_error_mm:"))
                reported = float(line.split(":", 1)[1])
                self.assertAlmostEqual(reported, expected, places=8)
                self.assertLessEqual(reported, 10.0)
                self.assertIn("result=stationary", output.getvalue())
                self.assertIn("minimum_time_met=True", output.getvalue())
                self.assertTrue(robot.stopped)
                self.assertEqual(robot.commands[-1].forward_speed_mm_s, 0.0)
                self.assertAlmostEqual(program["TRAVEL_DISTANCE_MM"], 1000.0)

    def test_invalid_lane_is_rejected_before_robot_construction(self):
        for finish in ((-1000, 0), (1000, 100), (0, 0)):
            with self.subTest(finish=finish):
                with self.assertRaisesRegex(ValueError, "requires finish ahead"):
                    with curling_program(lane(0, (0, 0), finish)):
                        self.fail("Invalid geometry reached the Robot construction boundary")

    def test_rounded_right_angle_is_accepted_within_the_lateral_tolerance(self):
        with curling_program(lane(1.5708, (200, -500), (200, 500))) as program:
            self.assertAlmostEqual(program["TRAVEL_DISTANCE_MM"], 1000.0)
            self.assertEqual((program["FINISH"].x_mm, program["FINISH"].y_mm), (200, 500))


if __name__ == "__main__":
    unittest.main()
