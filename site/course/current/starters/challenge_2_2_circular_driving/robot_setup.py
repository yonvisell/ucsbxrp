# Select your component classes and enter your physical robot's measured calibration.

from sys import platform
from ucsb_xrp import Robot, RobotConfig, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    Odometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController,
)


PHYSICAL_ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,  # Request one control sample every 20 ms (50 Hz).
    wheel_diameter_mm=60.0,  # Rolling wheel diameter [mm].
    encoder_counts_per_revolution=585.0,  # Encoder counts for one wheel revolution.
    track_width_mm=155.0,  # Effective drive-wheel separation [mm].
    left_start_command=0.12,  # Left motor starting effort.
    right_start_command=0.13,  # Right motor starting effort.
    left_speed_command_gain=0.0025,  # Replace with your left feedforward gain [s/mm].
    right_speed_command_gain=0.0025,  # Replace with your right feedforward gain [s/mm].
    wheel_speed_kp=0.001,  # Supplied wheel-speed feedback coefficient [s/mm].
    wheel_speed_ki=0.0,  # Unused by supplied wheel control.
    wheel_speed_kd=0.0,  # Unused by supplied wheel control.
    max_drive_command=1.0,  # Maximum motor effort.
)

# Supplied simulation calibration. Physical measurements belong only in PHYSICAL_ROBOT_CONFIG above.
VIRTUAL_ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,
    wheel_diameter_mm=60.0,
    encoder_counts_per_revolution=585.0,
    track_width_mm=155.0,
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031124,
    right_speed_command_gain=0.0031722,
    wheel_speed_kp=0.001,
    wheel_speed_ki=0.0,
    wheel_speed_kd=0.0,
    max_drive_command=1.0,
)
ROBOT_CONFIG = PHYSICAL_ROBOT_CONFIG if platform == "rp2" else VIRTUAL_ROBOT_CONFIG  # Use the selected target's calibration.

# True uses your Project file; False uses the supplied class for a comparison run.
USE_STUDENT_SENSOR_PROCESSOR = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False


def make_robot(config):
    from sensor_processor import SensorProcessor as StudentSensorProcessor
    from differential_drive import DifferentialDrive as StudentDifferentialDrive

    SensorProcessor = StudentSensorProcessor if USE_STUDENT_SENSOR_PROCESSOR else SuppliedSensorProcessor  # Select the sensor processor.
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive  # Select the differential-drive calculation.
    return Robot(config, XRPBot(config), SensorProcessor(config), WheelSpeedController(config), DifferentialDrive(config), Odometry(config))  # Assemble the robot components.
