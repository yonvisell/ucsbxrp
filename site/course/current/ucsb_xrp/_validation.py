"""Small validation helpers shared by the MicroPython course package."""

try:
    from math import isfinite
except ImportError:  # pragma: no cover - retained for minimal MicroPython ports
    def isfinite(value):
        return value == value and value != float("inf") and value != -float("inf")


def require_number(name, value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise TypeError("{} must be a real number".format(name))
    value = float(value)
    if not isfinite(value):
        raise ValueError("{} must be finite".format(name))
    return value


def require_nonnegative(name, value):
    value = require_number(name, value)
    if value < 0.0:
        raise ValueError("{} must be nonnegative".format(name))
    return value


def require_positive(name, value):
    value = require_number(name, value)
    if value <= 0.0:
        raise ValueError("{} must be greater than zero".format(name))
    return value


def require_int(name, value, minimum=None):
    if isinstance(value, bool) or not isinstance(value, int):
        raise TypeError("{} must be an integer".format(name))
    if minimum is not None and value < minimum:
        raise ValueError("{} must be at least {}".format(name, minimum))
    return value


def require_bool(name, value):
    if not isinstance(value, bool):
        raise TypeError("{} must be True or False".format(name))
    return value


def require_sign(name, value):
    value = require_int(name, value)
    if value != -1 and value != 1:
        raise ValueError("{} must be -1 or +1".format(name))
    return value


def require_optional_positive(name, value):
    if value is None:
        return None
    return require_positive(name, value)

