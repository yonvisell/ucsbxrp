# Behavior check for the Tutorial 5 stationary preflight report.

from student_work import preflight_report
from ucsb_xrp import Measurements, Pose, RobotState


def _close(actual, expected, tolerance=0.000001):
    if abs(actual - expected) > tolerance:
        raise AssertionError("expected {}, received {}".format(expected, actual))


def _state(
    time_ms,
    dt_s,
    left_position_mm,
    right_position_mm,
    range_mm,
    button_pressed,
):
    measurements = Measurements(
        time_ms,
        dt_s,
        left_position_mm,
        right_position_mm,
        0.0,
        0.0,
        0.0,
        0.0,
        range_mm,
        button_pressed,
    )
    return RobotState(measurements, Pose(0.0, 0.0, 0.0))


def _check_preflight_report():
    states = (
        _state(0, 0.0, 0.0, 0.0, None, False),
        _state(20, 0.02, 0.1, -0.2, 420.0, False),
        _state(40, 0.02, 0.2, -0.4, 380.0, True),
    )
    report = preflight_report(states)
    if report is None:
        raise NotImplementedError("preflight_report returned no result")
    if not isinstance(report, dict):
        raise AssertionError("preflight_report should return a dictionary")
    expected_keys = {
        "sample_count",
        "elapsed_time_s",
        "maximum_abs_wheel_position_mm",
        "usable_range_count",
        "nearest_range_mm",
        "button_was_pressed",
    }
    if set(report) != expected_keys:
        raise AssertionError(
            "expected dictionary keys {}, received {}".format(
                sorted(expected_keys), sorted(report)
            )
        )
    if report["sample_count"] != 3:
        raise AssertionError("sample_count should be 3")
    _close(report["elapsed_time_s"], 0.04)
    _close(report["maximum_abs_wheel_position_mm"], 0.4)
    if report["usable_range_count"] != 2:
        raise AssertionError("usable_range_count should be 2")
    _close(report["nearest_range_mm"], 380.0)
    if report["button_was_pressed"] is not True:
        raise AssertionError("button_was_pressed should be True")

    unavailable = preflight_report(
        (
            _state(0, 0.0, 0.0, 0.0, None, False),
            _state(20, 0.02, 0.0, 0.0, None, False),
        )
    )
    if unavailable["usable_range_count"] != 0:
        raise AssertionError("usable_range_count should be zero without range")
    if unavailable["nearest_range_mm"] is not None:
        raise AssertionError("nearest_range_mm should be None without range")

    try:
        preflight_report(())
    except ValueError:
        pass
    else:
        raise AssertionError("an empty state collection should raise ValueError")


def run_exercise_checks():
    # Run the report exercise and print one clear outcome.
    try:
        _check_preflight_report()
    except NotImplementedError as error:
        print("NOT COMPLETED · stationary preflight report · " + str(error))
        print("Tutorial 5: 0 passed · 1 not completed · 0 incorrect")
        return False
    except Exception as error:
        print("INCORRECT · stationary preflight report · " + str(error))
        print("Tutorial 5: 0 passed · 0 not completed · 1 incorrect")
        return False
    print("PASS · stationary preflight report")
    print("Tutorial 5: 1 passed · 0 not completed · 0 incorrect")
    return True


if __name__ == "__main__":
    run_exercise_checks()
