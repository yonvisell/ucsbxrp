# Behavior checks for the Tutorial 2 drawing description.

from student_work import DrawingSegment, TurnSegment, build_drawing
from ucsb_xrp import MotionCommand


def _expect_value_error(constructor, *arguments):
    try:
        constructor(*arguments)
    except ValueError:
        return
    raise AssertionError("invalid segment values should raise ValueError")


def _check_segment_class():
    segment = DrawingSegment("side", 120.0, 0.0, 40)
    expected = ("side", 120.0, 0.0, 40)
    actual = (
        getattr(segment, "name", None),
        getattr(segment, "forward_speed_mm_s", None),
        getattr(segment, "turn_rate_rad_s", None),
        getattr(segment, "steps", None),
    )
    if actual != expected:
        raise AssertionError(
            "expected stored values {}, received {}".format(expected, actual)
        )
    command = segment.command()
    if not isinstance(command, MotionCommand):
        raise AssertionError("DrawingSegment.command should return MotionCommand")
    if (command.forward_speed_mm_s, command.turn_rate_rad_s) != (120.0, 0.0):
        raise AssertionError("MotionCommand should retain the segment command values")
    _expect_value_error(DrawingSegment, "", 120.0, 0.0, 40)
    _expect_value_error(DrawingSegment, "no samples", 120.0, 0.0, 0)
    _expect_value_error(DrawingSegment, "stationary", 0.0, 0.0, 20)


def _check_turn_subclass():
    if not issubclass(TurnSegment, DrawingSegment):
        raise AssertionError("TurnSegment should inherit DrawingSegment")
    turn = TurnSegment("corner", 0.8, 20)
    actual = (
        getattr(turn, "name", None),
        getattr(turn, "forward_speed_mm_s", None),
        getattr(turn, "turn_rate_rad_s", None),
        getattr(turn, "steps", None),
    )
    expected = ("corner", 0.0, 0.8, 20)
    if actual != expected:
        raise AssertionError(
            "expected stored values {}, received {}".format(expected, actual)
        )
    command = turn.command()
    if not isinstance(command, MotionCommand):
        raise AssertionError("inherited command should return MotionCommand")
    if (command.forward_speed_mm_s, command.turn_rate_rad_s) != (0.0, 0.8):
        raise AssertionError("TurnSegment should command an in-place left turn")
    _expect_value_error(TurnSegment, "right", -0.8, 20)
    _expect_value_error(TurnSegment, "stationary", 0.0, 20)


def _check_square_with_values(
    side_speed_mm_s,
    side_steps,
    turn_rate_rad_s,
    turn_steps,
):
    segments = build_drawing(
        side_speed_mm_s=side_speed_mm_s,
        side_steps=side_steps,
        turn_rate_rad_s=turn_rate_rad_s,
        turn_steps=turn_steps,
    )
    if segments is None:
        raise NotImplementedError("build_drawing returned no route")
    if not isinstance(segments, (list, tuple)):
        raise AssertionError("build_drawing should return a list or tuple")
    if len(segments) != 8:
        raise AssertionError(
            "expected 8 alternating segments, received {}".format(len(segments))
        )

    for index, segment in enumerate(segments):
        if not isinstance(segment, DrawingSegment):
            raise AssertionError("route item {} is not a DrawingSegment".format(index + 1))
        if not isinstance(segment.steps, int):
            raise AssertionError("segment {} steps must be an integer".format(index + 1))
        if segment.steps <= 0:
            raise AssertionError("segment {} steps must be positive".format(index + 1))
        if index % 2 == 0:
            if isinstance(segment, TurnSegment):
                raise AssertionError("segment {} should be a side".format(index + 1))
            if segment.forward_speed_mm_s != side_speed_mm_s:
                raise AssertionError(
                    "side {} should use side_speed_mm_s={}".format(
                        index // 2 + 1, side_speed_mm_s
                    )
                )
            if segment.turn_rate_rad_s != 0.0:
                raise AssertionError("a side should have zero turn rate")
            if segment.steps != side_steps:
                raise AssertionError(
                    "side {} should use side_steps={}".format(
                        index // 2 + 1, side_steps
                    )
                )
        else:
            if not isinstance(segment, TurnSegment):
                raise AssertionError("segment {} should be a TurnSegment".format(index + 1))
            if segment.forward_speed_mm_s != 0.0:
                raise AssertionError("a corner should have zero forward speed")
            if segment.turn_rate_rad_s != turn_rate_rad_s:
                raise AssertionError(
                    "corner {} should use turn_rate_rad_s={}".format(
                        index // 2 + 1, turn_rate_rad_s
                    )
                )
            if segment.steps != turn_steps:
                raise AssertionError(
                    "corner {} should use turn_steps={}".format(
                        index // 2 + 1, turn_steps
                    )
                )
        command = segment.command()
        if not isinstance(command, MotionCommand):
            raise AssertionError(
                "segment {} command should be a MotionCommand".format(index + 1)
            )
        if (
            command.forward_speed_mm_s != segment.forward_speed_mm_s
            or command.turn_rate_rad_s != segment.turn_rate_rad_s
        ):
            raise AssertionError(
                "segment {} command does not match its data".format(index + 1)
            )


def _check_drawing():
    _check_square_with_values(
        side_speed_mm_s=90.0,
        side_steps=35,
        turn_rate_rad_s=0.7,
        turn_steps=20,
    )
    _check_square_with_values(
        side_speed_mm_s=125.0,
        side_steps=18,
        turn_rate_rad_s=1.0,
        turn_steps=12,
    )


def run_exercise_checks():
    # Run the three drawing exercises and print a concise outcome.
    checks = (
        ("1 · data object and record", _check_segment_class),
        ("2 · TurnSegment inheritance", _check_turn_subclass),
        ("3 · square drawing", _check_drawing),
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
