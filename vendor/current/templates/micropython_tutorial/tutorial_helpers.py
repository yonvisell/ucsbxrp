# Reusable functions imported by Lesson 5.


def clamp(value, lower, upper):
    return max(lower, min(upper, value))


def millimeters_to_meters(distance_mm):
    return distance_mm / 1000.0
