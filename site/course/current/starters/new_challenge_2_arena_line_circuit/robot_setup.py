# Robot calibration, component selection, and assembly for this project.

from live_variables import (
    CRUISE_SPEED,
    DEFAULT_CRUISE_SPEED_MM_S,
    DEFAULT_P_GAIN_RAD_S,
    P_GAIN,
)
from ucsb_xrp import RobotConfig, Robot, XRPBot

# Robot dimensions and supplied wheel-controller settings.
# Supplied motor settings for Virtual XRP; use the instructor's settings for a physical XRP.
# Measure wheel diameter and track width in mm; use specified encoder counts.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms gives 50 Hz.
    wheel_diameter_mm=60.0,  # Rolling wheel diameter in mm; measure on the physical robot.
    encoder_counts_per_revolution=585.0,  # Encoder counts for one wheel revolution.
    track_width_mm=155.0,  # Effective left-to-right wheel separation in mm.
    left_start_command=0.12,  # Supplied left-wheel starting command; dimensionless.
    right_start_command=0.13,  # Supplied right-wheel starting command; dimensionless.
    left_speed_command_gain=0.0031,  # Supplied left command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Supplied right command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # Supplied correction per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Reserved accumulated-error coefficient (1/mm); keep zero.
    wheel_speed_kd=0.0,  # Reserved error-rate coefficient (s^2/mm); keep zero.
    max_drive_command=0.55,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# The defaults use sensor error and its change rate. Set ki_rad_s2 and kd_rad to zero to compare steering from current error alone.
LINE_FOLLOWER_SETTINGS = {
    "cruise_speed_mm_s": DEFAULT_CRUISE_SPEED_MM_S,  # Requested forward speed with zero steering correction, mm/s.
    "minimum_speed_mm_s": 45.0,  # Minimum forward-speed request after steering slowdown, mm/s.
    "kp_rad_s": DEFAULT_P_GAIN_RAD_S,  # Turn-rate correction per unit left-minus-right reflectance error (rad/s).
    "ki_rad_s2": 0.0,  # Coefficient (rad/s^2) for reflectance error accumulated over time (s).
    "kd_rad": 0.025,  # Coefficient (rad) for the change rate of reflectance error (1/s).
    "integral_limit_s": 0.5,  # Maximum absolute accumulated reflectance error, seconds.
    "maximum_turn_rate_rad_s": 1.4,  # Maximum absolute steering rate, rad/s.
    "turn_slowdown": 0.45,  # Fraction of cruise speed removed at maximum steering rate; dimensionless.
}


# Reflectance: 0 = light floor, 1 = dark tape. Tune thresholds using floor/tape readings.
LINE_VISIBLE_THRESHOLD = 0.12  # Minimum reading at either sensor to detect the line.
FINISH_THRESHOLD = 0.80  # Minimum reading at both sensors to detect the finish bar.
FINISH_CONFIRM_TIME_S = 0.08  # Continuous finish-bar detection time in s after all checkpoints.

# Supplied component classes. Wheel-speed control always uses this library class.
from ucsb_xrp_reference.challenge_9 import LineFollower as SuppliedLineFollower
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    Odometry as SuppliedOdometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_PROCESSOR = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_LINE_FOLLOWER = False


# Create the robot and its sensing, drive, and odometry components.
def make_robot(config):
    from differential_drive import DifferentialDrive as StudentDifferentialDrive
    from sensor_processor import SensorProcessor as StudentSensorProcessor

    SensorProcessor = StudentSensorProcessor if USE_STUDENT_SENSOR_PROCESSOR else SuppliedSensorProcessor
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive
    return Robot(config, XRPBot(config), SensorProcessor(config), WheelSpeedController(config), DifferentialDrive(config), SuppliedOdometry(config))

# Create the selected line-following controller.
def make_line_follower(settings):
    from line_follower import LineFollower as StudentLineFollower

    if USE_STUDENT_LINE_FOLLOWER:
        return StudentLineFollower(settings)
    return SuppliedLineFollower(settings)

# Apply Monitor controls to the active controller.
# Copy the current slider settings into the line controller.
def apply_line_controls(follower):
    follower.settings["cruise_speed_mm_s"] = CRUISE_SPEED.value
    follower.settings["kp_rad_s"] = P_GAIN.value
