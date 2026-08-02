"""Select supplied or student Challenge 1 components."""

from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelController,
)
from wheel_speed_controller import WheelSpeedController as StudentWheelController


# Change one flag only after its student component passes software tests.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False


def make_sensor_model(config):
    if USE_STUDENT_SENSOR_MODEL:
        return StudentSensorModel(config)
    return SuppliedSensorModel(config)


def make_wheel_speed_controller(config):
    if USE_STUDENT_WHEEL_SPEED_CONTROLLER:
        return StudentWheelController(config)
    return SuppliedWheelController(config)


def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        make_sensor_model(config),
        make_wheel_speed_controller(config),
        DifferentialDrive(config),
        Odometry(config),
    )
