"""Small, typed course interface shared by the physical and virtual XRP."""

from .config import NavigationConfig, RobotConfig
from .maps import ArenaMap, OccupancyGrid, Rectangle
from .mission import DeliveryMission, DeliveryTask
from .records import (
    DriveCommand,
    GridCell,
    GridPath,
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
from .robot import Robot
from . import live
from .straight_line import StraightLineController
from .student_api import (
    DifferentialDriveBase,
    GridPlannerBase,
    NavigationControllerBase,
    OdometryBase,
    SensorModelBase,
    WheelSpeedControllerBase,
)
from .utils import (
    bearing_to_goal,
    clamp,
    distance_to_goal,
    elapsed_time_s,
    wrap_angle_rad,
)
from .xrpbot import XRPBot
from .world import ProjectWorld, load_world

__version__ = "0.4.0-dev"

__all__ = (
    "ArenaMap",
    "DeliveryMission",
    "DeliveryTask",
    "DifferentialDriveBase",
    "DriveCommand",
    "GridCell",
    "GridPath",
    "GridPlannerBase",
    "NavigationConfig",
    "NavigationControllerBase",
    "RobotConfig",
    "OccupancyGrid",
    "OdometryBase",
    "Rectangle",
    "Measurements",
    "MotionCommand",
    "MotorEfforts",
    "NavigationGoal",
    "Pose",
    "ProjectWorld",
    "RawSensors",
    "Robot",
    "RobotState",
    "SensorModelBase",
    "STOP_COMMAND",
    "StraightLineController",
    "WheelSpeeds",
    "WheelSpeedControllerBase",
    "XRPBot",
    "bearing_to_goal",
    "clamp",
    "distance_to_goal",
    "elapsed_time_s",
    "wrap_angle_rad",
    "live",
    "load_world",
)
