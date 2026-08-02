"""Select supplied or student components and assemble the Challenge 2 robot."""

from student_components import (
    DifferentialDrive as StudentDifferentialDrive,
    Odometry as StudentOdometry,
    SensorModel as StudentSensorModel,
    WheelSpeedController as StudentWheelSpeedController,
)
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    Odometry as SuppliedOdometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelSpeedController,
)


USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False


def _selected(flag, student, supplied):
    return student if flag else supplied


def make_robot(config):
    sensor_model = _selected(
        USE_STUDENT_SENSOR_MODEL, StudentSensorModel, SuppliedSensorModel
    )(config)
    wheel_controller = _selected(
        USE_STUDENT_WHEEL_SPEED_CONTROLLER,
        StudentWheelSpeedController,
        SuppliedWheelSpeedController,
    )(config)
    differential_drive = _selected(
        USE_STUDENT_DIFFERENTIAL_DRIVE,
        StudentDifferentialDrive,
        SuppliedDifferentialDrive,
    )(config)
    odometry = _selected(USE_STUDENT_ODOMETRY, StudentOdometry, SuppliedOdometry)(
        config
    )
    return Robot(
        config,
        XRPBot(config),
        sensor_model,
        wheel_controller,
        differential_drive,
        odometry,
    )
