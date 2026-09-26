# Summarize stationary RobotState samples collected during Tutorial 5.


# Inputs: nonempty RobotState sequence from the stationary sample run.
# Returns: counts, elapsed seconds, maximum wheel travel, nearest range in
# mm or None, and whether the USER button was pressed.
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
        # dt_s starts at zero on reset, so summing samples gives run duration.
        elapsed_time_s += measurements.dt_s
        # Either wheel drifting from zero can fail a stationary preflight.
        maximum_abs_wheel_position_mm = max(
            maximum_abs_wheel_position_mm,
            abs(measurements.left_position_mm),
            abs(measurements.right_position_mm),
        )
        if measurements.range_mm is not None:
            # Count states with available range; several may share one echo.
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
