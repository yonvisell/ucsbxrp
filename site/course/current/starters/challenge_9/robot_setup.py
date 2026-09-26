# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import RobotConfig, Robot, XRPBot

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

# The supplied defaults use PD. Set ki = kd = 0 for a P-only comparison.
# Steering limits and gains are read by LineFollower on each sample.
LINE_FOLLOWER_SETTINGS = {
    "cruise_speed_mm_s": 100.0,
    "minimum_speed_mm_s": 45.0,
    "kp_rad_s": 1.8,
    "ki_rad_s2": 0.0,
    "kd_rad": 0.025,
    "integral_limit_s": 0.5,
    "maximum_turn_rate_rad_s": 1.4,
    "turn_slowdown": 0.45,
}

# Physical values depend on the floor, tape, sensor height, and ambient light.
LINE_VISIBLE_THRESHOLD = 0.12
FINISH_THRESHOLD = 0.80
FINISH_CONFIRM_SAMPLES = 4

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
