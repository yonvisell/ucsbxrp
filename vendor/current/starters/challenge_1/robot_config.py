# Settings shared by Challenge 1 programs for one XRP robot.

from ucsb_xrp import NavigationConfig, RobotConfig


# Nominal values match the virtual XRP. Tune signs and gains from measurements
# when a physical course robot differs.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)

# These named values make units visible and can be tuned from measured runs.
STRAIGHT_CONFIG = NavigationConfig(
    cruise_speed_mm_s=150.0,
    approach_speed_mm_s=60.0,
    slowdown_distance_mm=200.0,
    turn_rate_rad_s=1.0,
    position_tolerance_mm=10.0,
    heading_tolerance_rad=0.08,
    realign_heading_rad=0.25,
)
