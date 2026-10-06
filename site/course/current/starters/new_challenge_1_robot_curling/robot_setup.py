# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import RobotConfig, Robot, XRPBot

# Robot dimensions and supplied wheel-controller settings.
# Supplied motor settings for Virtual XRP; use the instructor's settings for a physical XRP.
# Measure wheel diameter and track width in mm; use specified encoder counts.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=10,  # Scheduled sample interval in ms; 10 ms gives 100 Hz.
    wheel_diameter_mm=60.0,  # Rolling wheel diameter in mm; measure on the physical robot.
    encoder_counts_per_revolution=585.0,  # Encoder counts for one wheel revolution.
    track_width_mm=155.0,  # Effective left-to-right wheel separation in mm.
    left_start_command=0.12,  # Supplied left-wheel starting command; dimensionless.
    right_start_command=0.13,  # Supplied right-wheel starting command; dimensionless.
    left_speed_command_gain=0.003112,  # Supplied left command per mm/s of requested speed (s/mm).
    right_speed_command_gain=0.003172,  # Supplied right command per mm/s of requested speed (s/mm).
    wheel_speed_kp=0.001,  # Supplied correction per wheel-speed error (s/mm).
    wheel_speed_ki=0.0,  # Reserved accumulated-error coefficient (1/mm); keep zero.
    wheel_speed_kd=0.0,  # Reserved error-rate coefficient (s^2/mm); keep zero.
    max_drive_command=0.55,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# Supplied component classes. Wheel-speed control always uses this library class.
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_PROCESSOR = False


# Create the robot and its sensing, drive, and odometry components.
def make_robot(config):
    from sensor_processor import SensorProcessor as StudentSensorProcessor

    SensorProcessor = StudentSensorProcessor if USE_STUDENT_SENSOR_PROCESSOR else SuppliedSensorProcessor
    return Robot(config, XRPBot(config), SensorProcessor(config), WheelSpeedController(config), DifferentialDrive(config), Odometry(config))
