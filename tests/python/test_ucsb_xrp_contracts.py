import math
import json
import pathlib
import sys
import tempfile
import unittest


REPOSITORY_ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPOSITORY_ROOT / "vendor" / "current"))

from ucsb_xrp import (  # noqa: E402
    DriveCommand,
    Measurements,
    MotionCommand,
    MotorEfforts,
    NavigationConfig,
    NavigationGoal,
    Pose,
    RawSensors,
    RobotConfig,
    RobotState,
    STOP_COMMAND,
    WheelSpeeds,
    XRPBot,
    bearing_to_goal,
    clamp,
    distance_to_goal,
    elapsed_time_s,
    wrap_angle_rad,
    load_world,
)
from ucsb_xrp.student_api import (  # noqa: E402
    SensorModelBase,
    WheelSpeedControllerBase,
)
from ucsb_xrp._run_control import (  # noqa: E402
    ProgramStopped,
    clear_stop,
    request_stop,
)
from ucsb_xrp import _telemetry as course_telemetry  # noqa: E402


class FakeMotor:
    def __init__(self, count=0):
        self.count = count
        self.efforts = []
        self.reset_count = 0
        self.fail_nonzero = False
        self.fail_zero = False

    def set_effort(self, effort):
        if effort == 0.0 and self.fail_zero:
            raise OSError("zero write failed")
        if effort != 0.0 and self.fail_nonzero:
            raise OSError("effort write failed")
        self.efforts.append(effort)

    def get_position_counts(self):
        return self.count

    def reset_encoder_position(self):
        self.reset_count += 1
        self.count = 0


class FakeBoard:
    def __init__(self, pressed=False):
        self.pressed = pressed
        self.wait_count = 0

    def is_button_pressed(self):
        return self.pressed

    def wait_for_button(self):
        self.wait_count += 1


class FakeRangefinder:
    def __init__(self, distance_cm=25.0):
        self.distance_cm = distance_cm
        self.read_count = 0

    def distance(self):
        self.read_count += 1
        return self.distance_cm


class FakeDevices:
    def __init__(self):
        self.left_motor = FakeMotor(count=12)
        self.right_motor = FakeMotor(count=-9)
        self.board = FakeBoard(pressed=True)
        self.rangefinder = FakeRangefinder(distance_cm=25.5)


def calibrated_config(**changes):
    values = {
        "left_motor_sign": -1,
        "right_motor_sign": 1,
        "left_start_command": 0.12,
        "right_start_command": 0.13,
        "left_speed_command_gain": 0.002,
        "right_speed_command_gain": 0.0021,
        "wheel_speed_kp": 0.003,
        "max_drive_command": 0.4,
    }
    values.update(changes)
    return RobotConfig(**values)


class RecordContractTests(unittest.TestCase):
    def test_records_are_named_values_with_stable_repr_and_equality(self):
        speeds = WheelSpeeds(10, -4.5)
        self.assertEqual(speeds, WheelSpeeds(10.0, -4.5))
        self.assertEqual(
            repr(speeds), "WheelSpeeds(left_mm_s=10.0, right_mm_s=-4.5)"
        )
        with self.assertRaises(AttributeError):
            speeds.left_mm_s = 12.0

    def test_records_reject_nonfinite_or_physically_invalid_values(self):
        for value in (float("nan"), float("inf"), -float("inf")):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    WheelSpeeds(value, 0.0)
        with self.assertRaises(ValueError):
            DriveCommand(1.01, 0.0)
        with self.assertRaises(ValueError):
            RawSensors(0, 0, 0, 0.0, False)
        with self.assertRaises(TypeError):
            RawSensors(0, 0, 0, None, 1)

    def test_pose_and_navigation_goal_normalize_headings(self):
        pose = Pose(1, 2, math.pi)
        goal = NavigationGoal(4, 6, 3.0 * math.pi)
        self.assertAlmostEqual(pose.heading_rad, -math.pi)
        self.assertAlmostEqual(goal.heading_rad, -math.pi)
        self.assertAlmostEqual(distance_to_goal(pose, goal), 5.0)
        self.assertAlmostEqual(bearing_to_goal(pose, goal), math.atan2(4, 3))

    def test_measurements_expose_wheel_speeds_and_form_robot_state(self):
        measurements = Measurements(
            120,
            0.02,
            3.0,
            4.0,
            1.0,
            1.5,
            50.0,
            75.0,
            None,
            False,
        )
        state = RobotState(measurements, Pose(0, 0, 0))
        self.assertEqual(measurements.wheel_speeds, WheelSpeeds(50, 75))
        self.assertIs(state.measurements, measurements)

    def test_stop_command_is_an_explicit_zero_motion_value(self):
        self.assertEqual(STOP_COMMAND, MotionCommand(0, 0))


class ConfigurationContractTests(unittest.TestCase):
    def test_default_config_contains_nominal_geometry_and_full_command_range(self):
        config = RobotConfig()
        self.assertEqual(config.sample_period_ms, 20)
        self.assertEqual(config.wheel_diameter_mm, 60.0)
        self.assertEqual(config.encoder_counts_per_revolution, 585.0)
        self.assertEqual(config.track_width_mm, 155.0)
        self.assertEqual(config.wheel_speed_filter_time_constant_ms, 80.0)
        self.assertEqual(config.max_drive_command, 1.0)

    def test_robot_config_rejects_invalid_signs_limits_and_nonfinite_values(self):
        with self.assertRaises(ValueError):
            RobotConfig(left_motor_sign=0)
        with self.assertRaises(ValueError):
            RobotConfig(max_drive_command=1.01)
        with self.assertRaises(ValueError):
            RobotConfig(left_start_command=0.2, max_drive_command=0.1)
        with self.assertRaises(ValueError):
            RobotConfig(track_width_mm=float("nan"))
        with self.assertRaises(ValueError):
            RobotConfig(wheel_speed_filter_time_constant_ms=-1.0)

    def test_navigation_config_rejects_inverted_speed_and_heading_ranges(self):
        with self.assertRaises(ValueError):
            NavigationConfig(100, 120, 200, 1.0, 10, 0.1, 0.2)
        with self.assertRaises(ValueError):
            NavigationConfig(120, 60, 200, 1.0, 10, 0.3, 0.2)


class UtilityContractTests(unittest.TestCase):
    def test_clamp_and_elapsed_time(self):
        self.assertEqual(clamp(-2, -1, 1), -1.0)
        self.assertEqual(clamp(2, -1, 1), 1.0)
        self.assertEqual(clamp(0.25, -1, 1), 0.25)
        self.assertEqual(elapsed_time_s(1240, 1000), 0.24)
        with self.assertRaises(ValueError):
            clamp(0, 2, 1)

    def test_wrap_angle_has_half_open_range(self):
        values = (-9.0, -math.pi, 0.0, math.pi, 14.0)
        for value in values:
            wrapped = wrap_angle_rad(value)
            self.assertGreaterEqual(wrapped, -math.pi)
            self.assertLess(wrapped, math.pi)
        self.assertAlmostEqual(wrap_angle_rad(math.pi), -math.pi)
        self.assertGreater(wrap_angle_rad(math.pi - 2e-6), 0.0)

    def test_project_world_loads_geometry_and_named_waypoint(self):
        catalog = {
            "default_world": "lab",
            "worlds": [
                {
                    "id": "lab",
                    "label": "Lab",
                    "bounds": {
                        "minimum_x_mm": 0,
                        "minimum_y_mm": 0,
                        "maximum_x_mm": 800,
                        "maximum_y_mm": 600,
                    },
                    "initial_pose": {
                        "x_mm": 100,
                        "y_mm": 120,
                        "heading_rad": 0,
                    },
                    "obstacles": [
                        {
                            "type": "wall",
                            "minimum_x_mm": 300,
                            "minimum_y_mm": 0,
                            "maximum_x_mm": 330,
                            "maximum_y_mm": 400,
                        },
                        {
                            "type": "block",
                            "feature": "gate",
                            "minimum_x_mm": 500,
                            "minimum_y_mm": 200,
                            "maximum_x_mm": 550,
                            "maximum_y_mm": 300,
                        },
                    ],
                    "markers": [
                        {
                            "type": "waypoint",
                            "name": "finish",
                            "x_mm": 700,
                            "y_mm": 500,
                            "heading_rad": 1.0,
                        }
                    ],
                }
            ],
        }
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / "world.json"
            path.write_text(json.dumps(catalog), encoding="utf-8")
            world = load_world(str(path))

        self.assertEqual(world.id, "lab")
        self.assertEqual(world.initial_pose, Pose(100, 120, 0))
        self.assertEqual(world.feature_names, ("gate",))
        self.assertEqual(world.waypoint("finish"), NavigationGoal(700, 500, 1.0))
        self.assertFalse(world.arena_map().is_free(310, 100))
        self.assertTrue(world.arena_map().is_free(525, 250))
        self.assertFalse(
            world.arena_map(blocked_features=("gate",)).is_free(525, 250)
        )


class StudentInterfaceContractTests(unittest.TestCase):
    def test_challenge_one_protocols_are_narrow_and_unimplemented(self):
        sensor = SensorModelBase(RobotConfig())
        controller = WheelSpeedControllerBase(RobotConfig())
        self.assertIsInstance(sensor.config, RobotConfig)
        with self.assertRaises(NotImplementedError):
            sensor.reset(None)
        with self.assertRaises(NotImplementedError):
            sensor.update(None)
        with self.assertRaises(NotImplementedError):
            sensor.estimate_range([], 1)
        with self.assertRaises(NotImplementedError):
            controller.reset()
        with self.assertRaises(NotImplementedError):
            controller.update(None, None)


class XRPBotContractTests(unittest.TestCase):
    def setUp(self):
        clear_stop()
        course_telemetry.clear_state()

    def tearDown(self):
        clear_stop()
        course_telemetry.clear_state()

    def make_bot(self, config=None):
        devices = FakeDevices()
        bot = XRPBot(
            calibrated_config() if config is None else config,
            _devices=devices,
            _ticks_ms=lambda: 1234,
        )
        return bot, devices

    def test_construction_stops_both_motors(self):
        _, devices = self.make_bot()
        self.assertEqual(devices.left_motor.efforts, [0.0])
        self.assertEqual(devices.right_motor.efforts, [0.0])

    def test_read_converts_range_centimeters_to_millimeters_on_request(self):
        bot, devices = self.make_bot()
        without_range = bot.read()
        self.assertIsNone(without_range.range_mm)
        self.assertEqual(devices.rangefinder.read_count, 0)

        sample = bot.read(include_range=True)
        self.assertEqual(sample, RawSensors(1234, 12, -9, 255.0, True))
        self.assertEqual(devices.rangefinder.read_count, 1)
        mirrored = course_telemetry.hardware_snapshot()
        self.assertEqual(mirrored["leftEncoderCount"], 12)
        self.assertEqual(mirrored["rightEncoderCount"], -9)
        self.assertEqual(mirrored["rangeMm"], 255.0)
        self.assertTrue(mirrored["buttonPressed"])

    def test_rangefinder_sentinel_and_nonfinite_values_become_missing(self):
        bot, devices = self.make_bot()
        for raw_value in (65535, 0, -1, float("nan"), float("inf"), "bad"):
            with self.subTest(raw_value=raw_value):
                devices.rangefinder.distance_cm = raw_value
                self.assertIsNone(bot.read(include_range=True).range_mm)

    def test_set_drive_applies_signs_and_final_boundary_clamp(self):
        bot, devices = self.make_bot()
        bot.set_drive(DriveCommand(0.9, -0.7))
        self.assertEqual(devices.left_motor.efforts[-1], -0.4)
        self.assertEqual(devices.right_motor.efforts[-1], -0.4)
        mirrored = course_telemetry.hardware_snapshot()
        self.assertEqual(mirrored["leftEffort"], 0.4)
        self.assertEqual(mirrored["rightEffort"], -0.4)

    def test_default_effort_limit_accepts_the_record_range(self):
        bot, devices = self.make_bot(RobotConfig())
        bot.set_drive(DriveCommand(1.0, -1.0))
        self.assertEqual(devices.left_motor.efforts[-1], 1.0)
        self.assertEqual(devices.right_motor.efforts[-1], -1.0)

    def test_invalid_effort_is_rejected_and_both_motors_are_stopped(self):
        bot, devices = self.make_bot()
        for invalid in (float("nan"), float("inf"), "bad", True):
            with self.subTest(invalid=invalid):
                corrupt = DriveCommand(0.1, 0.2)
                corrupt._left = invalid
                with self.assertRaises(ValueError):
                    bot.set_drive(corrupt)
                self.assertEqual(devices.left_motor.efforts[-1], 0.0)
                self.assertEqual(devices.right_motor.efforts[-1], 0.0)

    def test_partial_motor_write_failure_stops_both_sides(self):
        bot, devices = self.make_bot()
        devices.right_motor.fail_nonzero = True
        with self.assertRaises(OSError):
            bot.set_drive(DriveCommand(0.2, 0.2))
        self.assertEqual(devices.left_motor.efforts[-1], 0.0)
        self.assertEqual(devices.right_motor.efforts[-1], 0.0)

    def test_stop_attempts_right_motor_when_left_stop_fails(self):
        bot, devices = self.make_bot()
        devices.left_motor.fail_zero = True
        right_writes_before = len(devices.right_motor.efforts)
        with self.assertRaises(OSError):
            bot.stop()
        self.assertEqual(len(devices.right_motor.efforts), right_writes_before + 1)
        self.assertEqual(devices.right_motor.efforts[-1], 0.0)

    def test_reset_and_button_wait_are_explicit_separate_operations(self):
        bot, devices = self.make_bot()
        bot.reset_encoders()
        bot.wait_for_button()
        self.assertEqual(devices.left_motor.reset_count, 1)
        self.assertEqual(devices.right_motor.reset_count, 1)
        self.assertEqual(devices.board.wait_count, 1)

    def test_managed_stop_interrupts_the_next_hardware_operation(self):
        bot, devices = self.make_bot()
        request_stop()

        with self.assertRaises(ProgramStopped):
            bot.read()
        with self.assertRaises(ProgramStopped):
            bot.set_drive(DriveCommand(0.2, 0.2))
        bot.stop()
        self.assertEqual(devices.left_motor.efforts[-1], 0.0)
        self.assertEqual(devices.right_motor.efforts[-1], 0.0)

    def test_pre_0_3_names_remain_compatible(self):
        config = RobotConfig(
            left_start_effort=0.1,
            right_start_effort=0.11,
            left_speed_effort_gain=0.002,
            right_speed_effort_gain=0.0021,
            max_effort=0.4,
        )
        self.assertEqual(config.left_start_command, 0.1)
        self.assertEqual(config.max_drive_command, 0.4)
        self.assertEqual(config.max_effort, config.max_drive_command)
        self.assertIs(MotorEfforts, DriveCommand)

        bot, devices = self.make_bot(config)
        bot.set_efforts(MotorEfforts(0.2, 0.2))
        self.assertEqual(devices.left_motor.efforts[-1], 0.2)
        self.assertEqual(devices.right_motor.efforts[-1], 0.2)

        with self.assertRaises(TypeError):
            RobotConfig(max_drive_command=0.4, max_effort=0.3)


if __name__ == "__main__":
    unittest.main()
