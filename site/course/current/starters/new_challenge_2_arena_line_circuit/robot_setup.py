# Select component classes below. Robot dimensions are shown for reference.
# Line tuning: line_follower.py. Supplied motor/floor calibration: supplied_settings.py.
from ucsb_xrp import Robot, XRPBot
from line_follower import CRUISE_SPEED_MM_S, P_GAIN_RAD_S, I_GAIN_RAD_S2, D_GAIN_RAD
from live_variables import CRUISE_SPEED, P_GAIN
from supplied_settings import (
    INTEGRAL_LIMIT_S, MAXIMUM_TURN_RATE_RAD_S, MINIMUM_SPEED_MM_S,
    TURN_SLOWDOWN, WAYPOINT_DARK_THRESHOLD, make_robot_config,
)
from ucsb_xrp_reference.challenge_9 import LineFollower as SuppliedLineFollower
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    Odometry as SuppliedOdometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController,
)

ROBOT_DIMENSIONS = dict(
    sample_period_ms=20,  # Scheduled sample interval in ms; 20 ms requests 50 Hz.
    wheel_diameter_mm=60.0,  # Rolling wheel diameter, mm.
    encoder_counts_per_revolution=585.0,  # Encoder counts per wheel revolution.
    track_width_mm=155.0,  # Effective wheel separation, mm.
)
ROBOT_CONFIG = make_robot_config(ROBOT_DIMENSIONS)
LINE_FOLLOWER_SETTINGS = dict(
    cruise_speed_mm_s=CRUISE_SPEED_MM_S,
    kp_rad_s=P_GAIN_RAD_S,
    ki_rad_s2=I_GAIN_RAD_S2,
    kd_rad=D_GAIN_RAD,
    minimum_speed_mm_s=MINIMUM_SPEED_MM_S,
    integral_limit_s=INTEGRAL_LIMIT_S,
    maximum_turn_rate_rad_s=MAXIMUM_TURN_RATE_RAD_S,
    turn_slowdown=TURN_SLOWDOWN,
    waypoint_dark_threshold=WAYPOINT_DARK_THRESHOLD,
)

# True selects this Project's class; False selects the supplied implementation.
USE_STUDENT_SENSOR_PROCESSOR = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_LINE_FOLLOWER = False


def make_robot(config):
    from differential_drive import DifferentialDrive as StudentDifferentialDrive
    from sensor_processor import SensorProcessor as StudentSensorProcessor

    SensorProcessor = StudentSensorProcessor if USE_STUDENT_SENSOR_PROCESSOR else SuppliedSensorProcessor
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive
    return Robot(config, XRPBot(config), SensorProcessor(config), WheelSpeedController(config), DifferentialDrive(config), SuppliedOdometry(config))


def make_line_follower(settings):
    from line_follower import LineFollower as StudentLineFollower
    if USE_STUDENT_LINE_FOLLOWER:
        return StudentLineFollower(settings)
    follower = SuppliedLineFollower(settings)
    if not all(hasattr(follower, name) for name in (
        "p_term_rad_s", "i_term_rad_s", "d_term_rad_s",
    )):
        raise RuntimeError(
            "The supplied LineFollower needs the current course runtime. "
            "Connect by USB and use Robot Setup > Update course runtime. "
            "No firmware reflash is needed."
        )
    return follower


def apply_line_controls(follower):
    follower.settings["cruise_speed_mm_s"] = CRUISE_SPEED.value
    follower.settings["kp_rad_s"] = P_GAIN.value
