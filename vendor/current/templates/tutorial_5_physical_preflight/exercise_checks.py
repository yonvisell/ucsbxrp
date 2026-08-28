# Check each field of the Tutorial 5 report without starting a robot.

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


SAMPLE_STATES = (
    _state(0, 0.0, 0.0, 0.0, None, False),
    _state(20, 0.02, 0.1, -0.2, 420.0, False),
    _state(40, 0.02, 0.2, -0.4, 380.0, True),
)


def _read_report():
    report = preflight_report(SAMPLE_STATES)
    if report is None:
        raise NotImplementedError("preflight_report returned no result")
    if not isinstance(report, dict):
        raise AssertionError("return a dictionary")
    return report


def _check_sample_count(report):
    if report.get("sample_count") != 3:
        raise AssertionError("sample_count: expected 3, received {}".format(report.get("sample_count")))
    try:
        preflight_report(())
    except ValueError:
        return
    raise AssertionError("raise ValueError for an empty collection")


def _check_elapsed_time(report):
    _close(report.get("elapsed_time_s"), 0.04)


def _check_wheel_position(report):
    _close(report.get("maximum_abs_wheel_position_mm"), 0.4)


def _check_range_count(report):
    if report.get("usable_range_count") != 2:
        raise AssertionError("expected 2, received {}".format(report.get("usable_range_count")))


def _check_nearest_range(report):
    _close(report.get("nearest_range_mm"), 380.0)
    no_range = preflight_report(
        (
            _state(0, 0.0, 0.0, 0.0, None, False),
            _state(20, 0.02, 0.0, 0.0, None, False),
        )
    )
    if no_range.get("nearest_range_mm") is not None:
        raise AssertionError("nearest_range_mm should be None without a measurement")


def _check_button(report):
    if report.get("button_was_pressed") is not True:
        raise AssertionError("button_was_pressed should be True")


def run_exercise_checks():
    try:
        report = _read_report()
    except NotImplementedError as error:
        print("NOT COMPLETED · preflight report · " + str(error))
        print("  Next: initialize the six result values, update them in one loop, and return a dictionary.")
        print("Tutorial 5: 0 passed · 1 not completed · 0 incorrect")
        return False
    except Exception as error:
        print("INCORRECT · preflight report · " + str(error))
        print("Tutorial 5: 0 passed · 0 not completed · 1 incorrect")
        return False

    checks = (
        ("sample count", _check_sample_count),
        ("elapsed time", _check_elapsed_time),
        ("maximum wheel position", _check_wheel_position),
        ("usable range count", _check_range_count),
        ("nearest range", _check_nearest_range),
        ("USER button", _check_button),
    )
    passed = 0
    incorrect = 0
    for label, check in checks:
        try:
            check(report)
        except Exception as error:
            incorrect += 1
            print("INCORRECT · {} · {}".format(label, error))
        else:
            passed += 1
            print("PASS · " + label)
    print("Tutorial 5: {} passed · 0 not completed · {} incorrect".format(passed, incorrect))
    return incorrect == 0


if __name__ == "__main__":
    run_exercise_checks()
