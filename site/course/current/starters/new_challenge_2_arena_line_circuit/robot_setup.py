# Robot calibration, component selection, and assembly for this project.

from live_variables import (
    CRUISE_SPEED,
    DEFAULT_CRUISE_SPEED_MM_S,
    DEFAULT_P_GAIN_RAD_S,
    P_GAIN,
)
from ucsb_xrp import RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Example motor settings; use measured calibration values for the physical XRP.
# Measure wheel diameter and track width in mm; use specified encoder counts.
ROBOT_CONFIG = RobotConfig(
    wheel_diameter_mm=60.0,
    encoder_counts_per_revolution=585.0,
    track_width_mm=155.0,
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


# Reflectance: 0 = light floor, 1 = dark tape. Tune thresholds using floor/tape readings.
LINE_VISIBLE_THRESHOLD = 0.12  # Minimum reading at either sensor to detect the line.
FINISH_THRESHOLD = 0.80  # Minimum reading at both sensors to detect the finish bar.
FINISH_CONFIRM_SAMPLES = 4  # Consecutive finish-bar readings required.

# Supplied component classes.
from ucsb_xrp_reference.challenge_9 import LineFollower as SuppliedLineFollower
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    Odometry as SuppliedOdometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController as SuppliedWheelSpeedController,
)

# Select and construct project components.
# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_PROCESSOR = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_LINE_FOLLOWER = False


# Create the robot and its sensing, drive, and odometry components.
def make_robot(config):
    from differential_drive import DifferentialDrive as StudentDifferentialDrive
    from sensor_processor import SensorProcessor as StudentSensorProcessor
    from wheel_speed_controller import WheelSpeedController as StudentWheelSpeedController

    SensorProcessor = StudentSensorProcessor if USE_STUDENT_SENSOR_PROCESSOR else SuppliedSensorProcessor
    WheelSpeedController = StudentWheelSpeedController if USE_STUDENT_WHEEL_SPEED_CONTROLLER else SuppliedWheelSpeedController
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
