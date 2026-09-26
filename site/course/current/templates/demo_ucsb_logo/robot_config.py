# Nominal robot and navigation settings for the UCSB route.

from ucsb_xrp import NavigationConfig, RobotConfig


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
