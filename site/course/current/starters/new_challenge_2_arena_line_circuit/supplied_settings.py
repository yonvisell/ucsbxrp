# Supplied calibration and operating limits. No student adjustment needed.
# Starting command (motor deadband) and speed-command gain (slope) are independent.
from sys import platform
from ucsb_xrp import ReflectanceReadings, RobotConfig

IS_PHYSICAL_XRP = platform == "rp2"

# Generic physical defaults, not a measurement of this robot or floor.
PHYSICAL_ROBOT_SETTINGS = dict(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0025,  # Command per requested mm/s, s/mm.
    right_speed_command_gain=0.0025,
    wheel_speed_kp=0.001,
    wheel_speed_ki=0.0,  # Reserved; supplied wheel control uses proportional feedback.
    wheel_speed_kd=0.0,
    max_drive_command=1.0,
)
VIRTUAL_ROBOT_SETTINGS = dict(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    wheel_speed_ki=0.0,
    wheel_speed_kd=0.0,
    max_drive_command=0.55,
)

LEFT_FLOOR_REFLECTANCE = 0.0  # Physical light-floor reading; 0 keeps raw values.
RIGHT_FLOOR_REFLECTANCE = 0.0
WAYPOINT_DARK_THRESHOLD = 0.80  # Raw reflectance, 0 light to 1 dark.
WAYPOINT_CLEAR_THRESHOLD = 0.60
WAYPOINT_CONFIRM_TIME_S = 0.04  # Continuous clear time required to rearm, s.
WAYPOINT_TARGET = 6  # Start, four intermediate bars, finish.
LINE_VISIBLE_THRESHOLD = 0.12
MINIMUM_SPEED_MM_S = 45.0  # Never overrides a lower cruise request.
INTEGRAL_LIMIT_S = 0.5
MAXIMUM_TURN_RATE_RAD_S = 1.4
TURN_SLOWDOWN = 0.45  # Fraction of cruise removed at the maximum turn rate.


def make_robot_config(dimensions):
    values = dict(dimensions)
    values.update(PHYSICAL_ROBOT_SETTINGS if IS_PHYSICAL_XRP else VIRTUAL_ROBOT_SETTINGS)
    return RobotConfig(**values)


def calibrated_reflectance(readings):
    if not IS_PHYSICAL_XRP:
        return readings  # Physical floor calibration never changes virtual readings.
    if min(readings.left, readings.right) >= WAYPOINT_DARK_THRESHOLD:
        return readings  # Preserve the raw both-dark indication across a tape bar.
    left = (readings.left - LEFT_FLOOR_REFLECTANCE) / (1.0 - LEFT_FLOOR_REFLECTANCE)
    right = (readings.right - RIGHT_FLOOR_REFLECTANCE) / (1.0 - RIGHT_FLOOR_REFLECTANCE)
    return ReflectanceReadings(max(0.0, min(1.0, left)), max(0.0, min(1.0, right)))
