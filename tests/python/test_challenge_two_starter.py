import contextlib
import io
import pathlib
import runpy
import sys
import types
import unittest
from unittest import mock


REPOSITORY_ROOT = pathlib.Path(__file__).resolve().parents[2]
VENDOR_ROOT = REPOSITORY_ROOT / "vendor" / "current"
STARTER_ROOT = VENDOR_ROOT / "starters" / "challenge_2"
sys.path.insert(0, str(VENDOR_ROOT))


class StalledRobot:
    def __init__(self, advance_straight=False):
        from ucsb_xrp import Measurements, Pose, RobotState

        self._Measurements = Measurements
        self._Pose = Pose
        self._RobotState = RobotState
        self.advance_straight = advance_straight
        self.time_ms = 0
        self.position_mm = 0.0
        self.stop_count = 0
        self.commands = []

    def _state(self):
        measurements = self._Measurements(
            self.time_ms,
            0.02 if self.time_ms else 0.0,
            self.position_mm,
            self.position_mm,
            0.0,
            0.0,
            0.0,
            0.0,
            None,
            False,
        )
        return self._RobotState(measurements, self._Pose(self.position_mm, 0.0, 0.0))

    def start(self, _initial_pose):
        return self._state()

    def step(self, command):
        self.commands.append(command)
        self.time_ms += 20
        if self.advance_straight and command.forward_speed_mm_s > 0.0:
            self.position_mm += 100.0
        return self._state()

    def stop(self):
        self.stop_count += 1


class ChallengeTwoStarterTests(unittest.TestCase):
    def run_starter(self, robot):
        from ucsb_xrp import NavigationConfig, Pose, RobotConfig

        challenge = types.ModuleType("challenge")
        challenge.INITIAL_POSE = Pose(0.0, 0.0, 0.0)
        challenge.OUTBOUND_DISTANCE_MM = 500.0
        challenge.TURN_HEADING_RAD = 3.141592653589793
        challenge.RETURN_DISTANCE_MM = 500.0
        challenge.FINAL_HEADING_RAD = 0.0
        challenge.MAX_STRAIGHT_TIME_S = 12.0
        challenge.MAX_TURN_TIME_S = 8.0

        course_setup = types.ModuleType("course_setup")
        course_setup.make_robot = lambda _config: robot

        robot_config = types.ModuleType("robot_config")
        robot_config.ROBOT_CONFIG = RobotConfig(sample_period_ms=20)
        robot_config.NAVIGATION_CONFIG = NavigationConfig(
            cruise_speed_mm_s=150.0,
            approach_speed_mm_s=60.0,
            slowdown_distance_mm=180.0,
            turn_rate_rad_s=0.8,
            position_tolerance_mm=12.0,
            heading_tolerance_rad=0.08,
            realign_heading_rad=0.25,
        )

        output = io.StringIO()
        with mock.patch.dict(
            sys.modules,
            {
                "challenge": challenge,
                "course_setup": course_setup,
                "robot_config": robot_config,
            },
        ), contextlib.redirect_stdout(output):
            with self.assertRaises(RuntimeError) as raised:
                runpy.run_path(str(STARTER_ROOT / "main.py"), run_name="__main__")
        return str(raised.exception), output.getvalue()

    def test_stalled_outbound_phase_reports_limit_and_stops(self):
        robot = StalledRobot()
        error, output = self.run_starter(robot)

        self.assertIn("outbound travel did not complete within 12.0 s", error)
        self.assertIn("Phase started: outbound travel", output)
        self.assertIn("Challenge 2 stopped: outbound travel", output)
        self.assertEqual(robot.stop_count, 1)

    def test_stalled_turn_reports_its_phase_and_stops(self):
        robot = StalledRobot(advance_straight=True)
        error, output = self.run_starter(robot)

        self.assertIn("turnaround did not complete within 8.0 s", error)
        self.assertIn("Phase complete: outbound travel", output)
        self.assertIn("Phase started: turnaround", output)
        self.assertIn("Challenge 2 stopped: turnaround", output)
        self.assertEqual(robot.stop_count, 1)


if __name__ == "__main__":
    unittest.main()
