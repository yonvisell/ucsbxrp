"""Unit-independent numerical utilities used across course components."""

from math import atan2, pi, sqrt

from ._build_config import DEBUG_VALIDATION
from ._validation import require_number

_TWO_PI = 2.0 * pi
_POSITIVE_PI_BOUNDARY = pi - 1e-6

try:
    from time import ticks_diff as _ticks_diff
except ImportError:  # CPython interface tests do not wrap their monotonic clock.
    def _ticks_diff(later, earlier):
        return later - earlier


def clamp(value, lower, upper):
    """Return *value* limited to the inclusive interval [lower, upper]."""
    if DEBUG_VALIDATION:
        value = require_number("value", value)
        lower = require_number("lower", lower)
        upper = require_number("upper", upper)
        if lower > upper:
            raise ValueError("lower must not exceed upper")
    if value < lower:
        return lower
    if value > upper:
        return upper
    return value


def elapsed_time_s(later_ms, earlier_ms):
    """Return a MicroPython-tick-safe elapsed interval in seconds."""
    if DEBUG_VALIDATION:
        if isinstance(later_ms, bool) or not isinstance(later_ms, int):
            raise TypeError("later_ms must be an integer")
        if isinstance(earlier_ms, bool) or not isinstance(earlier_ms, int):
            raise TypeError("earlier_ms must be an integer")
    return _ticks_diff(later_ms, earlier_ms) / 1000.0


def wrap_angle_rad(angle_rad):
    """Return the equivalent heading in the half-open interval [-pi, pi)."""
    if DEBUG_VALIDATION:
        angle_rad = require_number("angle_rad", angle_rad)
    wrapped = (angle_rad + pi) % _TWO_PI - pi
    # RP2350 MicroPython uses single-precision float arithmetic. At an exact
    # +pi input, the modulo expression can land a few 1e-7 rad below +pi
    # rather than at -pi. Collapse only that representation-scale boundary so
    # CPython and MicroPython keep the same documented half-open convention.
    if wrapped >= _POSITIVE_PI_BOUNDARY:
        return -pi
    return wrapped


def distance_to_goal(pose, goal):
    """Return planar distance from a pose to a navigation goal in millimeters."""
    if DEBUG_VALIDATION:
        dx = require_number("goal.x_mm", goal.x_mm) - require_number(
            "pose.x_mm", pose.x_mm
        )
        dy = require_number("goal.y_mm", goal.y_mm) - require_number(
            "pose.y_mm", pose.y_mm
        )
    else:
        dx = goal.x_mm - pose.x_mm
        dy = goal.y_mm - pose.y_mm
    return sqrt(dx * dx + dy * dy)


def bearing_to_goal(pose, goal):
    """Return the wrapped world-frame bearing from a pose to a goal."""
    if DEBUG_VALIDATION:
        dx = require_number("goal.x_mm", goal.x_mm) - require_number(
            "pose.x_mm", pose.x_mm
        )
        dy = require_number("goal.y_mm", goal.y_mm) - require_number(
            "pose.y_mm", pose.y_mm
        )
    else:
        dx = goal.x_mm - pose.x_mm
        dy = goal.y_mm - pose.y_mm
    return wrap_angle_rad(atan2(dy, dx))
