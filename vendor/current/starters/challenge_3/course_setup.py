"""Select components and assemble the Challenge 3 robot and navigator."""

import student_components as student
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    NavigationController,
    Odometry,
    SensorModel,
    WheelSpeedController,
)


USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False


def _selected(flag, student_class, supplied_class):
    return student_class if flag else supplied_class


def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        _selected(USE_STUDENT_SENSOR_MODEL, student.SensorModel, SensorModel)(config),
        _selected(
            USE_STUDENT_WHEEL_SPEED_CONTROLLER,
            student.WheelSpeedController,
            WheelSpeedController,
        )(config),
        _selected(
            USE_STUDENT_DIFFERENTIAL_DRIVE,
            student.DifferentialDrive,
            DifferentialDrive,
        )(config),
        _selected(USE_STUDENT_ODOMETRY, student.Odometry, Odometry)(config),
    )


def make_navigation_controller(config):
    return _selected(
        USE_STUDENT_NAVIGATION_CONTROLLER,
        student.NavigationController,
        NavigationController,
    )(config)
