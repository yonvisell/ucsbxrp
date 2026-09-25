# Settings shared by Challenge 1 programs for one XRP robot.

from ucsb_xrp import RobotConfig


# Example virtual settings; measure these quantities for a physical XRP.
# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.00315,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)
