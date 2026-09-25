# Robot calibration and navigation settings for SnakeGame.

from ucsb_xrp import NavigationConfig, RobotConfig
from snake_config import CONFIG


# Wheel geometry and motor-command calibration must describe this robot.
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
