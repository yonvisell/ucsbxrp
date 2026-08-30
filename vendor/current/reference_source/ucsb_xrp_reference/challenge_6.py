"""Supplied Challenge 6 range-constrained stopping component."""

from math import isfinite, sqrt


class RangeSafetyControllerBase:
    """Contract for a forward-range speed limiter.

    Inputs and outputs use millimeters and seconds. ``update`` must return a
    finite, nonnegative forward speed no greater than the requested speed or
    configured maximum. Missing range must return zero.
    """

    __slots__ = (
        "response_time_s",
        "minimum_deceleration_mm_s2",
        "stop_margin_mm",
        "maximum_speed_mm_s",
    )

    def __init__(
        self,
        response_time_s,
        minimum_deceleration_mm_s2,
        stop_margin_mm,
        maximum_speed_mm_s,
    ):
        values = (
            response_time_s,
            minimum_deceleration_mm_s2,
            stop_margin_mm,
            maximum_speed_mm_s,
        )
        if any(isinstance(value, bool) or not isinstance(value, (int, float)) for value in values):
            raise TypeError("range-safety settings must be numeric")
        values = tuple(float(value) for value in values)
        if any(not isfinite(value) for value in values):
            raise ValueError("range-safety settings must be finite")
        if values[0] < 0.0 or values[1] <= 0.0 or values[2] < 0.0 or values[3] <= 0.0:
            raise ValueError("range-safety settings are outside their allowed range")
        self.response_time_s = values[0]
        self.minimum_deceleration_mm_s2 = values[1]
        self.stop_margin_mm = values[2]
        self.maximum_speed_mm_s = values[3]

    def update(self, requested_speed_mm_s, measured_speed_mm_s, range_mm):
        """Return the safe forward-speed request in millimeters per second."""
        raise NotImplementedError


class RangeSafetyController(RangeSafetyControllerBase):
    """Limit forward speed using a conservative stopping-distance envelope."""

    __slots__ = ()

    def update(self, requested_speed_mm_s, measured_speed_mm_s, range_mm):
        """Return a nonnegative forward-speed request that preserves the margin."""
        for value, name in (
            (requested_speed_mm_s, "requested_speed_mm_s"),
            (measured_speed_mm_s, "measured_speed_mm_s"),
        ):
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise TypeError(name + " must be numeric")
            if not isfinite(value):
                raise ValueError(name + " must be finite")
        if range_mm is None:
            return 0.0
        if isinstance(range_mm, bool) or not isinstance(range_mm, (int, float)):
            raise TypeError("range_mm must be numeric or None")
        if not isfinite(range_mm) or range_mm <= 0.0:
            raise ValueError("range_mm must be finite and positive")

        requested = min(max(float(requested_speed_mm_s), 0.0), self.maximum_speed_mm_s)
        if requested == 0.0:
            return 0.0
        measured = max(float(measured_speed_mm_s), 0.0)
        available_mm = max(float(range_mm) - self.stop_margin_mm, 0.0)
        required_for_measured_mm = (
            measured * self.response_time_s
            + measured * measured / (2.0 * self.minimum_deceleration_mm_s2)
        )
        if available_mm <= required_for_measured_mm:
            return 0.0

        acceleration = self.minimum_deceleration_mm_s2
        delay = self.response_time_s
        safe_limit = acceleration * (
            sqrt(delay * delay + 2.0 * available_mm / acceleration) - delay
        )
        return min(requested, max(safe_limit, 0.0))
