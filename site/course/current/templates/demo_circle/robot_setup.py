# Supplied robot components and virtual wheel-controller settings.

from ucsb_xrp import Robot, RobotConfig, XRPBot
from ucsb_xrp_reference import DifferentialDrive, Odometry, SensorProcessor, WheelSpeedController


ROBOT_CONFIG = RobotConfig(
    sample_period_ms=20,
    left_start_command=0.12,
    right_start_command=0.13,
    left_speed_command_gain=0.0031124,
    right_speed_command_gain=0.0031722,
    wheel_speed_kp=0.001,
    wheel_speed_ki=0.0,
    wheel_speed_kd=0.0,
    max_drive_command=0.65,
)


def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorProcessor(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
