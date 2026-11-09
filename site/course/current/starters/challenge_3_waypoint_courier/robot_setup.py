# Select components and configure robot and navigation
from challenge import POSITION_TOLERANCE_MM, HEADING_TOLERANCE_RAD
from live_variables import CRUISE_SPEED, STEERING_RATE
from settings import (
    WHEEL_DIAMETER_MM, ENCODER_COUNTS_PER_REVOLUTION, TRACK_WIDTH_MM,
    CRUISE_SPEED_MM_S, STEERING_RATE_RAD_S, APPROACH_SPEED_RATIO,
    SLOWDOWN_DISTANCE_MM,
    USE_GPS, VIRTUAL_GPS_RATE_HZ,
    GPS_POSITION_DRIFT_MM, GPS_HEADING_DRIFT_RAD, DRIVING_BIAS, DRIVING_DRIFT,
)
from supplied_settings import (
    IS_PHYSICAL_XRP, SAMPLE_PERIOD_MS, make_robot_config,
    VIRTUAL_GPS_LATENCY_MS, VIRTUAL_GPS_DROPOUT_START_MS,
    VIRTUAL_GPS_DROPOUT_DURATION_MS,
)
from ucsb_xrp import NavigationConfig, Robot, XRPBot
from ucsb_xrp.pose_sources import configure_pose_source

ROBOT_DIMENSIONS = dict(
    sample_period_ms=SAMPLE_PERIOD_MS,
    wheel_diameter_mm=WHEEL_DIAMETER_MM,
    encoder_counts_per_revolution=ENCODER_COUNTS_PER_REVOLUTION,
    track_width_mm=TRACK_WIDTH_MM,
)
ROBOT_CONFIG = make_robot_config(ROBOT_DIMENSIONS)
NAVIGATION_CONFIG = NavigationConfig(
    cruise_speed_mm_s=CRUISE_SPEED_MM_S,
    approach_speed_mm_s=APPROACH_SPEED_RATIO * CRUISE_SPEED_MM_S,
    slowdown_distance_mm=SLOWDOWN_DISTANCE_MM,
    steering_rate_rad_s=STEERING_RATE_RAD_S,
    position_tolerance_mm=POSITION_TOLERANCE_MM,
    heading_tolerance_rad=HEADING_TOLERANCE_RAD,
    realign_heading_rad=0.25,
)

# Library component implementations
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    NavigationController as SuppliedNavigationController,
    Localization as SuppliedLocalization,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController,
)

# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_PROCESSOR = True
USE_STUDENT_DIFFERENTIAL_DRIVE = True
USE_STUDENT_LOCALIZATION = True
USE_STUDENT_NAVIGATION_CONTROLLER = True


# Create robot with selected components
def make_robot(config):
    from differential_drive import DifferentialDrive as StudentDifferentialDrive
    from localization import Localization as StudentLocalization
    from sensor_processor import SensorProcessor as StudentSensorProcessor

    SensorProcessor = StudentSensorProcessor if USE_STUDENT_SENSOR_PROCESSOR else SuppliedSensorProcessor
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive
    Localization = StudentLocalization if USE_STUDENT_LOCALIZATION else SuppliedLocalization
    if not IS_PHYSICAL_XRP:
        configure_pose_source(
            rate_hz=VIRTUAL_GPS_RATE_HZ,
            latency_ms=VIRTUAL_GPS_LATENCY_MS,
            dropout_start_ms=VIRTUAL_GPS_DROPOUT_START_MS,
            dropout_duration_ms=VIRTUAL_GPS_DROPOUT_DURATION_MS,
            position_drift_mm=GPS_POSITION_DRIFT_MM,
            heading_drift_rad=GPS_HEADING_DRIFT_RAD,
            driving_bias_percent=DRIVING_BIAS,
            driving_drift_percent=DRIVING_DRIFT,
        )
    localization = Localization(config)
    return Robot(config, XRPBot(config), SensorProcessor(config),
                 WheelSpeedController(config), DifferentialDrive(config), localization, use_gps=USE_GPS)


# Create selected navigation controller
def make_navigation_controller(config):
    from navigation_controller import NavigationController as StudentNavigationController

    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)

# Apply Monitor speed and steering-rate settings
def apply_navigation_controls(navigation):
    current = navigation.config
    cruise_speed_mm_s = CRUISE_SPEED.value
    steering_rate_rad_s = STEERING_RATE.value
    if (
        current.cruise_speed_mm_s == cruise_speed_mm_s
        and current.steering_rate_rad_s == steering_rate_rad_s
    ):
        return
    navigation.set_config(NavigationConfig(
        cruise_speed_mm_s=cruise_speed_mm_s,
        approach_speed_mm_s=APPROACH_SPEED_RATIO * cruise_speed_mm_s,
        slowdown_distance_mm=current.slowdown_distance_mm,
        steering_rate_rad_s=steering_rate_rad_s,
        position_tolerance_mm=current.position_tolerance_mm,
        heading_tolerance_rad=current.heading_tolerance_rad,
        realign_heading_rad=current.realign_heading_rad,
    ))
