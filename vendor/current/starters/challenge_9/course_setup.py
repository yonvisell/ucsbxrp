# Challenge 9 reuses supplied drive components and makes LineFollower editable.

from line_follower import LineFollower as StudentLineFollower
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel,
    WheelSpeedController,
)
from ucsb_xrp_reference.challenge_9 import LineFollower as SuppliedLineFollower


USE_STUDENT_LINE_FOLLOWER = False


def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        SensorModel(config),
        WheelSpeedController(config),
        DifferentialDrive(config),
        Odometry(config),
    )


def make_line_follower(settings):
    if USE_STUDENT_LINE_FOLLOWER:
        return StudentLineFollower(settings)
    return SuppliedLineFollower(settings)
