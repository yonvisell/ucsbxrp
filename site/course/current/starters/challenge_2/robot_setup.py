# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import NavigationConfig, RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    left_start_command=0.12,  # Left-wheel starting command; dimensionless, measured under load.
    right_start_command=0.13,  # Right-wheel starting command; dimensionless, measured under load.
    left_speed_command_gain=0.0031,  # Left feedforward command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Right feedforward command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # P gain: command per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Accumulated-error coefficient (1/mm); supplied controller does not use it.
    wheel_speed_kd=0.0,  # Error-rate coefficient (s^2/mm); supplied controller does not use it.
    max_drive_command=0.55,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# Route speeds and goal tolerances use mm, mm/s, and radians.
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=150.0,  # Requested forward speed outside the slowdown radius, mm/s.
    approach_speed_mm_s=120.0,  # Requested forward speed within the slowdown radius, mm/s.
    slowdown_distance_mm=120.0,  # Goal-distance threshold for selecting approach speed, mm.
    turn_rate_rad_s=0.8,  # Maximum absolute rotation rate during alignment and steering, rad/s.
    position_tolerance_mm=12.0,  # Accept goal position within this estimated-distance radius, mm.
    heading_tolerance_rad=0.08,  # Accept initial alignment or requested final heading within this error, rad.
    realign_heading_rad=0.25,  # Return to turning in place when driving heading error reaches this value, rad.
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    Odometry as SuppliedOdometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController as SuppliedWheelSpeedController,
)

# Select and construct project components.
# False selects the supplied class. Change one flag to True only after
# the matching class in this project passes the Test components examples.
USE_STUDENT_SENSOR_PROCESSOR = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False


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
