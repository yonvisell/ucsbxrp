"""Finite, quantity-aware comparison helpers for hardware-free student checks."""

_ABSOLUTE = {"mm": 0.001, "mm/s": 0.01, "s": 0.0001,
             "rad": 0.0001, "rad/s": 0.0001, "dimensionless": 0.0001}


def format_number(value):
    if not isinstance(value, (float, int)) or isinstance(value, bool):
        return str(value)
    if value == 0:
        return "0"
    return "{:.3g}".format(value)


def finite_number(label, value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise AssertionError("{} must be a finite real number; received {} ({}). Check the returned field, its units, and the return statement.".format(
            label, value, type(value).__name__))
    if value != value or abs(value) == float("inf"):
        raise AssertionError("{} must be finite; received {}. Check division, elapsed time, and intermediate calculations.".format(label, value))
    return value


def comparison(label, actual, expected, units="mm", absolute=None, exact=False):
    finite_number(label, actual)
    finite_number(label + " expected", expected)
    floor = _ABSOLUTE[units] if absolute is None else absolute
    relative = 0.0 if exact else 0.005
    allowed = 0.0 if exact else max(floor, relative * abs(expected))
    difference = actual - expected
    if units == "rad":
        from math import pi
        difference = (difference + pi) % (2 * pi) - pi
    passed = abs(difference) <= allowed
    difference_label = "wrapped angular difference" if units == "rad" else "difference (received minus expected)"
    message = (
        "{}: expected {} {}, received {} {}. The {} "
        "is {} {}; the allowed absolute error is {} {}. "
        "Check the named field, unit conversion, and inputs shown for this method."
    ).format(label, format_number(expected), units, format_number(actual), units,
             difference_label, format_number(difference), units, format_number(allowed), units)
    return {"field": label, "actual": actual, "expected": expected, "units": units,
            "difference": difference, "tolerance": {"absolute": 0.0 if exact else floor,
            "relative": relative, "allowed": allowed}, "passed": passed, "message": message}


def assert_close(actual, expected, units="mm", label="calculated value", absolute=None, exact=False):
    detail = comparison(label, actual, expected, units, absolute, exact)
    if not detail["passed"]:
        raise AssertionError(detail["message"])
