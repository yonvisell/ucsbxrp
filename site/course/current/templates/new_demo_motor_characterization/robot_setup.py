# Sampling and supplied robot components for the motor experiment.

from ucsb_xrp import RobotConfig, Robot, XRPBot

# main.py uses the sample interval and sensor settings. It applies motor
# commands directly, so the wheel-feedback settings below are unused here.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=10,  # Scheduled sample interval in ms; 10 ms gives 100 Hz.
    left_start_command=0.12,  # Left-wheel starting command; dimensionless; unused in this experiment.
    right_start_command=0.13,  # Right-wheel starting command; dimensionless; unused in this experiment.
    left_speed_command_gain=0.0031,  # Left motor command per requested speed (s/mm); unused here.
    right_speed_command_gain=0.0031,  # Right motor command per requested speed (s/mm); unused here.
    wheel_speed_kp=0.001,  # Correction per wheel-speed error (s/mm); unused here.
    wheel_speed_ki=0.0,  # Accumulated-error coefficient (1/mm); supplied controller does not use it.
    wheel_speed_kd=0.0,  # Error-rate coefficient (s^2/mm); supplied controller does not use it.
    max_drive_command=0.65,  # Maximum absolute command for either motor; dimensionless, within [0, 1].
)

# Supplied component classes.
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorProcessor,
    WheelSpeedController,
)

# Select and construct project components.
# Pass one config to hardware conversion, sensing, wheel control, and odometry.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
