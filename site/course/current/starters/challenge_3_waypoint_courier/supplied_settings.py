# Supplied timing, wheel feedback, and separate physical/virtual target profiles.
# Put physical measurements and navigation settings in settings.py.
from sys import platform
from settings import (
    LEFT_START_COMMAND, RIGHT_START_COMMAND,
    LEFT_SPEED_COMMAND_GAIN, RIGHT_SPEED_COMMAND_GAIN,
)
from ucsb_xrp import RobotConfig

IS_PHYSICAL_XRP = platform == "rp2"
SAMPLE_PERIOD_MS = 20  # Scheduled encoder/control interval [ms], independent of camera rate.
# Optional virtual experiments; physical timing is supplied by the camera service.
VIRTUAL_GPS_LATENCY_MS = 100
VIRTUAL_GPS_DROPOUT_START_MS = -1  # -1 disables the deliberate dropout.
VIRTUAL_GPS_DROPOUT_DURATION_MS = 0

PHYSICAL_ROBOT_SETTINGS = dict(
    left_start_command=LEFT_START_COMMAND,
    right_start_command=RIGHT_START_COMMAND,
    left_speed_command_gain=LEFT_SPEED_COMMAND_GAIN,
    right_speed_command_gain=RIGHT_SPEED_COMMAND_GAIN,
    wheel_speed_kp=0.001,
    wheel_speed_ki=0.0,
    wheel_speed_kd=0.0,
    max_drive_command=0.55,
)
VIRTUAL_ROBOT_SETTINGS = dict(
    wheel_diameter_mm=60.0,
    encoder_counts_per_revolution=585.0,
    track_width_mm=155.0,
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    wheel_speed_ki=0.0,
    wheel_speed_kd=0.0,
    max_drive_command=0.55,
)


def make_robot_config(dimensions):
    values = dict(dimensions)
    values.update(PHYSICAL_ROBOT_SETTINGS if IS_PHYSICAL_XRP else VIRTUAL_ROBOT_SETTINGS)
    return RobotConfig(**values)
