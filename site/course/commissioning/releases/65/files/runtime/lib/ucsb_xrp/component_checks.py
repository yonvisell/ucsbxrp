"""Supplied hardware-free checks for course component implementations."""

from math import cos, pi, sin

from .config import NavigationConfig, RobotConfig
from .maps import OccupancyGrid
from .records import (
    DriveCommand,
    Measurements,
    ReflectanceReadings,
    GridCell,
    GridPath,
    MotionCommand,
    NavigationGoal,
    Pose,
    RawSensors,
    WheelSpeeds,
)


# These bands check software calculations, not physical sensor accuracy.
from .check_support import comparison, finite_number, format_number

_report_callback = None
_report = None
_active_case = None


def get_check_report():
    """Return the latest JSON-safe report; None means no shared checks ran."""
    return _report


def _publish():
    if _report_callback is not None:
        import json
        _report_callback(json.dumps(_report))


def _data(value):
    if value is None or isinstance(value, (str, bool, int)):
        return value
    if isinstance(value, float):
        return value if value == value and abs(value) != float("inf") else str(value)
    if isinstance(value, (tuple, list)):
        return [_data(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _data(item) for key, item in value.items()}
    fields = getattr(value, "_field_names", ())
    if not fields:
        fields = getattr(value, "__slots__", ())
    if fields:
        return {name.lstrip("_"): _data(getattr(value, name)) for name in fields}
    return str(value)


def _units(label):
    if "mm/s" in label or "speed_mm_s" in label:
        return "mm/s"
    if "rad/s" in label:
        return "rad/s"
    if "rad" in label:
        return "rad"
    if "dt_s" in label or "time_s" in label:
        return "s"
    if "mm" in label:
        return "mm"
    return "dimensionless"


def _close(label, actual, expected, tolerance=None, exact=False):
    units = _units(label)
    detail = comparison(label, actual, expected, units, tolerance, exact)
    if _active_case is not None:
        _active_case["observations"].append(detail)
        _active_case.update({"actual": _data(actual), "units": units,
                             "tolerance": detail["tolerance"]})
    if not detail["passed"]:
        raise AssertionError(detail["message"])


def _change(label, earlier, later, direction, deadband, units, context=None):
    finite_number(label + " earlier", earlier)
    finite_number(label + " later", later)
    delta = later - earlier
    passed = direction * delta > deadband
    earlier_label = context["earlier_label"] if context else "earlier"
    later_label = context["later_label"] if context else "later"
    message = (
        "{}: {} {} {}, {} {} {}; change {} {}. This example requires "
        "{} greater than {} {}. Compare the input samples, elapsed intervals, "
        "and response settings; the signs of the two outputs do not determine "
        "their direction of change."
    ).format(label, earlier_label, format_number(earlier), units,
             later_label, format_number(later), units,
             format_number(delta), units, "an increase" if direction > 0 else "a decrease",
             format_number(deadband), units)
    if _active_case is not None:
        _active_case.update({"actual": later, "units": units, "tolerance": {"deadband": deadband}})
        if context is not None:
            _active_case["comparison_context"] = _data(context)
            _active_case["source"]["method"] = context["method"]
        _active_case["observations"].append({"field": label, "actual": later,
            "earlier": earlier, "difference": delta, "units": units,
            "expected": "increase" if direction > 0 else "decrease",
            "tolerance": {"deadband": deadband}, "passed": passed, "message": message,
            "context": _data(context)})
    if not passed:
        raise AssertionError(message)


def _record(value, expected_type, method):
    if not isinstance(value, expected_type):
        raise AssertionError("{}() must return {}; received {} ({}). Check the return statement and required record fields.".format(
            method, expected_type.__name__, _data(value), type(value).__name__))
    for name in value._field_names:
        field = getattr(value, name)
        if name in ("range_mm", "reflectance") and field is None:
            continue
        if name == "button_pressed":
            if not isinstance(field, bool):
                raise AssertionError("Measurements.button_pressed must be Boolean; its returned type was {}. Preserve raw.button_pressed without converting it to a number.".format(type(field).__name__))
        elif name == "time_ms":
            if isinstance(field, bool) or not isinstance(field, int):
                raise AssertionError("Measurements.time_ms must be an integer timestamp. Preserve raw.time_ms without converting it to seconds.")
        elif name == "reflectance":
            _record(field, ReflectanceReadings, method)
        else:
            finite_number(method + "()." + name, field)
    if expected_type is Pose and not -pi <= value.heading_rad < pi:
        raise AssertionError("Pose.heading_rad must be represented in [-pi, pi); wrap the updated heading.")
    return value


class _CheckedInstance:
    """Capture fixture calls and validate returned records before arithmetic."""
    def __init__(self, instance, contract):
        self.instance = instance
        self.contract = contract
        self.previous_raw = None

    def __getattr__(self, name):
        value = getattr(self.instance, name)
        if not callable(value):
            return value
        def call(*args):
            entry = {"method": name, "args": _data(args)}
            if self.contract in ("sensor_model", "reflectance") and name in ("reset", "update"):
                if name == "update" and self.previous_raw is not None:
                    entry["previous"] = _data(self.previous_raw)
                self.previous_raw = args[0]
            _active_case["source"]["method"] = name
            inputs = _active_case["inputs"]
            inputs.append(entry)
            if len(inputs) > 64:
                inputs.pop(4)
                _active_case["omitted_inputs"] = _active_case.get("omitted_inputs", 0) + 1
            _active_case.pop("comparison_context", None)
            _active_case.update({"actual": None, "units": None, "tolerance": None})
            result = value(*args)
            entry["result"] = _data(result)
            _active_case["actual"] = entry["result"]
            expected_type = None
            if self.contract in ("sensor_model", "reflectance") and name in ("reset", "update"):
                expected_type = Measurements
            elif self.contract in ("odometry", "pose_corrector") and name in ("reset", "update", "observe_x", "observe_y", "corrected_pose"):
                expected_type = Pose
            elif self.contract == "differential_drive" and name == "wheel_speeds":
                expected_type = WheelSpeeds
            elif self.contract == "wheel_speed_controller" and name == "update":
                expected_type = DriveCommand
            elif self.contract in ("navigation_controller", "line_follower") and name == "update":
                expected_type = MotionCommand
            if expected_type is not None:
                _record(result, expected_type, name)
            elif self.contract == "range_safety_controller" and name == "update":
                finite_number("update() result (mm/s)", result)
            elif self.contract == "range_estimator" and name == "estimate_range" and result is not None:
                finite_number("estimate_range() result (mm)", result)
            elif name == "is_complete" and not isinstance(result, bool):
                raise AssertionError("NavigationController.is_complete() must return a Boolean. Return True when the route is complete and False otherwise.")
            return result
        return call


def _factory(component_class, contract):
    def construct(*args):
        _active_case["source"]["method"] = "__init__"
        _active_case["configuration"] = _data(args)
        _active_case["inputs"].append({"method": "__init__", "args": _data(args)})
        instance = component_class(*args)
        if contract in ("range_safety_controller", "pose_corrector", "visit_order_planner"):
            from .student_api import RangeSafetyControllerBase, PoseCorrectorBase, VisitOrderPlannerBase
            base = {"range_safety_controller": RangeSafetyControllerBase,
                    "pose_corrector": PoseCorrectorBase, "visit_order_planner": VisitOrderPlannerBase}[contract]
            if not isinstance(instance, base):
                raise AssertionError("The component class must extend " + base.__name__ + ".")
        return _CheckedInstance(instance, contract)
    return construct


def _sensor_model(component_class):
    config = RobotConfig(
        sample_period_ms=20,
        wheel_diameter_mm=60.0,
        encoder_counts_per_revolution=600.0,
        left_encoder_sign=-1,
        right_encoder_sign=1,
        wheel_speed_filter_time_constant_ms=80.0,
    )
    model = component_class(config)
    zero = model.reset(RawSensors(100, 10, 20, 500.0, False))
    _close("reset dt_s", zero.dt_s, 0.0, exact=True)
    _close("reset left position (mm)", zero.left_position_mm, 0.0, exact=True)
    _close("reset right position (mm)", zero.right_position_mm, 0.0, exact=True)
    _close("reset left increment (mm)", zero.left_increment_mm, 0.0, exact=True)
    _close("reset right increment (mm)", zero.right_increment_mm, 0.0, exact=True)
    _close("reset left speed (mm/s)", zero.left_speed_mm_s, 0.0, exact=True)
    _close("reset right speed (mm/s)", zero.right_speed_mm_s, 0.0, exact=True)
    _close("preserved reset range (mm)", zero.range_mm, 500.0, exact=True)
    if zero.time_ms != 100 or zero.button_pressed is not False:
        raise AssertionError("reset() must preserve raw.time_ms=100 and raw.button_pressed=False exactly.")
    measured = model.update(RawSensors(125, 9, 21, 450.0, True))
    if measured.time_ms != 125:
        raise AssertionError("update() must preserve raw.time_ms=125 exactly.")
    _close("update dt_s from device time", measured.dt_s, 0.025)
    _close("left position (mm)", measured.left_position_mm, pi / 10.0)
    _close("right position (mm)", measured.right_position_mm, pi / 10.0)
    _close("left increment (mm)", measured.left_increment_mm, pi / 10.0)
    _close("right increment (mm)", measured.right_increment_mm, pi / 10.0)
    if measured.button_pressed is not True:
        raise AssertionError("SensorProcessor.update() did not preserve the USER button state. Return raw.button_pressed in Measurements.button_pressed.")
    _close("preserved update range (mm)", measured.range_mm, 450.0, exact=True)

    next_measured = model.update(RawSensors(165, 7, 23, None, False))
    if next_measured.range_mm is not None or next_measured.button_pressed is not False or next_measured.time_ms != 165:
        raise AssertionError("update() must preserve missing range as None, button False, and timestamp 165 exactly.")
    _close("next dt_s from device time", next_measured.dt_s, 0.04)
    _close("cumulative left position (mm)", next_measured.left_position_mm, 3.0 * pi / 10.0)
    _close("latest left increment (mm)", next_measured.left_increment_mm, 2.0 * pi / 10.0)
    _close("cumulative right position (mm)", next_measured.right_position_mm, 3.0 * pi / 10.0)
    _close("latest right increment (mm)", next_measured.right_increment_mm, 2.0 * pi / 10.0)
    # A second geometry and sign convention makes this a behavior check rather
    # than a fixture whose few numerical answers can be memorized.
    varied_model = component_class(
        RobotConfig(
            sample_period_ms=30,
            wheel_diameter_mm=40.0,
            encoder_counts_per_revolution=400.0,
            left_encoder_sign=1,
            right_encoder_sign=-1,
            wheel_speed_filter_time_constant_ms=60.0,
        )
    )
    varied_model.reset(RawSensors(900, -5, 12, None, False))
    varied = varied_model.update(RawSensors(930, -1, 8, 525.0, True))
    _close("varied-config dt_s", varied.dt_s, 0.03)
    _close("varied-config left position (mm)", varied.left_position_mm, 2.0 * pi / 5.0)
    _close("varied-config right position (mm)", varied.right_position_mm, 2.0 * pi / 5.0)
    _close("varied-config left increment (mm)", varied.left_increment_mm, 2.0 * pi / 5.0)
    _close("varied-config right increment (mm)", varied.right_increment_mm, 2.0 * pi / 5.0)
    _close("varied-config preserved range (mm)", varied.range_mm, 525.0, exact=True)
    if varied.button_pressed is not True:
        raise AssertionError("SensorProcessor.update() did not preserve the USER button state with the second example configuration. Return raw.button_pressed in Measurements.button_pressed.")
    _sensor_speed_sequences(component_class)
    return (
        "update() used elapsed intervals of {:.3g} and {:.3g} s. "
        "It returned left/right positions of {:.3g}/{:.3g} mm and latest "
        "increments of {:.3g}/{:.3g} mm. The first two left speed estimates "
        "were {:.3g} and {:.3g} mm/s; the right estimates were {:.3g} and {:.3g} mm/s. "
        "The second geometry produced left/right positions of {:.3g}/{:.3g} mm. "
        "The subsequent warm-up, response, stationary, reversal and reset examples also passed."
    ).format(
        measured.dt_s,
        next_measured.dt_s,
        next_measured.left_position_mm,
        next_measured.right_position_mm,
        next_measured.left_increment_mm,
        next_measured.right_increment_mm,
        measured.left_speed_mm_s,
        next_measured.left_speed_mm_s,
        measured.right_speed_mm_s,
        next_measured.right_speed_mm_s,
        varied.left_position_mm,
        varied.right_position_mm,
    )


def _wheel_speed_controller(component_class):
    config = RobotConfig(
        left_start_command=0.1,
        right_start_command=0.1,
        left_speed_command_gain=0.002,
        right_speed_command_gain=0.002,
        wheel_speed_kp=0.001,
        max_drive_command=0.6,
    )
    controller = component_class(config)
    controller.reset()
    close_command = controller.update(
        WheelSpeeds(100.0, -100.0),
        WheelSpeeds(80.0, -80.0),
    )
    if not isinstance(close_command, DriveCommand):
        raise AssertionError("WheelSpeedController.update() must return a DriveCommand containing the left and right normalized motor commands.")
    if close_command.left <= 0.0 or close_command.right >= 0.0:
        raise AssertionError(
            (
                "For the requested wheel speeds, update() must produce a positive left command and a negative right command. "
                "It returned left={} and right={}. Check each requested-speed sign."
            ).format(
                format_number(close_command.left), format_number(close_command.right)
            )
        )
    if abs(close_command.left) > 0.6 or abs(close_command.right) > 0.6:
        raise AssertionError("WheelSpeedController.update() returned a command outside the configured max_drive_command limit. Limit both motor commands in both directions.")
    controller.reset()
    underspeed_command = controller.update(
        WheelSpeeds(100.0, -100.0),
        WheelSpeeds(20.0, -20.0),
    )
    _change("left command response to larger positive speed error", close_command.left,
            underspeed_command.left, 1, 0.0001, "normalized command")
    _change("right command response to larger negative speed error", close_command.right,
            underspeed_command.right, -1, 0.0001, "normalized command")
    if abs(underspeed_command.left) > 0.6 or abs(underspeed_command.right) > 0.6:
        raise AssertionError("WheelSpeedController.update() returned a command outside the configured max_drive_command limit. Limit both motor commands in both directions.")
    controller.reset()
    stopped = controller.update(
        WheelSpeeds(0.0, 0.0),
        WheelSpeeds(20.0, -20.0),
    )
    if stopped.left != 0.0 or stopped.right != 0.0:
        raise AssertionError(
            "For zero wheel-speed targets, update() must return left=0.0 and right=0.0. It returned left={} and right={}. Handle a zero target before applying the starting command.".format(
                format_number(stopped.left), format_number(stopped.right)
            )
        )
    controller.reset()
    reverse_and_stop = controller.update(
        WheelSpeeds(-70.0, 0.0),
        WheelSpeeds(-40.0, 35.0),
    )
    if reverse_and_stop.left >= 0.0:
        raise AssertionError(
            "For the reverse left-wheel target, update() must return a negative left command. It returned {}. Check the requested-speed sign.".format(
                format_number(reverse_and_stop.left)
            )
        )
    if reverse_and_stop.right != 0.0:
        raise AssertionError(
            "For the stopped right wheel, update() must return right=0.0 even when the left wheel reverses. It returned {}. Apply the zero-target rule separately to each wheel.".format(
                format_number(reverse_and_stop.right)
            )
        )
    if abs(reverse_and_stop.left) > 0.6:
        raise AssertionError("WheelSpeedController.update() returned a reverse command outside max_drive_command. Apply the configured limit to negative as well as positive commands.")
    return (
        "For left/right targets of +100/-100 mm/s, update() returned normalized "
        "commands of {:.3g}/{:.3g} at measured speeds of +80/-80 mm/s and "
        "{:.3g}/{:.3g} at +20/-20 mm/s. Zero targets produced exact zero commands. "
        "The reverse-left/stop-right request produced {:.3g}/0."
    ).format(
        close_command.left,
        close_command.right,
        underspeed_command.left,
        underspeed_command.right,
        reverse_and_stop.left,
    )


def _range_estimator(component_class):
    model = component_class(RobotConfig())
    samples = (
        None,
        True,
        400.0,
        float("nan"),
        float("inf"),
        -2.0,
        100.0,
        300.0,
        200.0,
    )
    _close("mixed-sample median (mm)", model.estimate_range(samples, 3), 250.0)
    if model.estimate_range(samples, 5) is not None:
        raise AssertionError("SensorProcessor.estimate_range() must return None when too few usable readings remain. Count readings after rejecting invalid samples.")
    _close("odd-count median (mm)", model.estimate_range((500.0, 100.0, 300.0), 3), 300.0)
    _close("even-count median (mm)", model.estimate_range((500.0, 100.0, 300.0, 200.0), 4), 250.0)
    try:
        model.estimate_range((100.0,), 0)
    except (TypeError, ValueError):
        pass
    else:
        raise AssertionError("SensorProcessor.estimate_range() must reject minimum_usable=0 with TypeError or ValueError. Validate the minimum count before selecting a median.")
    return "estimate_range() returned 250 mm for the mixed samples and 300/250 mm for the odd/even sample sets. It returned None when too few usable readings remained and rejected a zero minimum count."


def _differential_drive(component_class):
    drive = component_class(RobotConfig(track_width_mm=100.0))
    straight = drive.wheel_speeds(MotionCommand(80.0, 0.0))
    _close("straight left target (mm/s)", straight.left_mm_s, 80.0)
    _close("straight right target (mm/s)", straight.right_mm_s, 80.0)
    speeds = drive.wheel_speeds(MotionCommand(100.0, 2.0))
    _close("moving-turn left target (mm/s)", speeds.left_mm_s, 0.0)
    _close("moving-turn right target (mm/s)", speeds.right_mm_s, 200.0)
    turn = drive.wheel_speeds(MotionCommand(0.0, -1.0))
    _close("right-turn left target (mm/s)", turn.left_mm_s, 50.0)
    _close("right-turn right target (mm/s)", turn.right_mm_s, -50.0)
    wide_drive = component_class(RobotConfig(track_width_mm=140.0))
    reverse_curve = wide_drive.wheel_speeds(MotionCommand(-30.0, 0.5))
    _close("varied-track left target (mm/s)", reverse_curve.left_mm_s, -65.0)
    _close("varied-track right target (mm/s)", reverse_curve.right_mm_s, 5.0)
    return (
        "wheel_speeds() returned left/right targets of 80/80 mm/s for straight "
        "motion, 0/200 mm/s for the moving turn, and 50/-50 mm/s for the in-place "
        "right turn. With a 140 mm track width, the reverse curve produced -65/5 mm/s."
    )


def _odometry(component_class):
    odometry = component_class(RobotConfig(track_width_mm=100.0))
    initial = odometry.reset(Pose(0.0, 0.0, 0.0))
    if initial != Pose(0.0, 0.0, 0.0) or odometry.pose != initial:
        raise AssertionError("Odometry.reset() must return the initial Pose and expose the same value through the pose property. Store the supplied initial pose before integrating increments.")
    pose = odometry.update(10.0, 10.0)
    _close("straight x (mm)", pose.x_mm, 10.0)
    _close("straight y (mm)", pose.y_mm, 0.0)
    _close("straight heading (rad)", pose.heading_rad, 0.0)
    odometry.reset(Pose(0.0, 0.0, 0.0))
    turn = odometry.update(-50.0, 50.0)
    _close("in-place turn x (mm)", turn.x_mm, 0.0)
    _close("in-place turn y (mm)", turn.y_mm, 0.0)
    _close("in-place turn heading (rad)", turn.heading_rad, 1.0)
    odometry.reset(Pose(0.0, 0.0, 0.0))
    curve = odometry.update(0.0, 100.0)
    expected_radius_mm = 50.0
    _close("curved x (mm)", curve.x_mm, expected_radius_mm * sin(1.0), 0.05)
    _close(
        "curved y (mm)",
        curve.y_mm,
        expected_radius_mm * (1.0 - cos(1.0)),
        0.05,
    )
    _close("curved heading (rad)", curve.heading_rad, 1.0)
    if odometry.pose != curve:
        raise AssertionError("Odometry.pose must contain the latest Pose returned by update(). Store the updated estimate as well as returning it.")

    varied_start = Pose(20.0, -30.0, 3.0)
    odometry.reset(varied_start)
    wrapped_curve = odometry.update(-10.0, 20.0)
    heading_change = 0.3
    radius_mm = 5.0 / heading_change
    unwrapped_heading = varied_start.heading_rad + heading_change
    expected_x_mm = varied_start.x_mm + radius_mm * (
        sin(unwrapped_heading) - sin(varied_start.heading_rad)
    )
    expected_y_mm = varied_start.y_mm - radius_mm * (
        cos(unwrapped_heading) - cos(varied_start.heading_rad)
    )
    expected_wrapped = Pose(expected_x_mm, expected_y_mm, unwrapped_heading)
    _close("varied-start curved x (mm)", wrapped_curve.x_mm, expected_wrapped.x_mm)
    _close("varied-start curved y (mm)", wrapped_curve.y_mm, expected_wrapped.y_mm)
    _close(
        "varied-start wrapped heading (rad)",
        wrapped_curve.heading_rad,
        expected_wrapped.heading_rad,
    )
    return (
        "update() placed the robot at x=10 mm, y=0 mm, heading=0 rad after "
        "straight travel and produced a 1 rad heading after the in-place turn. "
        "The curved motion produced x={:.3g} mm, y={:.3g} mm, heading={:.3g} rad. "
        "From the nonzero initial pose, it produced x={:.3g} mm, y={:.3g} mm, "
        "heading={:.3g} rad."
    ).format(
        curve.x_mm,
        curve.y_mm,
        curve.heading_rad,
        wrapped_curve.x_mm,
        wrapped_curve.y_mm,
        wrapped_curve.heading_rad,
    )


def _navigation_controller(component_class):
    config = NavigationConfig(
        cruise_speed_mm_s=120.0,
        approach_speed_mm_s=50.0,
        slowdown_distance_mm=150.0,
        turn_rate_rad_s=0.8,
        position_tolerance_mm=10.0,
        heading_tolerance_rad=0.08,
        realign_heading_rad=0.25,
    )
    navigation = component_class(config)
    navigation.start(())
    if not navigation.is_complete() or navigation.current_goal() is not None:
        raise AssertionError("After start() receives an empty route, is_complete() must return True and current_goal() must return None. Handle the empty route before selecting a goal.")
    stopped = navigation.update(Pose(0.0, 0.0, 0.0))
    _close("empty-route forward speed (mm/s)", stopped.forward_speed_mm_s, 0.0, exact=True)
    _close("empty-route turn rate (rad/s)", stopped.turn_rate_rad_s, 0.0, exact=True)

    navigation.start((NavigationGoal(200.0, 0.0),))
    command = navigation.update(Pose(0.0, 0.0, 0.0))
    if not isinstance(command, MotionCommand):
        raise AssertionError("NavigationController.update() must return a MotionCommand containing forward_speed_mm_s and turn_rate_rad_s.")
    if command.forward_speed_mm_s <= 0.0:
        raise AssertionError("NavigationController.update() must request positive forward speed for this goal straight ahead. Check the position and heading errors before choosing a motion command.")
    if navigation.current_goal() != NavigationGoal(200.0, 0.0):
        raise AssertionError("NavigationController.current_goal() must return the active NavigationGoal. Keep the current route index consistent with start() and update().")

    near_navigation = component_class(config)
    near_navigation.start((NavigationGoal(100.0, 0.0),))
    near_command = near_navigation.update(Pose(0.0, 0.0, 0.0))
    _close(
        "near-goal forward speed (mm/s)",
        near_command.forward_speed_mm_s,
        config.approach_speed_mm_s,
    )

    side_navigation = component_class(config)
    side_navigation.start((NavigationGoal(0.0, 200.0),))
    side_turn = side_navigation.update(Pose(0.0, 0.0, 0.0))
    _close("side-goal forward speed (mm/s)", side_turn.forward_speed_mm_s, 0.0, exact=True)
    if side_turn.turn_rate_rad_s <= 0.0:
        raise AssertionError(
            "For the goal on the left, update() must request a positive turn_rate_rad_s. It returned {} rad/s. Check the bearing-minus-heading error and its sign.".format(
                format_number(side_turn.turn_rate_rad_s)
            )
        )

    right_navigation = component_class(config)
    right_navigation.start((NavigationGoal(0.0, -200.0),))
    right_turn = right_navigation.update(Pose(0.0, 0.0, 0.0))
    _close("right-goal forward speed (mm/s)", right_turn.forward_speed_mm_s, 0.0, exact=True)
    if right_turn.turn_rate_rad_s >= 0.0:
        raise AssertionError(
            "For the goal on the right, update() must request a negative turn_rate_rad_s. It returned {} rad/s. Check the bearing-minus-heading error and its sign.".format(
                format_number(right_turn.turn_rate_rad_s)
            )
        )

    wrap_navigation = component_class(config)
    wrap_navigation.start((NavigationGoal(-200.0, -10.0),))
    wrap_turn = wrap_navigation.update(Pose(0.0, 0.0, pi - 0.05))
    _close("wrapped-goal forward speed (mm/s)", wrap_turn.forward_speed_mm_s, 0.0, exact=True)
    if wrap_turn.turn_rate_rad_s <= 0.0:
        raise AssertionError(
            (
                "For the heading-boundary example, update() must request the shorter positive "
                "turn across -pi/pi. It returned {} rad/s. Wrap the heading error before choosing the turn direction."
            ).format(
                format_number(wrap_turn.turn_rate_rad_s)
            )
        )

    realign_navigation = component_class(config)
    realign_navigation.start((NavigationGoal(200.0, 0.0),))
    driving = realign_navigation.update(Pose(0.0, 0.0, 0.0))
    if driving.forward_speed_mm_s <= 0.0:
        raise AssertionError("NavigationController.update() must begin with positive forward speed when the goal is aligned and outside the position tolerance. Check the heading and distance conditions.")
    realign_turn = realign_navigation.update(Pose(0.0, 0.0, 0.4))
    _close(
        "realignment forward speed (mm/s)",
        realign_turn.forward_speed_mm_s,
        0.0,
        exact=True,
    )
    if realign_turn.turn_rate_rad_s >= 0.0:
        raise AssertionError(
            "For this realignment example, update() must request a negative turn_rate_rad_s. It returned {} rad/s. Recompute the signed heading error from the current pose.".format(
                format_number(realign_turn.turn_rate_rad_s)
            )
        )

    ordered = component_class(config)
    first_goal = NavigationGoal(0.0, 0.0)
    second_goal = NavigationGoal(200.0, 0.0)
    ordered.start((first_goal, second_goal))
    ordered.update(Pose(0.0, 0.0, 0.0))
    if ordered.current_goal() != second_goal:
        raise AssertionError(
            "After update() reaches the first goal, current_goal() must return the second goal. Advance the route index while preserving the supplied goal order."
        )

    navigation.start((NavigationGoal(0.0, 0.0, pi / 2.0),))
    turn = navigation.update(Pose(0.0, 0.0, 0.0))
    _close("final-align forward speed (mm/s)", turn.forward_speed_mm_s, 0.0, exact=True)
    if turn.turn_rate_rad_s <= 0.0:
        raise AssertionError("NavigationController.update() must turn left for a positive final-heading error. Check the final heading even when the goal position has been reached.")
    stopped = navigation.update(Pose(0.0, 0.0, pi / 2.0))
    _close("completed forward speed (mm/s)", stopped.forward_speed_mm_s, 0.0, exact=True)
    _close("completed turn rate (rad/s)", stopped.turn_rate_rad_s, 0.0, exact=True)
    if not navigation.is_complete():
        raise AssertionError("NavigationController.is_complete() must return True at the final required pose. Mark the route complete after both position and final-heading conditions are satisfied.")
    return (
        "update() requested {:.3g} mm/s toward the goal ahead and "
        "{:.3g}/{:.3g} rad/s toward the left/right goals. The heading-wrap "
        "example requested {:.3g} rad/s, and realignment requested {:.3g} rad/s. "
        "The completed route produced an exact stop."
    ).format(
        command.forward_speed_mm_s,
        side_turn.turn_rate_rad_s,
        right_turn.turn_rate_rad_s,
        wrap_turn.turn_rate_rad_s,
        realign_turn.turn_rate_rad_s,
    )


def _grid_planner(component_class):
    planner = component_class()
    open_grid = OccupancyGrid(
        100.0,
        0.0,
        0.0,
        3,
        2,
        (False, False, False, False, False, False),
    )
    direct_start = GridCell(0, 0)
    direct_goal = GridCell(2, 0)
    direct = planner.plan(open_grid, direct_start, direct_goal)

    def check_route(grid, start, goal, route):
        if not isinstance(route, GridPath):
            raise AssertionError("GridPlanner.plan() must return a GridPath when it finds a route. Place the ordered GridCell values in that record.")
        if not route.cells or route.cells[0] != start or route.cells[-1] != goal:
            raise AssertionError("The GridPath returned by plan() must begin at the start cell and end at the goal cell. Check the endpoints when reconstructing the route.")
        for cell in route.cells:
            if not isinstance(cell, GridCell) or any(isinstance(v, bool) or not isinstance(v, int) for v in (cell.column, cell.row)):
                raise AssertionError("Each route cell must contain integer column and row indices.")
            if grid.is_blocked(cell):
                raise AssertionError("Every cell in the GridPath returned by plan() must be free. Exclude blocked cells during search and path reconstruction.")
        for first, second in zip(route.cells, route.cells[1:]):
            if second not in grid.neighbors(first):
                raise AssertionError(
                    "Successive cells in the GridPath returned by plan() must share a horizontal or vertical side. Reconstruct the path from connected neighbors, without diagonal steps or gaps."
                )

    if direct is None:
        raise AssertionError("GridPlanner.plan() must connect the unobstructed start and goal cells in this example. Check neighbor expansion and goal detection before returning None.")
    check_route(open_grid, direct_start, direct_goal, direct)

    grid = OccupancyGrid(
        100.0,
        0.0,
        0.0,
        3,
        2,
        (False, True, False, False, False, False),
    )
    start = GridCell(0, 0)
    goal = GridCell(2, 0)
    path = planner.plan(grid, start, goal)
    if path is None:
        raise AssertionError("GridPlanner.plan() returned no route even though the start and goal are connected around the obstacle. Explore the available detour before returning None.")
    check_route(grid, start, goal, path)

    if planner.plan(open_grid, None, direct_goal) is not None:
        raise AssertionError("GridPlanner.plan() must return None when the start is missing. Validate the endpoints before beginning the search.")
    if planner.plan(open_grid, direct_start, None) is not None:
        raise AssertionError("GridPlanner.plan() must return None when the goal is missing. Validate the endpoints before beginning the search.")
    if planner.plan(open_grid, GridCell(9, 9), direct_goal) is not None:
        raise AssertionError("GridPlanner.plan() must return None when the start lies outside the grid. Check the start column and row against the grid dimensions.")

    blocked_start = OccupancyGrid(
        100.0,
        0.0,
        0.0,
        2,
        1,
        (True, False),
    )
    if planner.plan(blocked_start, GridCell(0, 0), GridCell(1, 0)) is not None:
        raise AssertionError("GridPlanner.plan() must return None when an endpoint is blocked. Check endpoint occupancy before beginning the search.")

    divided = OccupancyGrid(
        100.0,
        0.0,
        0.0,
        3,
        2,
        (False, True, False, False, True, False),
    )
    if planner.plan(divided, GridCell(0, 0), GridCell(2, 0)) is not None:
        raise AssertionError("GridPlanner.plan() must return None when no free-cell route reaches the goal. Return None after exhausting reachable cells.")

    same = planner.plan(open_grid, direct_start, direct_start)
    if same is None or same.cells != (direct_start,):
        raise AssertionError("GridPlanner.plan() must return a one-cell GridPath when the start equals the goal. Include the start cell even when no travel is required.")
    return "plan() returned a {}-cell route on the open grid and a {}-cell route around the obstacle. Both routes used free, side-sharing cells. Invalid or disconnected endpoints returned None, and identical endpoints produced a one-cell route.".format(
        len(direct.cells),
        len(path.cells),
    )


def _sensor_speed_sequences(component_class):
    # Contract examples allow 1.2 s warm-up (at least 7.5 response constants).
    # They constrain steady scaling and smoothing, not the first filter output.
    histories = []
    for tau_ms in (80.0, 160.0):
        config = RobotConfig(wheel_diameter_mm=60.0, encoder_counts_per_revolution=600.0,
                             left_encoder_sign=1, right_encoder_sign=1,
                             sample_period_ms=20, wheel_speed_filter_time_constant_ms=tau_ms)
        model = component_class(config)
        model.reset(RawSensors(0, 0, 0, None, False))
        time_ms = 0
        count = 0
        for index in range(30):
            time_ms += 40
            count += 1
            measured = model.update(RawSensors(time_ms, count, count, None, False))
        for side in ("left", "right"):
            _close("settled " + side + " speed (mm/s)", getattr(measured, side + "_speed_mm_s"),
                   pi / 0.4, 0.1 * pi / 0.4)
        earlier = measured
        transition = []
        right_transition = []
        for index in range(12):
            time_ms += 40
            count += 3
            measured = model.update(RawSensors(time_ms, count, count, None, False))
            transition.append(measured.left_speed_mm_s)
            right_transition.append(measured.right_speed_mm_s)
        _change("speed response after three counts per 40 ms", earlier.left_speed_mm_s,
                measured.left_speed_mm_s, 1, 1.0, "mm/s")
        histories.append((transition, right_transition))
        # Quantized constant travel: alternating 0/2 counts over 40 ms.
        samples = []
        right_samples = []
        for index in range(30):
            time_ms += 40
            count += 0 if index % 2 == 0 else 2
            measured = model.update(RawSensors(time_ms, count, count, None, False))
            if index >= 22:
                samples.append(measured.left_speed_mm_s)
                right_samples.append(measured.right_speed_mm_s)
        if any(max(values) - min(values) >= 0.8 * (pi / 0.2) for values in (samples, right_samples)):
            raise AssertionError("Wheel speed still follows the raw 0/15.7 mm/s quantization after warm-up. Use recent samples and the configured response time; keep wheel increments unsmoothed.")
        # Stationary and reverse intervals rule out fixed positive answers.
        for index in range(30):
            time_ms += 40
            measured = model.update(RawSensors(time_ms, count, count, None, False))
        _close("settled stationary left speed (mm/s)", measured.left_speed_mm_s, 0.0, 0.3)
        _close("settled stationary right speed (mm/s)", measured.right_speed_mm_s, 0.0, 0.3)
        for index in range(30):
            time_ms += 40
            count -= 1
            measured = model.update(RawSensors(time_ms, count, count, None, False))
        for side in ("left", "right"):
            _close("settled reverse " + side + " speed (mm/s)", getattr(measured, side + "_speed_mm_s"),
                   -pi / 0.4, 0.1 * pi / 0.4)
        reset = model.reset(RawSensors(time_ms, count, count, 350.0, True))
        for field in ("left_speed_mm_s", "right_speed_mm_s", "left_increment_mm", "right_increment_mm", "left_position_mm", "right_position_mm", "dt_s"):
            _close("reset history " + field, getattr(reset, field), 0.0, exact=True)
        no_time = model.update(RawSensors(time_ms, count + 1, count + 1, None, False))
        _close("zero-interval dt_s", no_time.dt_s, 0.0, exact=True)
        _close("zero-interval left increment (mm)", no_time.left_increment_mm, pi / 10.0)
    for side in (0, 1):
        _change("configured {} response (sum of twelve step-response estimates)".format("left" if side == 0 else "right"),
                sum(histories[1][side]), sum(histories[0][side]), 1, 0.5, "mm/s",
                {"kind": "response_configuration", "method": "update",
                 "side": "left" if side == 0 else "right",
                 "earlier_label": "sum with 160 ms response time",
                 "later_label": "sum with 80 ms response time",
                 "earlier_response_ms": 160, "later_response_ms": 80,
                 "sample_interval_ms": 40, "previous_count_increment": 1,
                 "current_count_increment": 3, "sample_count": 12,
                 "earlier_speeds_mm_s": histories[1][side],
                 "later_speeds_mm_s": histories[0][side]})
    # MicroPython's ticks_diff provides wrap-safe time. CPython has no wrapping
    # device clock; the same fixture runs there with chronological timestamps.
    from .utils import elapsed_time_s
    start_ms, end_ms = 1073741814, 10
    if elapsed_time_s(end_ms, start_ms) <= 0:
        start_ms, end_ms = 100, 120
    model = component_class(RobotConfig())
    model.reset(RawSensors(start_ms, 0, 0, None, False))
    wrapped = model.update(RawSensors(end_ms, 1, 1, None, False))
    _close("tick interval dt_s", wrapped.dt_s, 0.02)


def _reflectance(component_class):
    model = component_class(RobotConfig())
    for readings in (ReflectanceReadings(0.2, 0.8), None):
        first = model.reset(RawSensors(0, 0, 0, None, False, readings))
        later = model.update(RawSensors(20, 0, 0, None, False, readings))
        if first.reflectance != readings or later.reflectance != readings:
            raise AssertionError("Preserve raw.reflectance exactly in both reset() and update() Measurements; LineFollower uses these readings to steer.")
    return "reset() and update() preserved the left/right reflectance readings of 0.2/0.8 and preserved None when readings were absent."


def _line_follower(component_class):
    settings = {"cruise_speed_mm_s": 90.0, "minimum_speed_mm_s": 45.0,
                "kp_rad_s": 1.6, "ki_rad_s2": 0.0, "kd_rad": 0.025,
                "integral_limit_s": 0.5, "maximum_turn_rate_rad_s": 1.4,
                "turn_slowdown": 0.45}
    follower = component_class(settings)
    follower.reset()
    centered = follower.update(ReflectanceReadings(0.6, 0.6), 0.02)
    left = follower.update(ReflectanceReadings(0.8, 0.2), 0.04)
    follower.reset()
    right = follower.update(ReflectanceReadings(0.2, 0.8), 0.04)
    for command in (centered, left, right):
        if not 0 <= command.forward_speed_mm_s <= settings["cruise_speed_mm_s"]:
            raise AssertionError("forward_speed_mm_s must remain between 0 and the example's 90 mm/s cruise limit.")
        if abs(command.turn_rate_rad_s) > settings["maximum_turn_rate_rad_s"]:
            raise AssertionError("turn_rate_rad_s must remain within the example's +/-1.4 rad/s steering limit.")
    _close("centered turn (rad/s)", centered.turn_rate_rad_s, 0.0, exact=True)
    if left.turn_rate_rad_s <= 0 or right.turn_rate_rad_s >= 0:
        raise AssertionError("Steer toward the darker sensor: left=0.8/right=0.2 requires positive turn rate; reversed readings require negative turn rate. Received {} and {} rad/s.".format(format_number(left.turn_rate_rad_s), format_number(right.turn_rate_rad_s)))
    follower.reset()
    _close("reset centered turn (rad/s)", follower.update(ReflectanceReadings(0.6, 0.6), 0.02).turn_rate_rad_s, 0.0, exact=True)
    return "update() returned zero turn for centered readings and turned toward the darker sensor in both directions. Forward speed stayed within 0 to 90 mm/s, turn rate stayed within +/-1.4 rad/s, and reset() cleared the steering history."


def _range_safety_controller(component_class):
    controller = component_class(0.20, 400.0, 120.0, 250.0)
    far = controller.update(220.0, 0.0, 1000.0)
    if not 0 < far <= 220:
        raise AssertionError("For a clear 1000 mm range, RangeSafetyController.update() must allow positive forward speed without exceeding the 220 mm/s request. Check the stopping-distance calculation and request limit.")
    for request, speed, distance in ((220.0, 0.0, None), (0.0, 80.0, 1000.0), (-40.0, 0.0, 1000.0), (200.0, 220.0, 210.0)):
        _close("required safe stop (mm/s)", controller.update(request, speed, distance), 0.0, exact=True)
    bounded = controller.update(400.0, 0.0, 1000.0)
    if not 0 < bounded <= 250:
        raise AssertionError("RangeSafetyController.update() must limit the 400 mm/s request to a positive speed no greater than the configured 250 mm/s maximum. Apply the maximum-speed setting.")
    if controller.update(200.0, 60.0, 210.0) <= 0:
        raise AssertionError("At 210 mm range, 60 mm/s measured speed permits motion; 220 mm/s requires stopping. Include measured speed in braking distance.")
    for label, first, second in (
        ("response delay", (0.10, 300.0, 120.0, 300.0), (0.45, 300.0, 120.0, 300.0)),
        ("weaker braking", (0.20, 800.0, 120.0, 300.0), (0.20, 200.0, 120.0, 300.0)),
        ("larger margin", (0.20, 300.0, 80.0, 300.0), (0.20, 300.0, 180.0, 300.0)),
    ):
        earlier = component_class(*first).update(260.0, 0.0, 240.0)
        later = component_class(*second).update(260.0, 0.0, 240.0)
        if later <= 0:
            raise AssertionError("The setting change, " + label + ", should reduce the allowed speed while still permitting motion in this example.")
        _change(label, earlier, later, -1, 0.01, "mm/s")
    return "update() stopped exactly for missing range, nonpositive requests and insufficient stopping distance. Valid forward requests respected the 250 mm/s speed limit, and changes in delay, braking deceleration and margin changed the allowed speed in the required direction."


def _pose_corrector(component_class):
    def check_pose(label, result, expected):
        _close(label + " x (mm)", result.x_mm, expected[0])
        _close(label + " y (mm)", result.y_mm, expected[1])
        # Constructing Pose normalizes heading, so compare geometric roundoff.
        _close(label + " heading (rad)", result.heading_rad, expected[2])
    corrector = component_class(50.0)
    raw = Pose(120.0, -75.0, 0.31)
    corrector.reset(raw)
    check_pose("positive-x wall", corrector.observe_x(raw, 780.0, 1000.0, True), (170.0, -75.0, 0.31))
    check_pose("negative-y wall", corrector.observe_y(raw, 275.0, -600.0, False), (170.0, -275.0, 0.31))
    check_pose("later odometry", corrector.corrected_pose(Pose(145.0, -50.0, -0.60)), (195.0, -250.0, -0.60))
    reset_pose = Pose(-40.0, 30.0, 1.20)
    if corrector.reset(reset_pose) != reset_pose:
        raise AssertionError("reset() must clear both coordinate corrections and return its input Pose.")
    check_pose("negative-x wall", corrector.observe_x(reset_pose, 200.0, -500.0, False), (-250.0, 30.0, 1.20))
    check_pose("positive-y wall", corrector.observe_y(reset_pose, 300.0, 800.0, True), (-250.0, 450.0, 1.20))
    second = component_class(25.0)
    second_raw = Pose(40.0, 60.0, -1.10)
    second.reset(second_raw)
    check_pose("25 mm offset x", second.observe_x(second_raw, 500.0, 600.0, True), (75.0, 60.0, -1.10))
    check_pose("25 mm offset y", second.observe_y(second_raw, 200.0, -400.0, False), (75.0, -175.0, -1.10))
    try:
        corrector.observe_x(reset_pose, 0.0, 900.0, True)
    except ValueError:
        pass
    else:
        raise AssertionError("observe_x() must reject zero range with ValueError.")
    return "The wall observations produced the required x/y corrections for both wall directions and sensor offsets. corrected_pose() retained both translations during later odometry, preserved heading, and reset() cleared the corrections."


def _visit_order_planner(component_class):
    planner = component_class()
    asymmetric = ((0,9,1,8,7),(6,0,5,7,4),(9,2,0,8,8),(1,9,9,0,5),(8,9,9,1,0))
    reachable = ((0,None,None,1,None),(None,0,None,None,None),(None,None,0,None,1),(None,None,None,0,None),(1,None,None,None,0))
    ties = ((0,1,1,1,1),(1,0,1,1,1),(1,1,0,1,1),(1,1,1,0,1),(1,1,1,1,0))
    disconnected = ((0,1,None,None),(None,0,1,None),(None,None,0,None),(None,None,None,0))
    for label, costs, start, stops, finish, expected in (
        ("directed costs", asymmetric, 4, (2,0,3), 1, (4,3,0,2,1)),
        ("missing segments", reachable, 2, (0,4), 3, (2,4,0,3)),
        ("lexicographic tie break", ties, 4, (3,1,2), 0, (4,1,2,3,0)),
        ("disconnected route", disconnected, 0, (1,2), 3, None),
    ):
        result = planner.plan(costs, start, stops, finish)
        if result != expected or (result is not None and any(isinstance(value, bool) or not isinstance(value, int) for value in result)):
            raise AssertionError("For {}, plan() must return the ordered indices {}. It returned {}. Sum directed segment costs and preserve the specified tie-breaking rule.".format(label, expected, result))
    try:
        planner.plan(asymmetric, 4, (2,2,3), 1)
    except ValueError:
        pass
    else:
        raise AssertionError("VisitOrderPlanner.plan() must raise ValueError for duplicate stop indices. Check the supplied stop sequence before comparing visit orders.")
    return "plan() selected the required visit orders using directed costs and chose the lexicographically first order when costs tied. It returned None for a disconnected route and rejected duplicate stop indices."


_CHECKS = (
    (
        "SensorProcessor: encoder distance and wheel-speed measurements",
        "sensor_model",
        (
            "SensorProcessor.reset() and update() provide wheel travel to Odometry "
            "and measured wheel speed to WheelSpeedController."
        ),
        (
            "The examples use two wheel geometries and encoder-sign conventions, "
            "25/40 ms intervals and a separate 30 ms interval. Speed examples allow "
            "1.2 s of warm-up, then use 40 ms samples with 80/160 ms response settings "
            "to check a speed increase, quantized counts, stationary wheels and reversal."
        ),
        (
            "Device timestamps determine dt_s, and encoder signs determine forward travel. "
            "Positions accumulate at pi * wheel diameter / encoder resolution mm per count. "
            "Wheel increments remain unsmoothed, while speed estimates respond to recent "
            "samples and the configured response time."
        ),
        _sensor_model,
    ),
    (
        "WheelSpeedController: motor direction, command limits, and stopping",
        "wheel_speed_controller",
        "WheelSpeedController.update() turns requested and measured wheel speeds into the normalized motor commands used by Robot.",
        (
            "The examples request left/right speeds of +100/-100 mm/s at measured "
            "speeds of +80/-80 and +20/-20 mm/s, then request reverse motion on "
            "the left wheel and a stop on the right."
        ),
        (
            "A larger speed error produces a stronger command in the requested "
            "direction. Commands remain within the configured +/-0.6 limit, and "
            "a zero wheel-speed target produces an exact zero command."
        ),
        _wheel_speed_controller,
    ),
    (
        "SensorProcessor: ultrasound reading validation and median distance",
        "range_estimator",
        (
            "SensorProcessor.estimate_range() combines stationary ultrasound "
            "readings before the project interprets the observed map feature."
        ),
        "The sample sets contain valid distances in mm, None, a Boolean, nonfinite values and a negative value. Separate examples exercise odd/even usable counts and minimum-count validation.",
        (
            "The method ignores invalid readings and returns the median when "
            "enough usable readings remain. It returns None when too few remain "
            "and rejects a minimum count of zero."
        ),
        _range_estimator,
    ),
    (
        "DifferentialDrive: forward speed and turn rate to wheel speeds",
        "differential_drive",
        (
            "DifferentialDrive.wheel_speeds() converts a forward speed in mm/s "
            "and a turn rate in rad/s into the left/right targets used by wheel control."
        ),
        (
            "The examples use a 100 mm track width for straight, moving-turn "
            "and in-place commands, then a 140 mm track width for a reverse curve."
        ),
        (
            "Straight motion produces equal wheel targets. A positive turn rate "
            "makes the right target greater than the left by turn rate * track width; "
            "a negative turn rate reverses that difference."
        ),
        _differential_drive,
    ),
    (
        "Odometry: position and heading from wheel travel",
        "odometry",
        "Odometry.update() converts measured wheel increments into the position and heading used to end turns and navigate.",
        (
            "The examples use equal, equal-and-opposite and unequal wheel travel "
            "with a 100 mm track width. A further example starts at a nonzero "
            "pose and crosses the heading representation boundary."
        ),
        (
            "Equal travel advances the robot straight, equal-and-opposite travel "
            "turns it in place, and unequal travel follows the corresponding planar "
            "arc. Position remains in mm, and heading is wrapped to [-pi, pi) rad."
        ),
        _odometry,
    ),
    (
        "NavigationController: reaching route goals and stopping",
        "navigation_controller",
        (
            "NavigationController.update() converts route goals and the estimated "
            "pose into forward-speed and turn-rate requests that Robot can execute."
        ),
        (
            "The examples use empty and ordered routes, goals ahead and on "
            "either side, a heading-boundary crossing, realignment during travel "
            "and a required final heading."
        ),
        (
            "The controller advances goals in order and uses the shorter signed "
            "turn. A large heading error suspends forward motion; completion "
            "produces exactly zero forward speed and turn rate."
        ),
        _navigation_controller,
    ),
    (
        "GridPlanner: routes through free grid cells",
        "grid_planner",
        (
            "GridPlanner.plan() provides the cell route that the project converts "
            "to navigation goals before motion begins."
        ),
        (
            "The examples include an unobstructed route, an obstacle requiring "
            "a detour, missing or blocked endpoints, disconnected regions and "
            "identical start and goal cells."
        ),
        (
            "A returned path connects free cells from start to goal, with each "
            "successive pair sharing a side. Invalid or disconnected endpoints "
            "produce None; identical endpoints produce a one-cell path."
        ),
        _grid_planner,
    ),
)

# Registry entries describe behavior, never challenge titles or worlds.
_CHECKS += (
    ("SensorProcessor: preserving floor-sensor readings", "reflectance",
     "SensorProcessor.reset() and update() preserve the paired floor readings that LineFollower uses to steer.",
     "Both methods receive left/right reflectance readings of 0.2/0.8 and, separately, None for absent readings.",
     "Both methods preserve reflectance exactly, including None.", _reflectance),
    ("LineFollower: steering from floor-sensor readings", "line_follower",
     "LineFollower.update() converts left-minus-right floor darkness into a bounded MotionCommand for line tracking.",
     "The examples use equal readings, reversed 0.8/0.2 readings, 20/40 ms intervals and fixed controller settings with 90 mm/s and 1.4 rad/s limits.",
     "The controller steers toward the darker sensor, requests zero turn for centered readings after reset, and keeps all commands within the configured bounds.", _line_follower),
    ("RangeSafetyController: speed limits for safe stopping", "range_safety_controller",
     "RangeSafetyController.update() limits forward-speed requests using measured speed and available stopping distance.",
     "The examples vary range, measured speed, response delay, braking deceleration, safety margin and maximum speed.",
     "Insufficient or missing range and nonpositive requests produce an exact stop. The allowed forward speed responds to each configured limit.", _range_safety_controller),
    ("PoseCorrector: position correction from wall distances", "pose_corrector",
     "PoseCorrector.observe_x() and observe_y() correct odometry translation from stationary wall observations while preserving heading.",
     "The examples observe walls in both x/y directions using 50 and 25 mm sensor offsets, then process later odometry and reset the correction.",
     "Each observation applies the sensor offset and wall-facing sign. The corrector retains both coordinate translations, preserves heading and clears the correction on reset.", _pose_corrector),
    ("VisitOrderPlanner: choosing the lowest-cost visit order", "visit_order_planner",
     "VisitOrderPlanner.plan() chooses the least-cost visit order before the mission follows its routes.",
     "The examples contain directed segment costs, missing segments, tied route costs, an unreachable finish and duplicate stop indices.",
     "The planner returns the minimum-cost order, choosing the lexicographically first index sequence when costs tie. It returns None when no complete order exists and rejects duplicate stops.", _visit_order_planner),
)

_CONTRACT_KEYS = {
    "sensor_processor.encoder": "sensor_model",
    "sensor_processor.range": "range_estimator",
    "sensor_processor.reflectance": "reflectance",
    "wheel_speed_controller": "wheel_speed_controller",
    "differential_drive": "differential_drive",
    "odometry": "odometry",
    "navigation_controller": "navigation_controller",
    "grid_planner": "grid_planner",
    "line_follower": "line_follower",
    "range_safety_controller": "range_safety_controller",
    "pose_corrector": "pose_corrector",
    "visit_order_planner": "visit_order_planner",
}
CONTRACTS = tuple(_CONTRACT_KEYS)
_CLASS_KEYS = {
    "SensorProcessor": "sensor_model", "SensorModel": "sensor_model",
    "WheelSpeedController": "wheel_speed_controller", "DifferentialDrive": "differential_drive",
    "Odometry": "odometry", "NavigationController": "navigation_controller", "GridPlanner": "grid_planner",
    "LineFollower": "line_follower", "RangeSafetyController": "range_safety_controller",
    "PoseCorrector": "pose_corrector", "VisitOrderPlanner": "visit_order_planner",
}
_SOURCE_FILES = {"sensor_model": "sensor_processor", "range_estimator": "sensor_processor", "reflectance": "sensor_processor"}
_METHODS = {"sensor_model": "reset, update", "range_estimator": "estimate_range", "reflectance": "reset, update",
            "differential_drive": "wheel_speeds", "odometry": "reset, update", "grid_planner": "plan",
            "navigation_controller": "start, current_goal, is_complete, update", "wheel_speed_controller": "reset, update",
            "line_follower": "reset, update", "pose_corrector": "reset, observe_x, observe_y, corrected_pose",
            "visit_order_planner": "plan", "range_safety_controller": "update"}


_INSPECTIONS = {
    "sensor_model": "Check signed count differences and distance per count (pi * wheel_diameter_mm / encoder_counts_per_revolution). Use consecutive device timestamps for dt_s; filter speed using recent samples without smoothing wheel increments.",
    "range_estimator": "Reject missing, Boolean, nonfinite and nonpositive samples before counting usable readings. Sort those readings and calculate the odd/even median.",
    "reflectance": "Pass raw.reflectance through the Measurements returned by both reset() and update(), including None.",
    "wheel_speed_controller": "Inspect the requested-minus-measured speed error and each wheel's sign. Apply max_drive_command to both directions, and return exactly zero for a zero requested wheel speed.",
    "differential_drive": "Check left = forward - turn_rate * track_width / 2 and right = forward + turn_rate * track_width / 2. Keep distance in mm and turn rate in rad/s.",
    "odometry": "Calculate heading change from (right_increment_mm - left_increment_mm) / track_width_mm. Integrate the constant-curvature arc at the previous heading and wrap the updated heading to [-pi, pi).",
    "navigation_controller": "Check the active goal and wrapped heading error before choosing translation or rotation. Advance reached goals in order and request exactly zero motion when complete.",
    "grid_planner": "Inspect endpoint validity, obstacle checks and parent/path reconstruction. Consecutive cells must share a horizontal or vertical side; unreachable goals return None.",
    "line_follower": "Use left-minus-right darkness for the steering sign, include the provided dt_s in controller history, and enforce the example's speed and turn limits. reset() must clear previous and accumulated errors.",
    "range_safety_controller": "Check stopping distance from measured speed, response delay and braking deceleration. Include sensor margin and enforce the requested and maximum speed limits; missing range requires an exact stop.",
    "pose_corrector": "Check the wall-facing sign and sensor offset in the observed coordinate. Retain the correction for the other axis, apply both translations to later odometry, and preserve heading.",
    "visit_order_planner": "Sum directed costs along each complete visit order, reject missing segments, and use lexicographic order for ties. Preserve integer stop indices and reject duplicates.",
}

def _readable(value, depth=0):
    if isinstance(value, bool) or value is None or isinstance(value, str):
        return str(value)
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        return format_number(value)
    if depth >= 3:
        return "(nested values are available in the Exact check record)"
    if isinstance(value, dict):
        return "; ".join(str(key) + "=" + _readable(item, depth + 1) for key, item in value.items())
    if isinstance(value, (list, tuple)):
        displayed = value[:8]
        result = ", ".join(_readable(item, depth + 1) for item in displayed)
        return "[" + result + (", ... (full sequence in the Exact check record)" if len(value) > 8 else "") + "]"
    return str(value)


def _failure_context(case):
    comparison_context = case.get("comparison_context")
    if comparison_context is not None:
        context = comparison_context
        return [
            "This comparison uses the {} wheel's saved update() speed estimates from two runs with response times of {} and {} ms.".format(
                context["side"], context["earlier_response_ms"], context["later_response_ms"]),
            "After warm-up at {} encoder count per sample, each run increased to {} counts per sample at {} ms intervals. The comparison sums the first {} speed estimates after that increase.".format(
                context["previous_count_increment"], context["current_count_increment"], context["sample_interval_ms"], context["sample_count"]),
            "Speeds with {} ms response time, in mm/s: [{}].".format(context["earlier_response_ms"],
                ", ".join(format_number(value) for value in context["earlier_speeds_mm_s"])),
            "Speeds with {} ms response time, in mm/s: [{}].".format(context["later_response_ms"],
                ", ".join(format_number(value) for value in context["later_speeds_mm_s"])),
            "The shorter response time should produce a larger sum during this transition. Check that the configured response time affects the estimator.",
        ]
    key = _CONTRACT_KEYS[case["contract"]]
    context = []
    configuration = case.get("configuration", [])
    if key in ("sensor_model", "reflectance") and configuration:
        config = configuration[0]
        context.append("Example settings: wheel diameter {} mm; resolution {} counts/revolution; encoder signs left {}, right {}; response time {} ms; nominal sample period {} ms.".format(
            format_number(config["wheel_diameter_mm"]), format_number(config["encoder_counts_per_revolution"]),
            config["left_encoder_sign"], config["right_encoder_sign"],
            format_number(config["wheel_speed_filter_time_constant_ms"]), config["sample_period_ms"]))
    elif configuration:
        fields = {"differential_drive": ("track_width_mm",), "odometry": ("track_width_mm",),
                  "wheel_speed_controller": ("left_start_command", "right_start_command", "left_speed_command_gain", "right_speed_command_gain", "wheel_speed_kp", "max_drive_command")}.get(key)
        config = configuration[0]
        if fields and isinstance(config, dict):
            context.append("Example settings: " + _readable({name: config[name] for name in fields}) + ".")
        else:
            context.append("Inputs used to construct the component: " + _readable(configuration) + ".")
    if case["inputs"]:
        call = case["inputs"][-1]
        if "previous" in call:
            previous = call["previous"]
            current = call["args"][0]
            context.append("Previous sample: time {} ms; left count {}; right count {}.".format(
                previous["time_ms"], previous["left_encoder_count"], previous["right_encoder_count"]))
            from .utils import elapsed_time_s
            context.append("Current sample: time {} ms; left count {}; right count {}. Elapsed interval: {} s.".format(
                current["time_ms"], current["left_encoder_count"], current["right_encoder_count"],
                format_number(elapsed_time_s(current["time_ms"], previous["time_ms"]))))
        else:
            context.append("Input to {}(): {}.".format(call["method"], _readable(call["args"])))
    return context


def _selection(component_classes, components):
    include_range = components.pop("include_range", False)
    include_reflectance = components.pop("include_reflectance", False)
    contracts = components.pop("contracts", None)
    for value, name in ((include_range, "include_range"), (include_reflectance, "include_reflectance")):
        if not isinstance(value, bool):
            raise TypeError(name + " must be True or False")
    if "sensor_processor" in components:
        if "sensor_model" in components:
            raise ValueError("component supplied more than once: sensor_processor")
        components["sensor_model"] = components.pop("sensor_processor")
    for component_class in component_classes:
        key = _CLASS_KEYS.get(getattr(component_class, "__name__", ""))
        if key is None:
            raise ValueError("unknown component class; use an explicit named contract: " + getattr(component_class, "__name__", str(component_class)))
        if key in components:
            raise ValueError("component supplied more than once: " + key)
        components[key] = component_class
    for enabled, key in ((include_range, "range_estimator"), (include_reflectance, "reflectance")):
        if enabled:
            if "sensor_model" not in components:
                raise ValueError(key + " requires SensorProcessor")
            if key in components:
                raise ValueError("component supplied more than once: " + key)
            components[key] = components["sensor_model"]
    unknown = set(components).difference(item[1] for item in _CHECKS)
    if unknown:
        raise ValueError("unknown component check: " + sorted(unknown)[0])
    if contracts is not None:
        if not isinstance(contracts, (tuple, list)) or not contracts:
            raise ValueError("contracts must be a nonempty list or tuple of contract IDs")
        selected = {}
        for contract in contracts:
            if contract not in _CONTRACT_KEYS:
                raise ValueError("unknown contract: " + str(contract))
            key = _CONTRACT_KEYS[contract]
            if key in selected:
                raise ValueError("duplicate contract: " + contract)
            component = components.get(key)
            if component is None and key in ("range_estimator", "reflectance"):
                component = components.get("sensor_model")
            if component is None:
                raise ValueError("missing component for contract: " + contract)
            selected[key] = component
        components = selected
    if not components:
        raise ValueError("at least one component class is required")
    for key, component in components.items():
        if not callable(component):
            raise TypeError(key + " must name an imported component class")
    return components


def run_component_checks(*component_classes, **components):
    """Run hardware-free checks selected by component or stable contract ID.

    Existing positional classes, named keys, SensorModel and include_range are
    supported. contracts selects reusable capabilities, for example
    ('sensor_processor.encoder', 'sensor_processor.reflectance'). No mission
    entrypoint is imported. Unimplemented methods are diagnostic outcomes;
    incorrect results raise AssertionError after all independent contracts run.
    """
    global _report, _active_case
    _report = {"schema_version": 1, "complete": False, "status": "running",
               "counts": {"passed": 0, "failed": 0, "not_implemented": 0, "not_run": 0},
               "cases": [], "last_started_case": None, "last_completed_case": None}
    _active_case = None
    try:
        components = _selection(component_classes, components)
    except Exception as error:
        _report.update({"status": "setup_error", "complete": True,
                        "exception": {"type": type(error).__name__, "message": str(error)}})
        _publish()
        raise
    for label, key, role, inputs, expected, check in _CHECKS:
        if key not in components:
            continue
        contract = next(name for name in CONTRACTS if _CONTRACT_KEYS[name] == key)
        module = getattr(components[key], "__module__", "")
        import sys
        file_name = getattr(sys.modules.get(module), "__file__", None)
        if isinstance(file_name, str) and file_name:
            file_name = file_name.replace("\\", "/")
            if file_name.startswith("/project/"):
                file_name = file_name[len("/project/"):]
            elif file_name.startswith("project/"):
                file_name = file_name[len("project/"):]
        else:
            file_name = (module.replace(".", "/") if module and module not in ("__main__", "builtins") else _SOURCE_FILES.get(key, key)) + ".py"
        _report["cases"].append({"id": contract, "contract": contract, "status": "not_run",
            "source": {"file": file_name, "method": _METHODS[key]},
            "title": label, "methods": _METHODS[key], "role": role, "fixture": inputs, "inputs": [],
            "expected": expected, "actual": None, "units": None, "tolerance": None,
            "observations": [], "suggestion": _INSPECTIONS[key], "message": "These examples have not run yet.", "exception": None})
    _report["counts"]["not_run"] = len(_report["cases"])
    print("These checks call your project classes with small examples; they do not start either robot.")
    print("Test calls student components directly. Run follows robot_setup.py selectors. Passing these examples does not validate main.py, a whole mission, or physical robot behavior.")
    print("Each section describes the component, example inputs, expected behavior, and result. Suggested corrections appear only when work is needed.")
    print("Example settings are test inputs, not measured robot calibration.")
    print("Passed means the tested examples matched; Not implemented means a method needs code; Failed means an incorrect result or exception.")
    print("")
    for case in _report["cases"]:
        key = _CONTRACT_KEYS[case["contract"]]
        label, _, role, inputs, expected, check = next(item for item in _CHECKS if item[1] == key)
        _active_case = case
        case["status"] = "running"
        _report["last_started_case"] = case["id"]
        _publish()
        print("Testing " + label + ".")
        print("Source: {}. Methods: {}.".format(case["source"]["file"],
              ", ".join(method.strip() + "()" for method in case["methods"].split(","))))
        print("Purpose: " + role)
        print("Example inputs: " + inputs)
        print("Expected behavior: " + expected)
        try:
            observed = check(_factory(components[key], key))
        except NotImplementedError as error:
            case.update({"status": "not_implemented", "message": str(error) or "{}() is not implemented in {}.".format(case["source"]["method"], case["source"]["file"]),
                         "exception": {"type": "NotImplementedError", "message": str(error)}})
            print("Not implemented. " + case["message"])
            print("Next step: Complete {}() in {}, then run Test again.".format(case["source"]["method"], case["source"]["file"]))
        except Exception as error:
            case.update({"status": "failed", "message": str(error),
                         "exception": {"type": type(error).__name__, "message": str(error)}})
            print("Failed. " + str(error))
            case["context"] = _failure_context(case)
            for context in case["context"]:
                print("Failure details: " + context)
            print("Suggested correction: " + case["suggestion"])
            print("Remaining examples for this component were skipped after this failure. Independent components will still be tested.")
            if not isinstance(error, AssertionError):
                import sys
                print_exception = getattr(sys, "print_exception", None)
                if print_exception is not None:
                    print_exception(error, sys.stderr)
        else:
            case.update({"status": "passed", "message": observed})
            print("Observed behavior: " + observed)
            print("Passed. The tested examples produced the expected results.")
        print("")
        _report["counts"]["not_run"] -= 1
        _report["counts"][case["status"]] += 1
        _report["last_completed_case"] = case["id"]
        _publish()
    _active_case = None
    counts = _report["counts"]
    _report["status"] = "failed" if counts["failed"] else "not_implemented" if counts["not_implemented"] else "passed"
    _report["complete"] = True
    _publish()
    print("Test complete: {} passed; {} not implemented; {} failed.".format(counts["passed"], counts["not_implemented"], counts["failed"]))
    if counts["failed"]:
        raise AssertionError("{} component check(s) failed. Review the reported method, example inputs and suggested corrections above.".format(counts["failed"]))


__all__ = ("run_component_checks", "get_check_report", "CONTRACTS")
