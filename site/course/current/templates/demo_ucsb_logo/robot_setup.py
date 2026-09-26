# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import NavigationConfig, RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Start effort offsets deadband; speed gain is feedforward and kp corrects error.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.65,
)
# Route speeds and goal tolerances use mm, mm/s, and radians.
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=150.0,
    approach_speed_mm_s=120.0,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=1.3,
    position_tolerance_mm=18.0,
    heading_tolerance_rad=0.08,
    realign_heading_rad=0.25,
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
