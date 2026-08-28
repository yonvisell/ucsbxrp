# Behavior checks for Tutorial 1; this file does not start either robot.

from student_work import (
    average_speed_mm_s,
    range_state,
    route_distance_mm,
    wheel_speed_summary,
)


def _close(actual, expected, tolerance=0.000001):
    if abs(actual - expected) > tolerance:
        raise AssertionError("expected {}, received {}".format(expected, actual))


def _expect_value_error(function, *arguments):
    try:
        function(*arguments)
    except ValueError:
        return
    raise AssertionError("invalid input should raise ValueError")


def _check_average_speed():
    result = average_speed_mm_s(600.0, 4.0)
    if result is None:
        raise NotImplementedError("average_speed_mm_s returned no result")
    _close(result, 150.0)
    _close(average_speed_mm_s(125, 0.5), 250.0)
    _expect_value_error(average_speed_mm_s, -1.0, 2.0)
    _expect_value_error(average_speed_mm_s, 100.0, 0.0)


def _check_route_distance():
    result = route_distance_mm([120.0, 80.0, 50.0])
    if result is None:
        raise NotImplementedError("route_distance_mm returned no result")
    _close(result, 250.0)
    _close(route_distance_mm(()), 0.0)
    _expect_value_error(route_distance_mm, (100.0, -5.0))


def _check_range_state():
    results = (
        range_state(None, 250.0),
        range_state(250.0, 250.0),
        range_state(249.0, 250.0),
        range_state(251.0, 250.0),
    )
    expected = ("unavailable", "stop", "stop", "clear")
    if results != expected:
        raise AssertionError("expected {}, received {}".format(expected, results))
    _expect_value_error(range_state, 200.0, 0.0)


def _check_wheel_speed_summary():
    result = wheel_speed_summary(
        [100.0, 120.0, 140.0],
        (90.0, 110.0, 130.0),
    )
    if result is None:
        raise NotImplementedError("wheel_speed_summary returned no result")
    if not isinstance(result, dict):
        raise AssertionError("wheel_speed_summary should return a dictionary")
    expected_keys = {
        "sample_count",
        "mean_left_mm_s",
        "mean_right_mm_s",
        "mean_difference_mm_s",
    }
    if set(result) != expected_keys:
        raise AssertionError(
            "expected dictionary keys {}, received {}".format(
                sorted(expected_keys), sorted(result)
            )
        )
    if result["sample_count"] != 3:
        raise AssertionError("sample_count should be 3")
    _close(result["mean_left_mm_s"], 120.0)
    _close(result["mean_right_mm_s"], 110.0)
    _close(result["mean_difference_mm_s"], 10.0)
    _expect_value_error(wheel_speed_summary, (), ())
    _expect_value_error(wheel_speed_summary, (100.0,), (90.0, 95.0))


def run_exercise_checks():
    # Run each independent exercise and print a concise outcome.
    checks = (
        ("1 · average speed", _check_average_speed),
        ("2 · route distance", _check_route_distance),
        ("3 · range decision", _check_range_state),
        ("4 · wheel-speed summary", _check_wheel_speed_summary),
    )
    passed = 0
    incomplete = 0
    incorrect = 0
    for label, check in checks:
        try:
            check()
        except NotImplementedError as error:
            incomplete += 1
            print("NOT COMPLETED · {} · {}".format(label, error))
        except Exception as error:
            incorrect += 1
            print("INCORRECT · {} · {}".format(label, error))
        else:
            passed += 1
            print("PASS · " + label)
    print(
        "Tutorial 1: {} passed · {} not completed · {} incorrect".format(
            passed, incomplete, incorrect
        )
    )
    return incorrect == 0 and incomplete == 0


if __name__ == "__main__":
    run_exercise_checks()
