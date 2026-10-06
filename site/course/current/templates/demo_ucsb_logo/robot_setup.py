# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import NavigationConfig, RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Starting command overcomes friction; speed gain requests steady speed; kp corrects speed error.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=10,  # Scheduled sample interval in ms; 10 ms gives 100 Hz.
    left_start_command=0.12,  # Left-wheel starting command; dimensionless, measured under load.
    right_start_command=0.13,  # Right-wheel starting command; dimensionless, measured under load.
    left_speed_command_gain=0.0031,  # Left feedforward command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Right feedforward command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # P gain: command per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Accumulated-error coefficient (1/mm); supplied controller does not use it.
    wheel_speed_kd=0.0,  # Error-rate coefficient (s^2/mm); supplied controller does not use it.
    max_drive_command=0.65,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)
# Route speeds and goal tolerances use mm, mm/s, and radians.
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=150.0,  # Requested forward speed outside the slowdown radius, mm/s.
    approach_speed_mm_s=120.0,  # Requested forward speed within the slowdown radius, mm/s.
    slowdown_distance_mm=120.0,  # Goal-distance threshold for selecting approach speed, mm.
    turn_rate_rad_s=1.3,  # Maximum absolute rotation rate during alignment and steering, rad/s.
    position_tolerance_mm=18.0,  # Accept goal position within this estimated-distance radius, mm.
    heading_tolerance_rad=0.08,  # Accept initial alignment or requested final heading within this error, rad.
    realign_heading_rad=0.25,  # Return to turning in place when driving heading error reaches this value, rad.
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    NavigationController,
    Odometry,
    SensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# Pass one config to hardware conversion, sensing, wheel control, and odometry.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )


# Route decisions use the independently selected navigation class.
def make_navigation_controller(config):
    return NavigationController(config)
