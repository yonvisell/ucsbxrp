"""Behavior checks for the Tutorial 2 drawing description."""

from student_work import DrawingSegment, build_drawing


def _expect_value_error(*arguments):
    try:
        DrawingSegment(*arguments)
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
        raise AssertionError("expected stored values {}, received {}".format(expected, actual))
    _expect_value_error("", 120.0, 0.0, 40)
    _expect_value_error("no samples", 120.0, 0.0, 0)
    _expect_value_error("stationary", 0.0, 0.0, 20)


def _check_drawing():
    segments = build_drawing()
    if segments is None:
        raise NotImplementedError("build_drawing returned no route")
    if not isinstance(segments, (list, tuple)):
        raise AssertionError("build_drawing should return a list or tuple")
    if len(segments) != 8:
        raise AssertionError("expected 8 alternating segments, received {}".format(len(segments)))

    total_steps = 0
    for index, segment in enumerate(segments):
        if not isinstance(segment, DrawingSegment):
            raise AssertionError("route item {} is not a DrawingSegment".format(index + 1))
        if not isinstance(segment.steps, int) or isinstance(segment.steps, bool):
            raise AssertionError("segment {} steps must be an integer".format(index + 1))
        if segment.steps <= 0:
            raise AssertionError("segment {} steps must be positive".format(index + 1))
        total_steps += segment.steps
        if index % 2 == 0:
            if segment.forward_speed_mm_s <= 0.0 or segment.turn_rate_rad_s != 0.0:
                raise AssertionError("segment {} should be a straight side".format(index + 1))
        elif segment.forward_speed_mm_s != 0.0 or segment.turn_rate_rad_s <= 0.0:
            raise AssertionError("segment {} should be a left turn".format(index + 1))
    if total_steps > 500:
        raise AssertionError("the complete drawing may contain at most 500 samples")


def run_exercise_checks():
    """Run the two drawing exercises and print a concise outcome."""
    checks = (
        ("1 · DrawingSegment", _check_segment_class),
        ("2 · square route", _check_drawing),
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
