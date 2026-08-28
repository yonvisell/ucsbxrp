# Complete the four functions below. This tutorial does not start a robot.


# Example: average_speed_mm_s(600.0, 4.0) returns 150.0.
def average_speed_mm_s(distance_mm: float, duration_s: float) -> float:
    # Reject invalid inputs, then return distance_mm / duration_s.
    raise NotImplementedError("complete average_speed_mm_s")


# A missing range is represented by None rather than by zero millimeters.
def range_state(range_mm: object, stop_distance_mm: float) -> str:
    # Return "unavailable", "stop", or "clear" from the measured conditions.
    raise NotImplementedError("complete range_state")


# The input may be a list or tuple of nonnegative distances in millimeters.
def route_distance_mm(segment_distances_mm: object) -> float:
    # Add each segment to a total that begins at 0.0.
    raise NotImplementedError("complete route_distance_mm")


# Return count and mean wheel speeds in a dictionary with descriptive keys.
def wheel_speed_summary(
    left_samples_mm_s: object,
    right_samples_mm_s: object,
) -> dict:
    # Reject empty or unequal inputs, then total the paired samples in a loop.
    raise NotImplementedError("complete wheel_speed_summary")
