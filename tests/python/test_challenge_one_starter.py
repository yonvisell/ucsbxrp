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
REFERENCE_SOURCE_ROOT = VENDOR_ROOT / "reference_source"
STARTER_ROOT = VENDOR_ROOT / "starters" / "challenge_1"
sys.path.insert(0, str(VENDOR_ROOT))
sys.path.insert(0, str(REFERENCE_SOURCE_ROOT))


class FakeMotor:
    def __init__(self, read_error=None):
        self.count = 0
        self.efforts = []
        self.reset_count = 0
        self.read_error = read_error

    def set_effort(self, effort):
        self.efforts.append(effort)

    def get_position_counts(self):
        if self.read_error is not None:
            raise self.read_error
        if self.efforts:
            self.count += int(self.efforts[-1] * 20)
        return self.count

    def reset_encoder_position(self):
        self.count = 0
        self.reset_count += 1


class FakeBoard:
    def __init__(self):
        self.wait_count = 0

    def is_button_pressed(self):
        return False

    def wait_for_button(self):
        self.wait_count += 1


class FakeRangefinder:
    def distance(self):
        raise AssertionError("the Challenge 1 starter does not request range")


class ChallengeOneStarterTests(unittest.TestCase):
    def make_fake_xrplib(self, read_error=None):
        left_motor = FakeMotor(read_error=read_error)
        right_motor = FakeMotor()
        board = FakeBoard()
        rangefinder = FakeRangefinder()

        class EncodedMotor:
            @staticmethod
            def get_default_encoded_motor(index):
                return left_motor if index == 1 else right_motor

        class Board:
            @staticmethod
            def get_default_board():
                return board

        class Rangefinder:
            @staticmethod
            def get_default_rangefinder():
                return rangefinder

        package = types.ModuleType("XRPLib")
        package.__path__ = []
        board_module = types.ModuleType("XRPLib.board")
        board_module.Board = Board
        motor_module = types.ModuleType("XRPLib.encoded_motor")
        motor_module.EncodedMotor = EncodedMotor
        range_module = types.ModuleType("XRPLib.rangefinder")
        range_module.Rangefinder = Rangefinder
        modules = {
            "XRPLib": package,
            "XRPLib.board": board_module,
            "XRPLib.encoded_motor": motor_module,
            "XRPLib.rangefinder": range_module,
        }
        return modules, left_motor, right_motor, board

    def run_starter(self, modules):
        transient_modules = {
            "challenge",
            "course_setup",
            "robot_config",
            "sensor_model",
            "wheel_speed_controller",
        }
        saved_modules = {
            name: sys.modules.pop(name)
            for name in transient_modules
            if name in sys.modules
        }
        output = io.StringIO()
        clock = [0]

        def fake_ticks_ms():
            clock[0] += 20
            return clock[0]

        starter_path = [
            str(STARTER_ROOT),
            str(REFERENCE_SOURCE_ROOT),
            str(VENDOR_ROOT),
        ] + sys.path

        try:
            with mock.patch.dict(sys.modules, modules), mock.patch.object(
                sys, "path", starter_path
            ), mock.patch(
                "ucsb_xrp.robot._default_sleep_ms", return_value=None
            ), mock.patch(
                "ucsb_xrp.robot._default_ticks_ms", side_effect=fake_ticks_ms
            ), mock.patch(
                "ucsb_xrp.xrpbot._default_ticks_ms", side_effect=fake_ticks_ms
            ), contextlib.redirect_stdout(output):
                runpy.run_path(str(STARTER_ROOT / "main.py"), run_name="__main__")
        finally:
            for name in transient_modules:
                sys.modules.pop(name, None)
            sys.modules.update(saved_modules)

        return output.getvalue()

    def test_starter_has_literal_component_files_that_compile(self):
        paths = sorted(STARTER_ROOT.glob("*.py"))
        self.assertEqual(
            [path.name for path in paths],
            [
                "challenge.py",
                "course_setup.py",
                "main.py",
                "robot_config.py",
                "sensor_model.py",
                "wheel_speed_controller.py",
            ],
        )
        for path in paths:
            with self.subTest(path=path.name):
                compile(path.read_text(encoding="utf-8"), str(path), "exec")

    def test_default_starter_runs_the_straight_challenge_and_stops(self):
        modules, left_motor, right_motor, board = self.make_fake_xrplib()
        output = self.run_starter(modules)

        self.assertTrue(left_motor.efforts)
        self.assertTrue(right_motor.efforts)
        self.assertTrue(any(effort > 0 for effort in left_motor.efforts))
        self.assertTrue(any(effort > 0 for effort in right_motor.efforts))
        self.assertEqual(left_motor.efforts[-1], 0.0)
        self.assertEqual(right_motor.efforts[-1], 0.0)
        self.assertEqual(left_motor.reset_count, 1)
        self.assertEqual(right_motor.reset_count, 1)
        self.assertEqual(board.wait_count, 1)
        self.assertIn("Challenge 1 complete", output)
        self.assertIn("target_distance_mm: 1000.0", output)

    def test_sensor_read_failure_still_ends_with_zero_effort(self):
        modules, left_motor, right_motor, _ = self.make_fake_xrplib(
            read_error=OSError("encoder read failed")
        )

        with self.assertRaisesRegex(OSError, "encoder read failed"):
            self.run_starter(modules)

        self.assertEqual(left_motor.efforts[-1], 0.0)
        self.assertEqual(right_motor.efforts[-1], 0.0)
        self.assertEqual(set(left_motor.efforts), {0.0})
        self.assertEqual(set(right_motor.efforts), {0.0})


if __name__ == "__main__":
    unittest.main()
