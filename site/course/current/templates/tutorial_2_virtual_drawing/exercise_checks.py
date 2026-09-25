# Check measured Tutorial 2 segments without starting a robot.

from math import pi

from student_work import DrawingSegment, TurnSegment, build_drawing
from ucsb_xrp import Measurements, MotionCommand, Pose, RobotState


def _state(left_mm, right_mm, heading_rad):
    measurements = Measurements(
        20, 0.02, left_mm, right_mm, 0.0, 0.0, 0.0, 0.0, None, False
    )
    return RobotState(measurements, Pose(0.0, 0.0, heading_rad))


def _expect_value_error(constructor, *arguments):
    try:
        constructor(*arguments)
    except ValueError:
        return
    raise AssertionError("invalid segment values should raise ValueError")


def _check_straight_segment():
    segment = DrawingSegment("side", 120.0, 100.0)
    command = segment.command()
    if not isinstance(command, MotionCommand):
        raise AssertionError("command() must return MotionCommand")
    if (command.forward_speed_mm_s, command.turn_rate_rad_s) != (120.0, 0.0):
        raise AssertionError("straight segment must request 120 mm/s and zero turn")
    start = _state(30.0, 34.0, 0.0)
    if segment.is_complete(start, _state(129.0, 133.0, 0.0)):
        raise AssertionError("99 mm of mean wheel travel is short of 100 mm")
    if not segment.is_complete(start, _state(131.0, 135.0, 0.0)):
        raise AssertionError("101 mm of mean wheel travel reaches 100 mm")
    _expect_value_error(DrawingSegment, "", 120.0, 100.0)
    _expect_value_error(DrawingSegment, "side", 0.0, 100.0)
    _expect_value_error(DrawingSegment, "side", 120.0, 0.0)


def _check_turn_segment():
    turn = TurnSegment("corner", 0.8, pi / 2.0)
    command = turn.command()
    if not isinstance(command, MotionCommand):
        raise AssertionError("command() must return MotionCommand")
    if (command.forward_speed_mm_s, command.turn_rate_rad_s) != (0.0, 0.8):
        raise AssertionError("turn segment must request zero forward and 0.8 rad/s")
    start = _state(0.0, 0.0, 0.2)
    if turn.is_complete(start, _state(-60.0, 60.0, 1.7)):
        raise AssertionError("1.5 rad is short of a quarter turn")
    if not turn.is_complete(start, _state(-65.0, 65.0, 1.8)):
        raise AssertionError("1.6 rad completes a quarter turn")
    _expect_value_error(TurnSegment, "", 0.8, pi / 2.0)
    _expect_value_error(TurnSegment, "corner", 0.0, pi / 2.0)
    _expect_value_error(TurnSegment, "corner", 0.8, 0.0)


def _check_drawing():
    for side_mm, angle_rad in ((100.0, pi / 2.0), (180.0, 1.0)):
        segments = build_drawing(120.0, side_mm, 0.8, angle_rad)
        if not isinstance(segments, (list, tuple)) or len(segments) != 8:
            raise AssertionError("build_drawing must return four sides and four corners")
        for index, segment in enumerate(segments):
            if index % 2 == 0:
                if not isinstance(segment, DrawingSegment):
                    raise AssertionError("segment {} should be a straight side".format(index + 1))
                if segment.distance_mm != side_mm:
                    raise AssertionError("straight sides must use the requested distance")
            else:
                if not isinstance(segment, TurnSegment):
                    raise AssertionError("segment {} should be a turn".format(index + 1))
                if segment.angle_rad != angle_rad:
                    raise AssertionError("corners must use the requested angle")


def run_exercise_checks():
    checks = (
        ("1 · measured straight segment", _check_straight_segment),
        ("2 · measured turn segment", _check_turn_segment),
        ("3 · ordered drawing", _check_drawing),
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
        "Tutorial 2: {} passed · {} not completed · {} incorrect".format(
            passed, incomplete, incorrect
        )
    )
    return incorrect == 0 and incomplete == 0


if __name__ == "__main__":
    run_exercise_checks()
