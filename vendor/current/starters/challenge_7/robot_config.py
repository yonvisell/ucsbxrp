# Robot and navigation settings shared by Challenge 7 programs.

from ucsb_xrp import NavigationConfig, RobotConfig


ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=120.0,
    approach_speed_mm_s=55.0,
    slowdown_distance_mm=180.0,
    turn_rate_rad_s=0.7,
    position_tolerance_mm=15.0,
    heading_tolerance_rad=0.07,
    realign_heading_rad=0.25,
)
