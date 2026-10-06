# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import NavigationConfig, RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Nominal values match the virtual XRP. Tune signs and gains from measurements
# when a physical course robot differs.
# Wheel geometry and motor-command calibration must describe this robot.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=10,  # Scheduled sample interval in ms; 10 ms gives 100 Hz.
    left_start_command=0.12,  # Left-wheel starting command; dimensionless, measured under load.
    right_start_command=0.13,  # Right-wheel starting command; dimensionless, measured under load.
    left_speed_command_gain=0.0031,  # Left feedforward command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.0031,  # Right feedforward command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # P gain: command per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Accumulated-error coefficient (1/mm); supplied controller does not use it.
    wheel_speed_kd=0.0,  # Error-rate coefficient (s^2/mm); supplied controller does not use it.
    max_drive_command=0.55,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# These named values make units visible and can be tuned from measured runs.
STRAIGHT_CONFIG = NavigationConfig(
    cruise_speed_mm_s=120.0,  # Requested forward speed outside the slowdown distance, mm/s.
    approach_speed_mm_s=96.0,  # Requested forward speed within the slowdown distance, mm/s.
    slowdown_distance_mm=120.0,  # Remaining wheel-travel threshold for approach speed, mm.
    turn_rate_rad_s=1.0,  # Navigation rotation limit, rad/s; unused by StraightLineController.
    position_tolerance_mm=10.0,  # Stop when remaining mean wheel travel is at or below this value, mm.
    heading_tolerance_rad=0.08,  # Navigation alignment tolerance, rad; unused by StraightLineController.
    realign_heading_rad=0.25,  # Navigation heading-error threshold, rad; unused by StraightLineController.
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
