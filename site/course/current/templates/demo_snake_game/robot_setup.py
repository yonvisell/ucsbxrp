# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import NavigationConfig, RobotConfig, Robot, XRPBot
from snake_config import CONFIG

# Robot calibration and controller settings.
# Start effort offsets deadband; speed gain is feedforward and kp corrects error.
ROBOT_CONFIG = RobotConfig(**CONFIG["robot"])


def navigation_config_for_speed(speed_mm_s):
    # Retain most of the requested cruise speed near each food position.
    settings = CONFIG["navigation"]
    return NavigationConfig(
        cruise_speed_mm_s=speed_mm_s,
        approach_speed_mm_s=settings["approach_fraction"] * speed_mm_s,
        slowdown_distance_mm=settings["slowdown_distance_mm"],
        turn_rate_rad_s=settings["turn_rate_rad_s"],
        position_tolerance_mm=settings["position_tolerance_mm"],
        heading_tolerance_rad=settings["heading_tolerance_rad"],
        realign_heading_rad=settings["realign_heading_rad"],
    )


NAVIGATION_CONFIG = navigation_config_for_speed(CONFIG["controls"]["speed_mm_s"]["default"])

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
