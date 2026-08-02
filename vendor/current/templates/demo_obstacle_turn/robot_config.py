# Measured robot and controller settings for the obstacle-turn demo.

from ucsb_xrp import RobotConfig


ROBOT_CONFIG = RobotConfig(
    left_start_effort=0.12,
    right_start_effort=0.13,
    left_speed_effort_gain=0.0031,
    right_speed_effort_gain=0.0031,
    wheel_speed_kp=0.001,
    max_effort=0.45,
)
