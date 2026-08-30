"""Supplied Challenge 6 range-constrained stopping component."""

from math import isfinite, sqrt

from ucsb_xrp.student_api import RangeSafetyControllerBase


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
