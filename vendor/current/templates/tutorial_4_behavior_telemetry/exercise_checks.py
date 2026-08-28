# Behavior checks for the Tutorial 4 state, command, and telemetry functions.

import student_work
from ucsb_xrp import Measurements, MotionCommand, Pose, RobotState


def _expect_value_error(function, *arguments):
    try:
        function(*arguments)
    except ValueError:
        return
    raise AssertionError("invalid input should raise ValueError")


def _close(actual, expected, tolerance=0.000001):
    if abs(actual - expected) > tolerance:
        raise AssertionError("expected {}, received {}".format(expected, actual))


def _check_phase_transitions():
    next_phase = student_work.next_phase
    cases = (
        (student_work.APPROACH, None, 250.0, False, student_work.APPROACH),
        (student_work.APPROACH, 251.0, 250.0, False, student_work.APPROACH),
        (student_work.APPROACH, 250.0, 250.0, False, student_work.TURN),
        (student_work.TURN, 200.0, 250.0, False, student_work.TURN),
        (student_work.TURN, 200.0, 250.0, True, student_work.DONE),
        (student_work.DONE, 200.0, 250.0, True, student_work.DONE),
    )
    for phase, range_mm, stop_mm, complete, expected in cases:
        actual = next_phase(phase, range_mm, stop_mm, complete)
        if actual != expected:
            raise AssertionError(
                "phase {} with range {} and turn_complete {}: expected {}, received {}".format(
                    phase, range_mm, complete, expected, actual
                )
            )
    _expect_value_error(next_phase, "unknown", 300.0, 250.0, False)
    _expect_value_error(next_phase, student_work.APPROACH, 300.0, 0.0, False)


def _check_motion_commands():
    command_for = student_work.command_for_phase
    approach = command_for(student_work.APPROACH, 120.0, 0.8, "left")
    left = command_for(student_work.TURN, 120.0, 0.8, "left")
    right = command_for(student_work.TURN, 120.0, 0.8, "right")
    done = command_for(student_work.DONE, 120.0, 0.8, "left")
    for command in (approach, left, right, done):
        if not isinstance(command, MotionCommand):
            raise AssertionError("each phase should return a MotionCommand")
    actual = (
        (approach.forward_speed_mm_s, approach.turn_rate_rad_s),
        (left.forward_speed_mm_s, left.turn_rate_rad_s),
        (right.forward_speed_mm_s, right.turn_rate_rad_s),
        (done.forward_speed_mm_s, done.turn_rate_rad_s),
    )
    expected = ((120.0, 0.0), (0.0, 0.8), (0.0, -0.8), (0.0, 0.0))
    if actual != expected:
        raise AssertionError("expected commands {}, received {}".format(expected, actual))
    _expect_value_error(command_for, "unknown", 120.0, 0.8, "left")
    _expect_value_error(command_for, student_work.APPROACH, 0.0, 0.8, "left")
    _expect_value_error(command_for, student_work.TURN, 120.0, 0.0, "left")
    _expect_value_error(command_for, student_work.TURN, 120.0, 0.8, "up")


class _LiveRecorder:
    def __init__(self):
        self.watches = []
        self.plots = []

    def watch(self, name, value, unit="", label=None):
        self.watches.append((name, value, unit))

    def plot(self, name, value, unit="", label=None):
        self.plots.append((name, value, unit))


def _check_telemetry():
    measurements = Measurements(
        100,
        0.02,
        140.0,
        160.0,
        2.0,
        2.0,
        100.0,
        100.0,
        275.0,
        False,
    )
    state = RobotState(measurements, Pose(50.0, 20.0, 0.4))
    recorder = _LiveRecorder()
    original_live = student_work.live
    student_work.live = recorder
    try:
        student_work.publish_telemetry(state, student_work.APPROACH)
    finally:
        student_work.live = original_live
    watches = dict((name, (value, unit)) for name, value, unit in recorder.watches)
    plots = dict((name, (value, unit)) for name, value, unit in recorder.plots)
    expected_watches = {
        "phase": (student_work.APPROACH, ""),
        "range_mm": (275.0, "mm"),
    }
    if watches != expected_watches:
        raise AssertionError(
            "expected watch values {}, received {}".format(
                expected_watches, watches
            )
        )
    if set(plots) != {"wheel_distance_mm", "heading_rad"}:
        raise AssertionError(
            "expected wheel_distance_mm and heading_rad plot signals"
        )
    if plots["wheel_distance_mm"][1] != "mm" or plots["heading_rad"][1] != "rad":
        raise AssertionError("plot signals should retain their stated units")
    _close(plots["wheel_distance_mm"][0], 150.0)
    _close(plots["heading_rad"][0], 0.4)

    no_range = RobotState(
        Measurements(120, 0.02, 142.0, 162.0, 2.0, 2.0, 100.0, 100.0, None, False),
        Pose(52.0, 20.0, 0.4),
    )
    recorder = _LiveRecorder()
    student_work.live = recorder
    try:
        student_work.publish_telemetry(no_range, student_work.APPROACH)
    finally:
        student_work.live = original_live
    watches = dict((name, value) for name, value, _unit in recorder.watches)
    if watches.get("range_mm") != "unavailable":
        raise AssertionError("publish 'unavailable' when no range is available")


def run_exercise_checks():
    # Run each independent exercise and print a concise outcome.
    checks = (
        ("1 · phase transitions", _check_phase_transitions),
        ("2 · motion commands", _check_motion_commands),
        ("3 · telemetry", _check_telemetry),
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
        "Tutorial 4: {} passed · {} not completed · {} incorrect".format(
            passed, incomplete, incorrect
        )
    )
    return incorrect == 0 and incomplete == 0


if __name__ == "__main__":
    run_exercise_checks()
