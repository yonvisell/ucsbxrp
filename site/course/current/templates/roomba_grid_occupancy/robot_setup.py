# Assemble the XRP with encoder odometry and the supplied wheel-speed controller.

from settings import ROBOT_CONFIG
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import DifferentialDrive, Odometry, SensorProcessor, WheelSpeedController


def make_robot():
    # Use the configured wheels and encoders to estimate motion and regulate wheel speed.
    config = ROBOT_CONFIG
    return Robot(config, XRPBot(config), SensorProcessor(config),
                 WheelSpeedController(config), DifferentialDrive(config), Odometry(config))
