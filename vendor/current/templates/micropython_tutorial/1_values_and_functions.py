# Lesson 1: calculate a motion request with values and a function.

TARGET_DISTANCE_MM = 600.0
TARGET_TIME_S = 4.0


def average_speed_mm_s(distance_mm, duration_s):
    """Return the constant speed needed to cover a distance in a given time."""
    if duration_s <= 0.0:
        raise ValueError("duration_s must be positive")
    return distance_mm / duration_s


speed_mm_s = average_speed_mm_s(TARGET_DISTANCE_MM, TARGET_TIME_S)

# An assertion records a condition that must be true if the calculation works.
assert speed_mm_s == 150.0
print("Lesson 1 complete:", speed_mm_s, "mm/s")
