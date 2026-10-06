# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=10,  # Scheduled sample interval in ms; 10 ms gives 100 Hz.
    left_start_command=0.12,  # Left-wheel starting command; dimensionless, measured under load.
    right_start_command=0.13,  # Right-wheel starting command; dimensionless, measured under load.
    left_speed_command_gain=0.0031,  # Left feedforward command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Right feedforward command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # P gain: command per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Accumulated-error coefficient (1/mm); supplied controller does not use it.
    wheel_speed_kd=0.0,  # Error-rate coefficient (s^2/mm); supplied controller does not use it.
    max_drive_command=0.55,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# The defaults use sensor error and its change rate. Set ki_rad_s2 and kd_rad to zero to compare steering from current error alone.
# Steering limits and gains are read by LineFollower on each sample.
LINE_FOLLOWER_SETTINGS = {
    "cruise_speed_mm_s": 100.0,  # Requested forward speed with zero steering correction, mm/s.
    "minimum_speed_mm_s": 45.0,  # Minimum forward-speed request after steering slowdown, mm/s.
    "kp_rad_s": 1.8,  # Turn-rate correction per unit left-minus-right reflectance error (rad/s).
    "ki_rad_s2": 0.0,  # Coefficient (rad/s^2) for reflectance error accumulated over time (s).
    "kd_rad": 0.025,  # Coefficient (rad) for the change rate of reflectance error (1/s).
    "integral_limit_s": 0.5,  # Maximum absolute accumulated reflectance error, seconds.
    "maximum_turn_rate_rad_s": 1.4,  # Maximum absolute steering rate, rad/s.
    "turn_slowdown": 0.45,  # Fraction of cruise speed removed at maximum steering rate; dimensionless.
}

# Physical values depend on the floor, tape, sensor height, and ambient light.
LINE_VISIBLE_THRESHOLD = 0.12  # Minimum dimensionless reading at either sensor to detect the line.
FINISH_THRESHOLD = 0.80  # Minimum dimensionless reading at both sensors to detect the finish bar.
FINISH_CONFIRM_TIME_S = 0.08  # Continuous finish-bar detection time after all checkpoints, seconds.

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorProcessor,
    WheelSpeedController,
)
from ucsb_xrp_reference.challenge_9 import LineFollower as SuppliedLineFollower

# Select and construct project components.
USE_STUDENT_LINE_FOLLOWER = False


# Wheel and odometry components remain supplied; line steering is selected below.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )


# Local line steering is selected independently of wheel-speed control.
def make_line_follower(settings):
    from line_follower import LineFollower as StudentLineFollower

    if USE_STUDENT_LINE_FOLLOWER:
        return StudentLineFollower(settings)
    return SuppliedLineFollower(settings)
