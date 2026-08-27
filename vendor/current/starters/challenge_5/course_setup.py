"""Choose one implementation of each component and assemble Challenge 5."""

from differential_drive import DifferentialDrive as StudentDifferentialDrive
from grid_planner import GridPlanner as StudentGridPlanner
from navigation_controller import (
    NavigationController as StudentNavigationController,
)
from odometry import Odometry as StudentOdometry
from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    GridPlanner as SuppliedGridPlanner,
    NavigationController as SuppliedNavigationController,
    Odometry as SuppliedOdometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelSpeedController,
)
from wheel_speed_controller import (
    WheelSpeedController as StudentWheelSpeedController,
)


# False selects the supplied class. Change one flag to True only after
# the matching student class passes the Test components examples.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False
USE_STUDENT_GRID_PLANNER = False


def make_sensor_model(config):
    if USE_STUDENT_SENSOR_MODEL:
        return StudentSensorModel(config)
    return SuppliedSensorModel(config)


def make_wheel_speed_controller(config):
    if USE_STUDENT_WHEEL_SPEED_CONTROLLER:
        return StudentWheelSpeedController(config)
    return SuppliedWheelSpeedController(config)


def make_differential_drive(config):
    if USE_STUDENT_DIFFERENTIAL_DRIVE:
        return StudentDifferentialDrive(config)
    return SuppliedDifferentialDrive(config)


def make_odometry(config):
    if USE_STUDENT_ODOMETRY:
        return StudentOdometry(config)
    return SuppliedOdometry(config)


def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        make_sensor_model(config),
        make_wheel_speed_controller(config),
        make_differential_drive(config),
        make_odometry(config),
    )


def make_navigation_controller(config):
    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)


def make_grid_planner():
    if USE_STUDENT_GRID_PLANNER:
        return StudentGridPlanner()
    return SuppliedGridPlanner()
