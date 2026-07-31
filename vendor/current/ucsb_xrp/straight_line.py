"""Supplied straight-distance controller used in Challenge 1."""

from ._validation import require_nonnegative
from .config import NavigationConfig
from .records import Measurements, MotionCommand, STOP_COMMAND


class StraightLineController:
    """Choose a forward-speed command from measured wheel travel.

    The controller deliberately has no hardware access. ``start`` records the
    current mean wheel position. Successive calls to ``update`` use the mean
    left/right travel to select cruise speed, approach speed, or a stop.
    """

    __slots__ = (
        "_config",
        "_start_position_mm",
        "_distance_mm",
        "_started",
        "_complete",
    )

    def __init__(self, config):
        if not isinstance(config, NavigationConfig):
            raise TypeError("config must be a NavigationConfig")
        self._config = config
        self._start_position_mm = 0.0
        self._distance_mm = 0.0
        self._started = False
        self._complete = False

    def start(self, measurements, distance_mm):
        """Start a forward move of ``distance_mm`` from ``measurements``."""
        if not isinstance(measurements, Measurements):
            raise TypeError("measurements must be a Measurements value")

        self._distance_mm = require_nonnegative("distance_mm", distance_mm)
        self._start_position_mm = self._mean_position_mm(measurements)
        self._started = True
        self._complete = (
            self._distance_mm <= self._config.position_tolerance_mm
        )

    def update(self, measurements):
        """Return the next straight command from the newest measurements."""
        if not self._started:
            raise RuntimeError("call start() before update()")
        if not isinstance(measurements, Measurements):
            raise TypeError("measurements must be a Measurements value")
        if self._complete:
            return STOP_COMMAND

        travel_mm = self._mean_position_mm(measurements) - self._start_position_mm
        remaining_mm = self._distance_mm - travel_mm

        if remaining_mm <= self._config.position_tolerance_mm:
            self._complete = True
            return STOP_COMMAND

        if remaining_mm <= self._config.slowdown_distance_mm:
            speed_mm_s = self._config.approach_speed_mm_s
        else:
            speed_mm_s = self._config.cruise_speed_mm_s

        return MotionCommand(speed_mm_s, 0.0)

    def is_complete(self):
        return self._complete

    @staticmethod
    def _mean_position_mm(measurements):
        return (
            measurements.left_position_mm + measurements.right_position_mm
        ) / 2.0
