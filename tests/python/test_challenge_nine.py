import pathlib
import sys
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path[:0] = [
    str(ROOT / "vendor" / "current"),
    str(ROOT / "vendor" / "current" / "reference_source"),
]

from ucsb_xrp import (  # noqa: E402
    DriveCommand,
    MotionCommand,
    Pose,
    RawSensors,
    ReflectanceReadings,
    Robot,
    RobotConfig,
)
from ucsb_xrp_reference import (  # noqa: E402
    DifferentialDrive,
    Odometry,
    SensorModel,
    WheelSpeedController,
)
from ucsb_xrp_reference.challenge_9 import LineFollower  # noqa: E402


SETTINGS = {
    "cruise_speed_mm_s": 100.0,
    "minimum_speed_mm_s": 45.0,
    "kp_rad_s": 1.8,
    "ki_rad_s2": 0.0,
    "kd_rad": 0.0,
    "integral_limit_s": 0.5,
    "maximum_turn_rate_rad_s": 1.4,
    "turn_slowdown": 0.45,
}


class ChallengeNineTests(unittest.TestCase):
    def test_line_follower_turns_toward_darker_sensor(self):
        follower = LineFollower(SETTINGS)
        centered = follower.update(ReflectanceReadings(0.5, 0.5), 0.02)
        left = follower.update(ReflectanceReadings(0.8, 0.2), 0.02)
        right = follower.update(ReflectanceReadings(0.2, 0.8), 0.02)
        self.assertIsInstance(centered, MotionCommand)
        self.assertEqual(centered.turn_rate_rad_s, 0.0)
        self.assertGreater(left.turn_rate_rad_s, 0.0)
        self.assertLess(right.turn_rate_rad_s, 0.0)

    def test_sensor_model_preserves_optional_reflectance(self):
        readings = ReflectanceReadings(0.25, 0.75)
        model = SensorModel(RobotConfig())
        reset = model.reset(RawSensors(0, 0, 0, None, False, readings))
        update = model.update(RawSensors(20, 0, 0, None, False, readings))
        self.assertEqual(reset.reflectance, readings)
        self.assertEqual(update.reflectance, readings)

    def test_robot_requests_reflectance_without_changing_default_calls(self):
        class Bot:
            def __init__(self):
                self.calls = []
                self.time_ms = 0

            def read(self, include_range=False, include_reflectance=False):
                self.calls.append((include_range, include_reflectance))
                self.time_ms += 20
                return RawSensors(
                    self.time_ms,
                    0,
                    0,
                    None,
                    False,
                    ReflectanceReadings(0.4, 0.6) if include_reflectance else None,
                )

            def reset_encoders(self):
                pass

            def wait_for_button(self):
                pass

            def set_drive(self, command):
                self.command = command

            def stop(self):
                self.command = DriveCommand(0.0, 0.0)

        config = RobotConfig()
        bot = Bot()
        robot = Robot(
            config,
            bot,
            SensorModel(config),
            WheelSpeedController(config),
            DifferentialDrive(config),
            Odometry(config),
            _sleep_ms=lambda _duration: None,
            _ticks_ms=lambda: 0,
        )
        state = robot.start(Pose(0, 0, 0), read_reflectance=True)
        state = robot.step(MotionCommand(0, 0), read_reflectance=True)
        self.assertEqual(bot.calls, [(False, True), (False, True)])
        self.assertEqual(
            state.measurements.reflectance,
            ReflectanceReadings(0.4, 0.6),
        )


if __name__ == "__main__":
    unittest.main()
