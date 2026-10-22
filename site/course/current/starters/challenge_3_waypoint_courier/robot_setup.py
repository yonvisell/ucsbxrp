# Robot calibration, component selection, and assembly for this project.

from live_variables import (
    CRUISE_SPEED,
    DEFAULT_CRUISE_SPEED_MM_S,
    DEFAULT_TURN_RATE_RAD_S,
    TURN_RATE,
)
from ucsb_xrp import NavigationConfig, RobotConfig, Robot, XRPBot

# Robot dimensions and supplied wheel-controller settings.
# Supplied motor settings for Virtual XRP; use the instructor's settings for a physical XRP.
# Measure wheel diameter and track width in mm; use specified encoder counts.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    wheel_diameter_mm=60.0,  # Rolling wheel diameter in mm; measure on the physical robot.
    encoder_counts_per_revolution=585.0,  # Encoder counts for one wheel revolution.
    track_width_mm=155.0,  # Effective left-to-right wheel separation in mm.
    left_start_command=0.12,  # Supplied left-wheel starting command; dimensionless.
    right_start_command=0.13,  # Supplied right-wheel starting command; dimensionless.
    left_speed_command_gain=0.0031,  # Supplied left command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Supplied right command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # Supplied correction per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Reserved accumulated-error coefficient (1/mm); keep zero.
    wheel_speed_kd=0.0,  # Reserved error-rate coefficient (s^2/mm); keep zero.
    max_drive_command=0.55,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=DEFAULT_CRUISE_SPEED_MM_S,  # Requested forward speed outside the slowdown radius, mm/s.
    approach_speed_mm_s=0.8 * DEFAULT_CRUISE_SPEED_MM_S,  # Requested forward speed within the slowdown radius, mm/s.
    slowdown_distance_mm=120.0,  # Goal-distance threshold for selecting approach speed, mm.
    turn_rate_rad_s=DEFAULT_TURN_RATE_RAD_S,  # Maximum absolute rotation rate during alignment and steering, rad/s.
    position_tolerance_mm=12.0,  # Accept goal position within this estimated-distance radius, mm.
    heading_tolerance_rad=0.08,  # Accept initial alignment or requested final heading within this error, rad.
    realign_heading_rad=0.25,  # Return to turning in place when driving heading error reaches this value, rad.
)

# Supplied component classes. Wheel-speed control always uses this library class.
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    NavigationController as SuppliedNavigationController,
    Odometry as SuppliedOdometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_PROCESSOR = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False


# Create the robot and its sensing, drive, and odometry components.
def make_robot(config):
    from differential_drive import DifferentialDrive as StudentDifferentialDrive
    from odometry import Odometry as StudentOdometry
    from sensor_processor import SensorProcessor as StudentSensorProcessor

    SensorProcessor = StudentSensorProcessor if USE_STUDENT_SENSOR_PROCESSOR else SuppliedSensorProcessor
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
