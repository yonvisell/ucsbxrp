from ucsb_xrp import RobotConfig


ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)

# Start with P control (ki = kd = 0), then compare PD or PID experimentally.
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
