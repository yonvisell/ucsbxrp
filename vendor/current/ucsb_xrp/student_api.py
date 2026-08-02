"""Narrow component contracts implemented progressively by students."""

from .config import NavigationConfig, RobotConfig


class _ConfiguredComponent:
    __slots__ = ("_config",)

    def __init__(self, config):
        if not isinstance(config, RobotConfig):
            raise TypeError("config must be a RobotConfig")
        self._config = config

    @property
    def config(self):
        return self._config


class SensorModelBase(_ConfiguredComponent):
    """Contract for encoder/range conversion; algorithms belong to students."""

    __slots__ = ()

    def reset(self, raw):
        raise NotImplementedError

    def update(self, raw):
        raise NotImplementedError

    def estimate_range(self, samples, minimum_usable):
        raise NotImplementedError


class WheelSpeedControllerBase(_ConfiguredComponent):
    """Contract for converting target and measured speed to motor effort."""

    __slots__ = ()

    def reset(self):
        raise NotImplementedError

    def update(self, target, measured):
        raise NotImplementedError


class DifferentialDriveBase(_ConfiguredComponent):
    """Contract for differential-drive inverse kinematics."""

    __slots__ = ()

    def wheel_speeds(self, command):
        raise NotImplementedError


class OdometryBase(_ConfiguredComponent):
    """Contract for differential-drive pose integration."""

    __slots__ = ()

    def reset(self, initial_pose):
        raise NotImplementedError

    def update(self, left_increment_mm, right_increment_mm):
        raise NotImplementedError

    @property
    def pose(self):
        raise NotImplementedError


class NavigationControllerBase:
    """Contract for ordered world-goal navigation."""

    __slots__ = ("_config",)

    def __init__(self, config):
        if not isinstance(config, NavigationConfig):
            raise TypeError("config must be a NavigationConfig")
        self._config = config

    @property
    def config(self):
        return self._config

    def start(self, goals):
        raise NotImplementedError

    def update(self, pose):
        raise NotImplementedError

    def current_goal(self):
        raise NotImplementedError

    def is_complete(self):
        raise NotImplementedError


class GridPlannerBase:
    """Contract for shortest four-neighbor grid planning."""

    __slots__ = ()

    def plan(self, grid, start, goal):
        raise NotImplementedError
