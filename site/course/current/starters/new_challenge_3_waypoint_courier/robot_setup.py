# Robot calibration, component selection, and assembly for this project.

from live_variables import (
    CRUISE_SPEED,
    DEFAULT_CRUISE_SPEED_MM_S,
    DEFAULT_TURN_RATE_RAD_S,
    TURN_RATE,
)
from ucsb_xrp import NavigationConfig, RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Example motor settings; use measured calibration values for the physical XRP.
# Measure wheel diameter and track width in mm; use specified encoder counts.
ROBOT_CONFIG = RobotConfig(
    wheel_diameter_mm=60.0,
    encoder_counts_per_revolution=585.0,
    track_width_mm=155.0,
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=DEFAULT_CRUISE_SPEED_MM_S,
    approach_speed_mm_s=0.8 * DEFAULT_CRUISE_SPEED_MM_S,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=DEFAULT_TURN_RATE_RAD_S,
    position_tolerance_mm=12.0,
    heading_tolerance_rad=0.08,
    realign_heading_rad=0.25,
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    NavigationController as SuppliedNavigationController,
    Odometry as SuppliedOdometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController as SuppliedWheelSpeedController,
)

# Select and construct project components.
# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_PROCESSOR = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False


# Create the robot and its sensing, drive, and odometry components.
def make_robot(config):
    from differential_drive import DifferentialDrive as StudentDifferentialDrive
    from odometry import Odometry as StudentOdometry
    from sensor_processor import SensorProcessor as StudentSensorProcessor
    from wheel_speed_controller import WheelSpeedController as StudentWheelSpeedController

    SensorProcessor = StudentSensorProcessor if USE_STUDENT_SENSOR_PROCESSOR else SuppliedSensorProcessor
    WheelSpeedController = StudentWheelSpeedController if USE_STUDENT_WHEEL_SPEED_CONTROLLER else SuppliedWheelSpeedController
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive
    Odometry = StudentOdometry if USE_STUDENT_ODOMETRY else SuppliedOdometry
    return Robot(config, XRPBot(config), SensorProcessor(config), WheelSpeedController(config), DifferentialDrive(config), Odometry(config))


# Create the selected navigation controller.
def make_navigation_controller(config):
    from navigation_controller import NavigationController as StudentNavigationController

    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)

# Apply Monitor controls to the active controller.
# Apply slider settings without restarting the route.
def apply_navigation_controls(navigation):
    current = navigation.config
    cruise_speed_mm_s = CRUISE_SPEED.value  # Read the cruise-speed slider.
    turn_rate_rad_s = TURN_RATE.value  # Read the turn-rate slider.
    if (
        current.cruise_speed_mm_s == cruise_speed_mm_s
        and current.turn_rate_rad_s == turn_rate_rad_s
    ):
        return  # Neither slider changed.
    navigation.set_config(NavigationConfig(
        cruise_speed_mm_s=cruise_speed_mm_s,
        approach_speed_mm_s=0.8 * cruise_speed_mm_s,
        slowdown_distance_mm=current.slowdown_distance_mm,
        turn_rate_rad_s=turn_rate_rad_s,
        position_tolerance_mm=current.position_tolerance_mm,
        heading_tolerance_rad=current.heading_tolerance_rad,
        realign_heading_rad=current.realign_heading_rad,
    ))
