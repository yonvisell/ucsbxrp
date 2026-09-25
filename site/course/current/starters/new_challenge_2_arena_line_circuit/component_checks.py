from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController
from differential_drive import DifferentialDrive
from ucsb_xrp.component_checks import run_component_checks
from robot_config import ROBOT_CONFIG
from ucsb_xrp import RawSensors, ReflectanceReadings

run_component_checks(SensorModel, WheelSpeedController, DifferentialDrive)


def check_reflectance_preservation():
    # An earlier wheel-only model must retain the newly requested sensors.
    model = SensorModel(ROBOT_CONFIG)
    readings = ReflectanceReadings(0.2, 0.8)
    try:
        first = model.reset(RawSensors(0, 0, 0, None, False, readings))
        later = model.update(RawSensors(20, 0, 0, None, False, readings))
        if first.reflectance != readings or later.reflectance != readings:
            raise AssertionError("Preserve raw.reflectance in both Measurements results")
    except NotImplementedError as error:
        print("NOT IMPLEMENTED · SensorModel reflectance:", error)
        return
    print("PASS · SensorModel: reset and update preserve reflectance")


check_reflectance_preservation()

# Exercise the student file directly, independently of the Run selector.
from line_follower import LineFollower
from robot_config import LINE_FOLLOWER_SETTINGS
from ucsb_xrp import MotionCommand, ReflectanceReadings

def check_line_follower():
    follower = LineFollower(LINE_FOLLOWER_SETTINGS)
    try:
        follower.reset()
        centered = follower.update(ReflectanceReadings(0.6, 0.6), 0.02)
        left = follower.update(ReflectanceReadings(0.8, 0.2), 0.04)
        follower.reset()
        right = follower.update(ReflectanceReadings(0.2, 0.8), 0.04)
        for command in (centered, left, right):
            assert isinstance(command, MotionCommand), "update must return MotionCommand"
            assert 0 <= command.forward_speed_mm_s <= LINE_FOLLOWER_SETTINGS["cruise_speed_mm_s"], "forward speed is outside its bounds"
            assert abs(command.turn_rate_rad_s) <= LINE_FOLLOWER_SETTINGS["maximum_turn_rate_rad_s"], "turn rate is outside its bounds"
        assert centered.turn_rate_rad_s == 0, "equal readings must request no turn after reset"
        assert left.turn_rate_rad_s > 0 and right.turn_rate_rad_s < 0, "turn toward the darker sensor"
        follower.reset()
        assert follower.update(ReflectanceReadings(0.6, 0.6), 0.02).turn_rate_rad_s == 0, "reset must clear controller history"
    except NotImplementedError as error:
        print("NOT IMPLEMENTED · LineFollower:", error)
        return
    except (AssertionError, ValueError, TypeError) as error:
        print("FAIL · LineFollower:", error)
        raise AssertionError("LineFollower student checks failed")
    print("PASS · LineFollower: student centered, left, right, bounds and reset examples")

check_line_follower()
