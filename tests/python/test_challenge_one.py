import math
import pathlib
import sys
import unittest


REPOSITORY_ROOT = pathlib.Path(__file__).resolve().parents[2]
VENDOR_ROOT = REPOSITORY_ROOT / "vendor" / "current"
REFERENCE_SOURCE_ROOT = VENDOR_ROOT / "reference_source"
sys.path.insert(0, str(VENDOR_ROOT))
sys.path.insert(0, str(REFERENCE_SOURCE_ROOT))

from ucsb_xrp import (  # noqa: E402
    Measurements,
    NavigationConfig,
    RawSensors,
    RobotConfig,
    STOP_COMMAND,
    StraightLineController,
    WheelSpeeds,
)
from ucsb_xrp_reference import SensorModel, WheelSpeedController  # noqa: E402


def one_mm_per_count_config(**changes):
    values = {
        "wheel_diameter_mm": 100.0 / math.pi,
        "encoder_counts_per_revolution": 100.0,
        "left_encoder_sign": 1,
        "right_encoder_sign": -1,
    }
    values.update(changes)
    return RobotConfig(**values)


def measurements(left_position_mm, right_position_mm):
    return Measurements(
        time_ms=0,
        dt_s=0.0,
        left_position_mm=left_position_mm,
        right_position_mm=right_position_mm,
        left_increment_mm=0.0,
        right_increment_mm=0.0,
        left_speed_mm_s=0.0,
        right_speed_mm_s=0.0,
        range_mm=None,
        button_pressed=False,
    )


class SensorModelContractTests(unittest.TestCase):
    def test_reset_establishes_zero_position_and_preserves_current_inputs(self):
        model = SensorModel(one_mm_per_count_config())

        result = model.reset(RawSensors(900, 120, -75, 340.0, True))

        self.assertEqual(result.time_ms, 900)
        self.assertEqual(result.dt_s, 0.0)
        self.assertEqual(result.left_position_mm, 0.0)
        self.assertEqual(result.right_position_mm, 0.0)
        self.assertEqual(result.left_increment_mm, 0.0)
        self.assertEqual(result.right_increment_mm, 0.0)
        self.assertEqual(result.wheel_speeds, WheelSpeeds(0.0, 0.0))
        self.assertEqual(result.range_mm, 340.0)
        self.assertTrue(result.button_pressed)

    def test_updates_position_increment_and_speed_with_configured_signs(self):
        model = SensorModel(one_mm_per_count_config())
        model.reset(RawSensors(1000, 100, 200, None, False))

        first = model.update(RawSensors(1250, 110, 185, None, False))
        second = model.update(RawSensors(1350, 116, 180, None, False))

        self.assertAlmostEqual(first.left_position_mm, 10.0)
        self.assertAlmostEqual(first.right_position_mm, 15.0)
        self.assertAlmostEqual(first.left_increment_mm, 10.0)
        self.assertAlmostEqual(first.right_increment_mm, 15.0)
        self.assertAlmostEqual(first.left_speed_mm_s, 40.0)
        self.assertAlmostEqual(first.right_speed_mm_s, 60.0)
        self.assertAlmostEqual(second.left_position_mm, 16.0)
        self.assertAlmostEqual(second.right_position_mm, 20.0)
        self.assertAlmostEqual(second.left_increment_mm, 6.0)
        self.assertAlmostEqual(second.right_increment_mm, 5.0)
        self.assertAlmostEqual(second.left_speed_mm_s, 60.0)
        self.assertAlmostEqual(second.right_speed_mm_s, 50.0)

    def test_no_positive_elapsed_time_keeps_travel_but_reports_zero_speed(self):
        model = SensorModel(one_mm_per_count_config())
        model.reset(RawSensors(1000, 0, 0, None, False))

        result = model.update(RawSensors(1000, 4, -6, None, False))

        self.assertAlmostEqual(result.left_increment_mm, 4.0)
        self.assertAlmostEqual(result.right_increment_mm, 6.0)
        self.assertEqual(result.dt_s, 0.0)
        self.assertEqual(result.wheel_speeds, WheelSpeeds(0.0, 0.0))

    def test_update_requires_a_reset_and_raw_sensor_records(self):
        model = SensorModel(one_mm_per_count_config())
        with self.assertRaisesRegex(RuntimeError, "reset"):
            model.update(RawSensors(0, 0, 0, None, False))
        with self.assertRaises(TypeError):
            model.reset(object())

    def test_range_estimate_uses_median_of_positive_finite_samples(self):
        model = SensorModel(one_mm_per_count_config())
        samples = [None, 400.0, float("nan"), -2.0, 100.0, 300.0, 200.0]

        self.assertEqual(model.estimate_range(samples, 3), 250.0)
        self.assertIsNone(model.estimate_range(samples, 5))
        with self.assertRaises(ValueError):
            model.estimate_range(samples, 0)


class WheelSpeedControllerContractTests(unittest.TestCase):
    def make_controller(self, **changes):
        values = {
            "left_start_command": 0.10,
            "right_start_command": 0.12,
            "left_speed_command_gain": 0.002,
            "right_speed_command_gain": 0.0015,
            "wheel_speed_kp": 0.001,
            "max_drive_command": 0.50,
        }
        values.update(changes)
        return WheelSpeedController(RobotConfig(**values))

    def test_forward_and_reverse_targets_use_calibration_and_speed_error(self):
        controller = self.make_controller()

        result = controller.update(
            WheelSpeeds(100.0, -80.0),
            WheelSpeeds(90.0, -60.0),
        )

        self.assertAlmostEqual(result.left, 0.31)
        self.assertAlmostEqual(result.right, -0.26)

    def test_each_zero_target_produces_exactly_zero_effort(self):
        controller = self.make_controller()
        result = controller.update(
            WheelSpeeds(0.0, 80.0),
            WheelSpeeds(-500.0, 1000.0),
        )

        self.assertEqual(result.left, 0.0)
        self.assertNotEqual(result.right, 0.0)

    def test_output_is_limited_and_zero_calibration_returns_zero(self):
        controller = self.make_controller()
        saturated = controller.update(WheelSpeeds(1000, -1000), WheelSpeeds(0, 0))
        self.assertEqual(saturated.left, 0.5)
        self.assertEqual(saturated.right, -0.5)

        uncalibrated = WheelSpeedController(RobotConfig())
        result = uncalibrated.update(WheelSpeeds(200, -200), WheelSpeeds(0, 0))
        self.assertEqual(result.left, 0.0)
        self.assertEqual(result.right, 0.0)

    def test_inputs_are_named_wheel_speed_values(self):
        controller = self.make_controller()
        with self.assertRaises(TypeError):
            controller.update((10.0, 10.0), WheelSpeeds(0, 0))
        with self.assertRaises(TypeError):
            controller.update(WheelSpeeds(10, 10), (0.0, 0.0))


class StraightLineControllerContractTests(unittest.TestCase):
    def make_controller(self):
        return StraightLineController(
            NavigationConfig(
                cruise_speed_mm_s=120.0,
                approach_speed_mm_s=50.0,
                slowdown_distance_mm=200.0,
                turn_rate_rad_s=1.0,
                position_tolerance_mm=10.0,
                heading_tolerance_rad=0.1,
                realign_heading_rad=0.3,
            )
        )

    def test_cruises_slows_and_stops_from_mean_wheel_travel(self):
        controller = self.make_controller()
        controller.start(measurements(100.0, 120.0), distance_mm=500.0)

        cruise = controller.update(measurements(100.0, 120.0))
        approach = controller.update(measurements(410.0, 430.0))
        stopped = controller.update(measurements(590.0, 610.0))

        self.assertEqual(cruise.forward_speed_mm_s, 120.0)
        self.assertEqual(cruise.turn_rate_rad_s, 0.0)
        self.assertEqual(approach.forward_speed_mm_s, 50.0)
        self.assertEqual(stopped, STOP_COMMAND)
        self.assertTrue(controller.is_complete())
        self.assertEqual(controller.update(measurements(610.0, 630.0)), STOP_COMMAND)

    def test_zero_distance_is_complete_without_a_motion_command(self):
        controller = self.make_controller()
        initial = measurements(0.0, 0.0)
        controller.start(initial, 0.0)
        self.assertTrue(controller.is_complete())
        self.assertEqual(controller.update(initial), STOP_COMMAND)

    def test_update_requires_start_and_distance_must_be_nonnegative(self):
        controller = self.make_controller()
        with self.assertRaisesRegex(RuntimeError, "start"):
            controller.update(measurements(0.0, 0.0))
        with self.assertRaises(ValueError):
            controller.start(measurements(0.0, 0.0), -1.0)


if __name__ == "__main__":
    unittest.main()
