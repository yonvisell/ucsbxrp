# Nominal settings shared by the virtual and physical XRP targets.

from ucsb_xrp import RobotConfig


# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
