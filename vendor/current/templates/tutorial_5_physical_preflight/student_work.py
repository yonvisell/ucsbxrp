# Runnable summary of RobotState samples collected during Tutorial 5.


def preflight_report(states: object) -> dict:
    if not states:
        raise ValueError("states must not be empty")
    elapsed_time_s = 0.0
    maximum_abs_wheel_position_mm = 0.0
    usable_range_count = 0
    nearest_range_mm = None
    button_was_pressed = False
    for state in states:
        measurements = state.measurements
        elapsed_time_s += measurements.dt_s
        maximum_abs_wheel_position_mm = max(
            maximum_abs_wheel_position_mm,
            abs(measurements.left_position_mm),
            abs(measurements.right_position_mm),
        )
        if measurements.range_mm is not None:
            usable_range_count += 1
            if nearest_range_mm is None or measurements.range_mm < nearest_range_mm:
                nearest_range_mm = measurements.range_mm
        button_was_pressed = button_was_pressed or measurements.button_pressed
    return {
        "sample_count": len(states),
        "elapsed_time_s": elapsed_time_s,
        "maximum_abs_wheel_position_mm": maximum_abs_wheel_position_mm,
        "usable_range_count": usable_range_count,
        "nearest_range_mm": nearest_range_mm,
        "button_was_pressed": button_was_pressed,
    }
