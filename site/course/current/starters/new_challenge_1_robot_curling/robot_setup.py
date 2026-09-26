# Robot calibration, component selection, and assembly for this project.

from ucsb_xrp import RobotConfig, Robot, XRPBot

# Robot calibration and controller settings.
# Example motor settings; calibrate these on the physical XRP.
# Measure wheel diameter and track width in mm; use specified encoder counts.
ROBOT_CONFIG = RobotConfig(
    wheel_diameter_mm=60.0,
    encoder_counts_per_revolution=585.0,
    track_width_mm=155.0,
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031,
    right_speed_command_gain=0.00315,
    wheel_speed_kp=0.001,
    max_drive_command=0.55,
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorProcessor as SuppliedSensorProcessor,
    WheelSpeedController as SuppliedWheelController,
)

# Select and construct project components.
# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_PROCESSOR = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False


# Create the robot and its sensing, drive, and odometry components.
def make_robot(config):
    from sensor_processor import SensorProcessor as StudentSensorProcessor
    from wheel_speed_controller import WheelSpeedController as StudentWheelController

    SensorProcessor = StudentSensorProcessor if USE_STUDENT_SENSOR_PROCESSOR else SuppliedSensorProcessor
    WheelSpeedController = StudentWheelController if USE_STUDENT_WHEEL_SPEED_CONTROLLER else SuppliedWheelController
    return Robot(config, XRPBot(config), SensorProcessor(config), WheelSpeedController(config), DifferentialDrive(config), Odometry(config))
