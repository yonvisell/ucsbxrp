"""Settings shared by Challenge 1 programs for one XRP robot."""

from ucsb_xrp import NavigationConfig, RobotConfig


# The no-argument configuration has nominal geometry but max_effort == 0.
# It is safe for software and sensor checks; it is not a motor calibration.
ROBOT_CONFIG = RobotConfig()

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
