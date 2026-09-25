# Assemble the supplied components used by this demonstration.

from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel,
    WheelSpeedController,
)


# Bind the hardware adapter and supplied components to the same robot settings.
def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorModel(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )
