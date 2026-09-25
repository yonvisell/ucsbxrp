# Robot and navigation settings shared by Challenge 4 programs.

from live_variables import CRUISE_SPEED, DEFAULT_CRUISE_SPEED_MM_S, DEFAULT_TURN_RATE_RAD_S, TURN_RATE
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
    cruise_speed_mm_s=DEFAULT_CRUISE_SPEED_MM_S,
    approach_speed_mm_s=0.8 * DEFAULT_CRUISE_SPEED_MM_S,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=DEFAULT_TURN_RATE_RAD_S,
    position_tolerance_mm=12.0,
    heading_tolerance_rad=0.08,
    realign_heading_rad=0.25,
)

# Live controls are applied after each Robot sample, without resetting route progress.
# Input: active NavigationController; effect: update changed motion settings.
def apply_navigation_controls(navigation):
    current = navigation.config
    cruise_speed_mm_s = CRUISE_SPEED.value
    turn_rate_rad_s = TURN_RATE.value
    if (
        current.cruise_speed_mm_s == cruise_speed_mm_s
        and current.turn_rate_rad_s == turn_rate_rad_s
    ):
        return
    navigation.set_config(NavigationConfig(
        cruise_speed_mm_s=cruise_speed_mm_s,
        approach_speed_mm_s=0.8 * cruise_speed_mm_s,
        slowdown_distance_mm=current.slowdown_distance_mm,
        turn_rate_rad_s=turn_rate_rad_s,
        position_tolerance_mm=current.position_tolerance_mm,
        heading_tolerance_rad=current.heading_tolerance_rad,
        realign_heading_rad=current.realign_heading_rad,
    ))
