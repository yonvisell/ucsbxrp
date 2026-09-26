from live_variables import CRUISE_SPEED, DEFAULT_CRUISE_SPEED_MM_S, DEFAULT_P_GAIN_RAD_S, P_GAIN
from ucsb_xrp import RobotConfig


# Example motor settings; use measured calibration values for the physical XRP.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)

# The supplied defaults use PD. Set ki = kd = 0 for a P-only comparison.
LINE_FOLLOWER_SETTINGS = {
    "cruise_speed_mm_s": DEFAULT_CRUISE_SPEED_MM_S,
    "minimum_speed_mm_s": 45.0,
    "kp_rad_s": DEFAULT_P_GAIN_RAD_S,
    "ki_rad_s2": 0.0,
    "kd_rad": 0.025,
    "integral_limit_s": 0.5,
    "maximum_turn_rate_rad_s": 1.4,
    "turn_slowdown": 0.45,
}

# Copy the current slider settings into the line controller.
def apply_line_controls(follower):
    follower.settings["cruise_speed_mm_s"] = CRUISE_SPEED.value
    follower.settings["kp_rad_s"] = P_GAIN.value

# Reflectance: 0 = light floor, 1 = dark tape. Tune thresholds using floor/tape readings.
LINE_VISIBLE_THRESHOLD = 0.12  # Minimum reading at either sensor to detect the line.
FINISH_THRESHOLD = 0.80  # Minimum reading at both sensors to detect the finish bar.
FINISH_CONFIRM_SAMPLES = 4  # Consecutive finish-bar readings required.
