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
EXAMPLES_ROOT = VENDOR_ROOT / "examples"
sys.path.insert(0, str(VENDOR_ROOT))
sys.path.insert(0, str(VENDOR_ROOT / "reference_source"))


class FakeMotor:
    def __init__(self, count):
        self.count = count
        self.efforts = []

    def set_effort(self, effort):
        self.efforts.append(effort)

    def get_position_counts(self):
        return self.count


class FakeBoardDevice:
    def is_button_pressed(self):
        return False


class FakeRangefinderDevice:
    def __init__(self, error=None):
        self.error = error

    def distance(self):
        if self.error is not None:
            raise self.error
        return 31.25


class ExampleTests(unittest.TestCase):
    def make_fake_xrplib(self, range_error=None):
        left_motor = FakeMotor(18)
        right_motor = FakeMotor(-11)
        board_device = FakeBoardDevice()
        rangefinder_device = FakeRangefinderDevice(range_error)

        class EncodedMotor:
            @staticmethod
            def get_default_encoded_motor(index):
                return left_motor if index == 1 else right_motor

        class Board:
            @staticmethod
            def get_default_board():
                return board_device

        class Rangefinder:
            @staticmethod
            def get_default_rangefinder():
                return rangefinder_device

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
        return modules, left_motor, right_motor

    def run_example(self, name, modules=None):
        output = io.StringIO()
        module_patch = mock.patch.dict(sys.modules, modules or {})
        with module_patch, contextlib.redirect_stdout(output):
            runpy.run_path(str(EXAMPLES_ROOT / name), run_name="__main__")
        return output.getvalue()

    def test_all_python_examples_compile(self):
        paths = sorted(EXAMPLES_ROOT.glob("*.py"))
        self.assertEqual(
            [path.name for path in paths],
            [
                "challenge_1_components.py",
                "no_motion_sensor_read.py",
                "records_and_units.py",
            ],
        )
        for path in paths:
            with self.subTest(path=path.name):
                compile(path.read_text(encoding="utf-8"), str(path), "exec")

    def test_records_and_units_runs_without_hardware(self):
        output = self.run_example("records_and_units.py")
        self.assertIn("pose_mm_rad: 250.0 -75.0 0.5", output)
        self.assertIn("wheel_speeds_mm_s: 120.0 115.0", output)
        self.assertIn("motion_command_mm_s_rad_s: 100.0 -0.25", output)
        self.assertIn("motor_efforts_normalized: 0.3 0.28", output)

    def test_challenge_one_component_example_runs_without_hardware(self):
        output = self.run_example("challenge_1_components.py")
        self.assertIn("wheel_increment_mm: 6.283", output)
        self.assertIn("expected_increment_mm: 6.283", output)
        self.assertIn("wheel_speed_mm_s: 62.83", output)
        self.assertIn("calculated_motor_efforts: MotorEfforts", output)

    def test_no_motion_sensor_example_writes_zero_only(self):
        modules, left_motor, right_motor = self.make_fake_xrplib()
        output = self.run_example("no_motion_sensor_read.py", modules)

        self.assertTrue(left_motor.efforts)
        self.assertTrue(right_motor.efforts)
        self.assertEqual(set(left_motor.efforts), {0.0})
        self.assertEqual(set(right_motor.efforts), {0.0})
        self.assertEqual(left_motor.efforts[-1], 0.0)
        self.assertEqual(right_motor.efforts[-1], 0.0)
        self.assertIn("motion_locked: True", output)
        self.assertIn("left_encoder_count: 18", output)
        self.assertIn("right_encoder_count: -11", output)
        self.assertIn("range_mm: 312.5", output)

    def test_no_motion_sensor_example_stops_after_read_failure(self):
        modules, left_motor, right_motor = self.make_fake_xrplib(
            OSError("range read failed")
        )

        with self.assertRaisesRegex(OSError, "range read failed"):
            self.run_example("no_motion_sensor_read.py", modules)

        self.assertEqual(left_motor.efforts[-1], 0.0)
        self.assertEqual(right_motor.efforts[-1], 0.0)
        self.assertEqual(set(left_motor.efforts), {0.0})
        self.assertEqual(set(right_motor.efforts), {0.0})


if __name__ == "__main__":
    unittest.main()
