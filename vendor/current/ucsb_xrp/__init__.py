"""Public Challenge 1 surface of the provisional UCSB-XRP course package."""

from .config import NavigationConfig, RobotConfig
from .records import (
    Measurements,
    MotionCommand,
    MotorEfforts,
    NavigationGoal,
    Pose,
    RawSensors,
    RobotState,
    STOP_COMMAND,
    WheelSpeeds,
)
from .utils import (
    bearing_to_goal,
    clamp,
    distance_to_goal,
    elapsed_time_s,
    wrap_angle_rad,
)
from .xrpbot import XRPBot

__version__ = "0.1.0-dev"

__all__ = (
    "NavigationConfig",
    "RobotConfig",
    "Measurements",
    "MotionCommand",
    "MotorEfforts",
    "NavigationGoal",
    "Pose",
    "RawSensors",
    "RobotState",
    "STOP_COMMAND",
    "WheelSpeeds",
    "XRPBot",
    "bearing_to_goal",
    "clamp",
    "distance_to_goal",
    "elapsed_time_s",
    "wrap_angle_rad",
)
