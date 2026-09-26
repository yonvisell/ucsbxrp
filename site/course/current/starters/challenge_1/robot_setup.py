# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import NavigationConfig, RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Nominal values match the virtual XRP. Tune signs and gains from measurements
# when a physical course robot differs.
# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.0031,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)

# These named values make units visible and can be tuned from measured runs.
STRAIGHT_CONFIG = NavigationConfig(
    cruise_speed_mm_s=120.0,
    approach_speed_mm_s=96.0,
    slowdown_distance_mm=120.0,
    turn_rate_rad_s=1.0,
    position_tolerance_mm=10.0,
    heading_tolerance_rad=0.08,
    realign_heading_rad=0.25,
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController as SuppliedWheelController,
)

# Select and construct project components.
# False selects the supplied class. Change one flag to True only after
# the matching class in this project passes the Test components examples.
USE_STUDENT_SENSOR_PROCESSOR = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False


def make_sensor_processor(config):
    from sensor_processor import SensorProcessor as StudentSensorProcessor

    if USE_STUDENT_SENSOR_PROCESSOR:
        return StudentSensorProcessor(config)
    return SuppliedSensorProcessor(config)


def make_wheel_speed_controller(config):
    from wheel_speed_controller import WheelSpeedController as StudentWheelController

    if USE_STUDENT_WHEEL_SPEED_CONTROLLER:
        return StudentWheelController(config)
    return SuppliedWheelController(config)


# Build Robot from the selected sensor, feedback, drive, and odometry classes.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        make_sensor_processor(config),
        make_wheel_speed_controller(config),
        DifferentialDrive(config),
        Odometry(config),
    )
