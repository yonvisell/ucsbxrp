# Select the project components; numerical settings live in settings.py.
from live_variables import CRUISE_SPEED, TURN_RATE
from settings import (
    WHEEL_DIAMETER_MM, ENCODER_COUNTS_PER_REVOLUTION, TRACK_WIDTH_MM,
    CRUISE_SPEED_MM_S, TURN_RATE_RAD_S, APPROACH_SPEED_RATIO,
    SLOWDOWN_DISTANCE_MM, POSITION_TOLERANCE_MM,
    HEADING_TOLERANCE_RAD, REALIGN_HEADING_RAD,
    USE_GPS, VIRTUAL_GPS_RATE_HZ,
    GPS_POSITION_DRIFT_MM, GPS_HEADING_DRIFT_RAD, DRIVING_DRIFT_PERCENT,
)
from supplied_settings import (
    SAMPLE_PERIOD_MS, make_robot_config,
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
    turn_rate_rad_s=TURN_RATE_RAD_S,
    position_tolerance_mm=POSITION_TOLERANCE_MM,
    heading_tolerance_rad=HEADING_TOLERANCE_RAD,
    realign_heading_rad=REALIGN_HEADING_RAD,
)

# Wheel-speed control always uses this supplied library class.
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    GridPlanner as SuppliedGridPlanner,
    NavigationController as SuppliedNavigationController,
    Localization as SuppliedLocalization,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_PROCESSOR = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_LOCALIZATION = False
USE_STUDENT_NAVIGATION_CONTROLLER = False
USE_STUDENT_GRID_PLANNER = False


# Create the robot and its sensing, drive, and localization components.
def make_robot(config):
    from differential_drive import DifferentialDrive as StudentDifferentialDrive
    from localization import Localization as StudentLocalization
    from sensor_processor import SensorProcessor as StudentSensorProcessor

    SensorProcessor = StudentSensorProcessor if USE_STUDENT_SENSOR_PROCESSOR else SuppliedSensorProcessor
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive
    Localization = StudentLocalization if USE_STUDENT_LOCALIZATION else SuppliedLocalization
    if USE_GPS:
        configure_pose_source(
            rate_hz=VIRTUAL_GPS_RATE_HZ,
            latency_ms=VIRTUAL_GPS_LATENCY_MS,
            dropout_start_ms=VIRTUAL_GPS_DROPOUT_START_MS,
            dropout_duration_ms=VIRTUAL_GPS_DROPOUT_DURATION_MS,
            position_drift_mm=GPS_POSITION_DRIFT_MM,
            heading_drift_rad=GPS_HEADING_DRIFT_RAD,
            driving_drift_percent=DRIVING_DRIFT_PERCENT,
        )
    localization = Localization(
        config, use_gps=USE_GPS,
    )
    return Robot(config, XRPBot(config), SensorProcessor(config),
                 WheelSpeedController(config), DifferentialDrive(config), localization)


# Create the selected navigation controller.
def make_navigation_controller(config):
    from navigation_controller import NavigationController as StudentNavigationController

    if USE_STUDENT_NAVIGATION_CONTROLLER:
        return StudentNavigationController(config)
    return SuppliedNavigationController(config)


# Create the selected grid planner.
def make_grid_planner():
    from grid_planner import GridPlanner as StudentGridPlanner

    if USE_STUDENT_GRID_PLANNER:
        return StudentGridPlanner()
    return SuppliedGridPlanner()

# Apply Monitor controls to the active controller.
# Apply slider settings without restarting the route.
def apply_navigation_controls(navigation):
    current = navigation.config
    cruise_speed_mm_s = CRUISE_SPEED.value  # Read the cruise-speed slider.
    turn_rate_rad_s = TURN_RATE.value  # Read the turn-rate slider.
    if (
        current.cruise_speed_mm_s == cruise_speed_mm_s
        and current.turn_rate_rad_s == turn_rate_rad_s
    ):
        return  # Neither slider changed.
    navigation.set_config(NavigationConfig(
        cruise_speed_mm_s=cruise_speed_mm_s,
        approach_speed_mm_s=APPROACH_SPEED_RATIO * cruise_speed_mm_s,
        slowdown_distance_mm=current.slowdown_distance_mm,
        turn_rate_rad_s=turn_rate_rad_s,
        position_tolerance_mm=current.position_tolerance_mm,
        heading_tolerance_rad=current.heading_tolerance_rad,
        realign_heading_rad=current.realign_heading_rad,
    ))
