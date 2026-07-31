"""Narrow base interfaces implemented by students in Challenge 1."""

from .config import RobotConfig


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
