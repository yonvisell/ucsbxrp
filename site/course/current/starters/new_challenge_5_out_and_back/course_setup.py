# Choose one implementation of each component and assemble Challenge 5.

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


# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False
USE_STUDENT_GRID_PLANNER = False


def make_robot(config):
    SensorModel = StudentSensorModel if USE_STUDENT_SENSOR_MODEL else SuppliedSensorModel
    WheelSpeedController = StudentWheelSpeedController if USE_STUDENT_WHEEL_SPEED_CONTROLLER else SuppliedWheelSpeedController
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive
    Odometry = StudentOdometry if USE_STUDENT_ODOMETRY else SuppliedOdometry
    return Robot(config, XRPBot(config), SensorModel(config), WheelSpeedController(config), DifferentialDrive(config), Odometry(config))


def make_navigation_controller(config):
    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)


def make_grid_planner():
    if USE_STUDENT_GRID_PLANNER:
        return StudentGridPlanner()
    return SuppliedGridPlanner()
