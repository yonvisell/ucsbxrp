# Complete the five Python functions used in Tutorial 1.
# Run Check exercises after each function. This file never starts a robot.


# Example: average_speed_mm_s(600.0, 4.0) returns 150.0.
def average_speed_mm_s(distance_mm: float, duration_s: float) -> float:
    # Reject negative distance and nonpositive duration, then return d / t.
    raise NotImplementedError("complete average_speed_mm_s")


# Example: route_distance_mm([120.0, 80.0, 50.0]) returns 250.0.
def route_distance_mm(segment_distances_mm: "list | tuple") -> float:
    # Add each nonnegative segment to a total that begins at 0.0.
    raise NotImplementedError("complete route_distance_mm")


# Example: range_state(None, 250.0) returns "unavailable".
# Example: range_state(200.0, 250.0) returns "stop".
def range_state(range_mm: "float | None", stop_distance_mm: float) -> str:
    # Check None before comparing the range with a distance.
    raise NotImplementedError("complete range_state")


# Return count, left mean, right mean, and left-minus-right mean in a dictionary.
def wheel_speed_summary(
    left_samples_mm_s: "list | tuple",
    right_samples_mm_s: "list | tuple",
) -> dict:
    # Reject empty or unequal-length inputs, then total paired samples in a loop.
    raise NotImplementedError("complete wheel_speed_summary")


# Example: parse_stop_distance_mm("275.5", 240.0) returns 275.5.
# Invalid, zero, or negative input returns fallback_mm.
def parse_stop_distance_mm(text_value: object, fallback_mm: float) -> float:
    # Catch only TypeError and ValueError raised by float(text_value).
    raise NotImplementedError("complete parse_stop_distance_mm")
