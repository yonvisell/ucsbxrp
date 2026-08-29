# Runnable Python examples used by Tutorial 1. This tutorial does not start a robot.


# Example: average_speed_mm_s(600.0, 4.0) returns 150.0.
def average_speed_mm_s(distance_mm: float, duration_s: float) -> float:
    if distance_mm < 0.0 or duration_s <= 0.0:
        raise ValueError("distance must be nonnegative and duration must be positive")
    return distance_mm / duration_s


# A missing range is represented by None rather than by zero millimeters.
def range_state(range_mm: object, stop_distance_mm: float) -> str:
    if stop_distance_mm <= 0.0:
        raise ValueError("stop distance must be positive")
    if range_mm is None:
        return "unavailable"
    if range_mm <= stop_distance_mm:
        return "stop"
    return "clear"


# The input may be a list or tuple of nonnegative distances in millimeters.
def route_distance_mm(segment_distances_mm: object) -> float:
    total_mm = 0.0
    for distance_mm in segment_distances_mm:
        if distance_mm < 0.0:
            raise ValueError("route distances cannot be negative")
        total_mm += distance_mm
    return total_mm


# Return count and mean wheel speeds in a dictionary with descriptive keys.
def wheel_speed_summary(
    left_samples_mm_s: object,
    right_samples_mm_s: object,
) -> dict:
    if not left_samples_mm_s or len(left_samples_mm_s) != len(
        right_samples_mm_s
    ):
        raise ValueError("paired samples must be nonempty and equal in length")
    sample_count = len(left_samples_mm_s)
    left_total = 0.0
    right_total = 0.0
    for index in range(sample_count):
        left_total += left_samples_mm_s[index]
        right_total += right_samples_mm_s[index]
    mean_left_mm_s = left_total / sample_count
    mean_right_mm_s = right_total / sample_count
    return {
        "sample_count": sample_count,
        "mean_left_mm_s": mean_left_mm_s,
        "mean_right_mm_s": mean_right_mm_s,
        "mean_difference_mm_s": mean_left_mm_s - mean_right_mm_s,
    }
