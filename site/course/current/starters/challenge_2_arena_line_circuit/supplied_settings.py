# Supplied target configuration, waypoint detection and sensor calibration.
# Student measurements and steering parameters are in settings.py.
from sys import platform
from settings import (
    LEFT_START_COMMAND, RIGHT_START_COMMAND,
    LEFT_SPEED_COMMAND_GAIN, RIGHT_SPEED_COMMAND_GAIN,
    LEFT_FLOOR_REFLECTANCE, RIGHT_FLOOR_REFLECTANCE,
    LEFT_LINE_VISIBLE_THRESHOLD, RIGHT_LINE_VISIBLE_THRESHOLD,
)
from ucsb_xrp import ReflectanceReadings, RobotConfig

IS_PHYSICAL_XRP = platform == "rp2"
SAMPLE_PERIOD_MS = 20  # Schedule one control sample every 20 ms (50 Hz).

PHYSICAL_ROBOT_SETTINGS = dict(
    left_start_command=LEFT_START_COMMAND,
    right_start_command=RIGHT_START_COMMAND,
    left_speed_command_gain=LEFT_SPEED_COMMAND_GAIN,
    right_speed_command_gain=RIGHT_SPEED_COMMAND_GAIN,
    wheel_speed_kp=0.001,
    wheel_speed_ki=0.0,
    wheel_speed_kd=0.0,
    max_drive_command=1.0,  # Reduce this value if instructed by the instructor.
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
    max_drive_command=1.0,  # Reduce this value if instructed by the instructor.
)

WAYPOINT_DARK_THRESHOLD = 0.80  # Count a bar when both raw sensor readings reach this value.
WAYPOINT_CLEAR_THRESHOLD = 0.60
WAYPOINT_CONFIRM_TIME_S = 0.04  # Require this time off a bar before counting the next one [s].
WAYPOINT_TARGET = 6  # Number of crossings, including start and finish.
VIRTUAL_LINE_VISIBLE_THRESHOLD = 0.12
INTEGRAL_LIMIT_S = 0.5  # Limit accumulated reflectance error [s].


def make_robot_config(dimensions):
    values = dict(dimensions)
    values.update(PHYSICAL_ROBOT_SETTINGS if IS_PHYSICAL_XRP else VIRTUAL_ROBOT_SETTINGS)
    return RobotConfig(**values)


def line_is_visible(readings):
    if min(readings.left, readings.right) >= WAYPOINT_DARK_THRESHOLD:
        return True  # Keep driving across bars regardless of the ordinary-line thresholds.
    if not IS_PHYSICAL_XRP:
        return max(readings.left, readings.right) >= VIRTUAL_LINE_VISIBLE_THRESHOLD
    return (readings.left >= LEFT_LINE_VISIBLE_THRESHOLD
            or readings.right >= RIGHT_LINE_VISIBLE_THRESHOLD)


def calibrated_reflectance(readings):
    if not IS_PHYSICAL_XRP:
        return readings  # Use virtual readings unchanged.
    if min(readings.left, readings.right) >= WAYPOINT_DARK_THRESHOLD:
        return readings  # Keep both-dark bar readings unchanged.
    left = (readings.left - LEFT_FLOOR_REFLECTANCE) / (1.0 - LEFT_FLOOR_REFLECTANCE)
    right = (readings.right - RIGHT_FLOOR_REFLECTANCE) / (1.0 - RIGHT_FLOOR_REFLECTANCE)
    return ReflectanceReadings(max(0.0, min(1.0, left)), max(0.0, min(1.0, right)))
