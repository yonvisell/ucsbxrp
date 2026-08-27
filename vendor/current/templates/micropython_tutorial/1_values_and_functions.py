# Lesson 1: calculate a motion request with values and a function.

TARGET_DISTANCE_MM = 600.0
TARGET_TIME_S = 4.0


def average_speed_mm_s(distance_mm, duration_s):
    """Return the constant speed needed to cover a distance in a given time."""
    return distance_mm / duration_s


speed_mm_s = average_speed_mm_s(TARGET_DISTANCE_MM, TARGET_TIME_S)

# Float calculations are compared within a small tolerance.
expected_speed_mm_s = 150.0
assert abs(speed_mm_s - expected_speed_mm_s) < 0.000001
print("Lesson 1 complete:", speed_mm_s, "mm/s")
