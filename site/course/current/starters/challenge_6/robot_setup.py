# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import NavigationConfig, RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
# Route speeds and goal tolerances use mm, mm/s, and radians.
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=150.0,
    approach_speed_mm_s=120.0,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=0.8,
    position_tolerance_mm=12.0,
    heading_tolerance_rad=0.08,
    realign_heading_rad=0.25,
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    GridPlanner as SuppliedGridPlanner,
    NavigationController as SuppliedNavigationController,
    Odometry as SuppliedOdometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController as SuppliedWheelSpeedController,
)
from ucsb_xrp_reference.challenge_6 import (
    RangeSafetyController as SuppliedRangeSafetyController,
)

# Select and construct project components.
# False selects the supplied class. Change one flag to True only after
# the matching class in this project passes the Test components examples.
USE_STUDENT_SENSOR_PROCESSOR = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False
USE_STUDENT_GRID_PLANNER = False
USE_STUDENT_RANGE_SAFETY_CONTROLLER = False


def make_sensor_processor(config):
    from sensor_processor import SensorProcessor as StudentSensorProcessor

    if USE_STUDENT_SENSOR_PROCESSOR:
        return StudentSensorProcessor(config)
    return SuppliedSensorProcessor(config)


def make_wheel_speed_controller(config):
    from wheel_speed_controller import WheelSpeedController as StudentWheelSpeedController

    if USE_STUDENT_WHEEL_SPEED_CONTROLLER:
        return StudentWheelSpeedController(config)
    return SuppliedWheelSpeedController(config)


def make_differential_drive(config):
    from differential_drive import DifferentialDrive as StudentDifferentialDrive

    if USE_STUDENT_DIFFERENTIAL_DRIVE:
        return StudentDifferentialDrive(config)
    return SuppliedDifferentialDrive(config)


def make_odometry(config):
    from odometry import Odometry as StudentOdometry

    if USE_STUDENT_ODOMETRY:
        return StudentOdometry(config)
    return SuppliedOdometry(config)


# Build Robot from the selected sensor, feedback, drive, and odometry classes.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        make_sensor_processor(config),
        make_wheel_speed_controller(config),
        make_differential_drive(config),
        make_odometry(config),
    )


# Route decisions use the independently selected navigation class.
def make_navigation_controller(config):
    from navigation_controller import NavigationController as StudentNavigationController

    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)


# Grid planning is selected independently of the moving robot.
def make_grid_planner():
    from grid_planner import GridPlanner as StudentGridPlanner

    if USE_STUDENT_GRID_PLANNER:
        return StudentGridPlanner()
    return SuppliedGridPlanner()


def make_range_safety_controller(*settings):
    from range_safety_controller import (
        RangeSafetyController as StudentRangeSafetyController,
    )

    if USE_STUDENT_RANGE_SAFETY_CONTROLLER:
        return StudentRangeSafetyController(*settings)
    return SuppliedRangeSafetyController(*settings)
