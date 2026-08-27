"""Supplied hardware-free checks for course component implementations."""

from math import cos, pi, sin

from .config import NavigationConfig, RobotConfig
from .maps import OccupancyGrid
from .records import (
    DriveCommand,
    GridCell,
    GridPath,
    MotionCommand,
    NavigationGoal,
    Pose,
    RawSensors,
    WheelSpeeds,
)


def _close(label, actual, expected, tolerance=1e-6):
    if abs(actual - expected) > tolerance:
        raise AssertionError(
            "{}: expected {}, received {}".format(label, expected, actual)
        )


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
    _close("reset dt_s", zero.dt_s, 0.0)
    _close("reset left position (mm)", zero.left_position_mm, 0.0)
    _close("reset right position (mm)", zero.right_position_mm, 0.0)
    _close("reset left increment (mm)", zero.left_increment_mm, 0.0)
    _close("reset right increment (mm)", zero.right_increment_mm, 0.0)
    _close("reset left speed (mm/s)", zero.left_speed_mm_s, 0.0)
    _close("reset right speed (mm/s)", zero.right_speed_mm_s, 0.0)
    _close("preserved reset range (mm)", zero.range_mm, 500.0)
    measured = model.update(RawSensors(125, 9, 21, 450.0, True))
    _close("update dt_s from device time", measured.dt_s, 0.025)
    _close("left position (mm)", measured.left_position_mm, pi / 10.0)
    _close("right position (mm)", measured.right_position_mm, pi / 10.0)
    _close("left increment (mm)", measured.left_increment_mm, pi / 10.0)
    _close("right increment (mm)", measured.right_increment_mm, pi / 10.0)
    raw_one_count_speed_mm_s = 4.0 * pi
    if not 0.0 < measured.left_speed_mm_s < raw_one_count_speed_mm_s:
        raise AssertionError(
            (
                "left speed (mm/s): expected a positive estimate based on "
                "recent encoder samples below {}, received {}"
            ).format(
                raw_one_count_speed_mm_s, measured.left_speed_mm_s
            )
        )
    if not 0.0 < measured.right_speed_mm_s < raw_one_count_speed_mm_s:
        raise AssertionError(
            (
                "right speed (mm/s): expected a positive estimate based on "
                "recent encoder samples below {}, received {}"
            ).format(
                raw_one_count_speed_mm_s, measured.right_speed_mm_s
            )
        )
    if not measured.button_pressed:
        raise AssertionError("USER button state was not preserved")
    _close("preserved update range (mm)", measured.range_mm, 450.0)

    next_measured = model.update(RawSensors(165, 7, 23, None, False))
    _close("next dt_s from device time", next_measured.dt_s, 0.04)
    _close("cumulative left position (mm)", next_measured.left_position_mm, 3.0 * pi / 10.0)
    _close("latest left increment (mm)", next_measured.left_increment_mm, 2.0 * pi / 10.0)
    _close("cumulative right position (mm)", next_measured.right_position_mm, 3.0 * pi / 10.0)
    _close("latest right increment (mm)", next_measured.right_increment_mm, 2.0 * pi / 10.0)
    if next_measured.left_speed_mm_s <= measured.left_speed_mm_s:
        raise AssertionError(
            (
                "left speed response (mm/s): expected the estimate to increase "
                "after the faster sample; received first={} next={}"
            ).format(
                measured.left_speed_mm_s,
                next_measured.left_speed_mm_s,
            )
        )
    if next_measured.right_speed_mm_s <= measured.right_speed_mm_s:
        raise AssertionError(
            (
                "right speed response (mm/s): expected the estimate to increase "
                "after the faster sample; received first={} next={}"
            ).format(
                measured.right_speed_mm_s,
                next_measured.right_speed_mm_s,
            )
        )
    return (
        "dt = {:.3f}/{:.3f} s; positions = {:.3f}/{:.3f} mm; "
        "latest increments = {:.3f}/{:.3f} mm; left speed = {:.3f}->{:.3f} "
        "mm/s; right speed = {:.3f}->{:.3f} mm/s"
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
        raise AssertionError("update() should return a DriveCommand")
    if close_command.left <= 0.0 or close_command.right >= 0.0:
        raise AssertionError(
            (
                "drive-command signs: expected left positive and right negative, "
                "received left={} right={}"
            ).format(
                close_command.left, close_command.right
            )
        )
    if abs(close_command.left) > 0.6 or abs(close_command.right) > 0.6:
        raise AssertionError("commands should respect max_drive_command")
    controller.reset()
    underspeed_command = controller.update(
        WheelSpeeds(100.0, -100.0),
        WheelSpeeds(20.0, -20.0),
    )
    if underspeed_command.left <= close_command.left:
        raise AssertionError(
            (
                "left speed response: expected more command for the larger "
                "positive speed error; received close={} underspeed={}"
            ).format(
                close_command.left,
                underspeed_command.left,
            )
        )
    if underspeed_command.right >= close_command.right:
        raise AssertionError(
            (
                "right speed response: expected more negative command for the "
                "larger negative speed error; received close={} underspeed={}"
            ).format(
                close_command.right,
                underspeed_command.right,
            )
        )
    if abs(underspeed_command.left) > 0.6 or abs(underspeed_command.right) > 0.6:
        raise AssertionError("commands should respect max_drive_command")
    controller.reset()
    stopped = controller.update(
        WheelSpeeds(0.0, 0.0),
        WheelSpeeds(20.0, -20.0),
    )
    if stopped.left != 0.0 or stopped.right != 0.0:
        raise AssertionError(
            "zero target: expected left=0.0 right=0.0, received left={} right={}".format(
                stopped.left, stopped.right
            )
        )
    return (
        "target +100/-100 mm/s: measured +80/-80 gave {:.3f}/{:.3f}; "
        "measured +20/-20 gave {:.3f}/{:.3f}; zero target gave 0/0"
    ).format(
        close_command.left,
        close_command.right,
        underspeed_command.left,
        underspeed_command.right,
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
        raise AssertionError("too few usable readings should return None")
    _close("odd-count median (mm)", model.estimate_range((500.0, 100.0, 300.0), 3), 300.0)
    _close("even-count median (mm)", model.estimate_range((500.0, 100.0, 300.0, 200.0), 4), 250.0)
    try:
        model.estimate_range((100.0,), 0)
    except (TypeError, ValueError):
        pass
    else:
        raise AssertionError("minimum_usable: expected rejection of 0")
    return "mixed median = 250 mm; odd/even medians = 300/250 mm; too few = None"


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
    return "straight 80/80; moving turn 0/200; in-place right turn 50/-50 mm/s"


def _odometry(component_class):
    odometry = component_class(RobotConfig(track_width_mm=100.0))
    initial = odometry.reset(Pose(0.0, 0.0, 0.0))
    if initial != Pose(0.0, 0.0, 0.0) or odometry.pose != initial:
        raise AssertionError("reset() and pose should report the initial pose")
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
        raise AssertionError("pose property: expected the latest returned Pose")
    return (
        "straight pose = (10.000, 0.000, 0.000); in-place heading = 1.000 rad; "
        "curved pose = ({:.3f}, {:.3f}, {:.3f})"
    ).format(curve.x_mm, curve.y_mm, curve.heading_rad)


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
        raise AssertionError("an empty route should be complete")
    stopped = navigation.update(Pose(0.0, 0.0, 0.0))
    _close("empty-route forward speed (mm/s)", stopped.forward_speed_mm_s, 0.0)
    _close("empty-route turn rate (rad/s)", stopped.turn_rate_rad_s, 0.0)

    navigation.start((NavigationGoal(200.0, 0.0),))
    command = navigation.update(Pose(0.0, 0.0, 0.0))
    if not isinstance(command, MotionCommand):
        raise AssertionError("update() should return a MotionCommand")
    if command.forward_speed_mm_s <= 0.0:
        raise AssertionError("a goal straight ahead should request forward motion")
    if navigation.current_goal() != NavigationGoal(200.0, 0.0):
        raise AssertionError("current_goal() should return the active goal")

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
    _close("side-goal forward speed (mm/s)", side_turn.forward_speed_mm_s, 0.0)
    if side_turn.turn_rate_rad_s <= 0.0:
        raise AssertionError(
            "side-goal turn rate (rad/s): expected a positive left turn, received {}".format(
                side_turn.turn_rate_rad_s
            )
        )

    right_navigation = component_class(config)
    right_navigation.start((NavigationGoal(0.0, -200.0),))
    right_turn = right_navigation.update(Pose(0.0, 0.0, 0.0))
    _close("right-goal forward speed (mm/s)", right_turn.forward_speed_mm_s, 0.0)
    if right_turn.turn_rate_rad_s >= 0.0:
        raise AssertionError(
            "right-goal turn rate (rad/s): expected a negative right turn, received {}".format(
                right_turn.turn_rate_rad_s
            )
        )

    wrap_navigation = component_class(config)
    wrap_navigation.start((NavigationGoal(-200.0, -10.0),))
    wrap_turn = wrap_navigation.update(Pose(0.0, 0.0, pi - 0.05))
    _close("wrapped-goal forward speed (mm/s)", wrap_turn.forward_speed_mm_s, 0.0)
    if wrap_turn.turn_rate_rad_s <= 0.0:
        raise AssertionError(
            (
                "wrapped-goal turn rate (rad/s): expected the shorter positive "
                "turn across -pi/pi, received {}"
            ).format(
                wrap_turn.turn_rate_rad_s
            )
        )

    realign_navigation = component_class(config)
    realign_navigation.start((NavigationGoal(200.0, 0.0),))
    driving = realign_navigation.update(Pose(0.0, 0.0, 0.0))
    if driving.forward_speed_mm_s <= 0.0:
        raise AssertionError("an aligned goal should begin with forward motion")
    realign_turn = realign_navigation.update(Pose(0.0, 0.0, 0.4))
    _close(
        "realignment forward speed (mm/s)",
        realign_turn.forward_speed_mm_s,
        0.0,
    )
    if realign_turn.turn_rate_rad_s >= 0.0:
        raise AssertionError(
            "realignment turn rate (rad/s): expected a negative correction, received {}".format(
                realign_turn.turn_rate_rad_s
            )
        )

    ordered = component_class(config)
    first_goal = NavigationGoal(0.0, 0.0)
    second_goal = NavigationGoal(200.0, 0.0)
    ordered.start((first_goal, second_goal))
    ordered.update(Pose(0.0, 0.0, 0.0))
    if ordered.current_goal() != second_goal:
        raise AssertionError(
            "ordered route: expected the second goal after reaching the first"
        )

    navigation.start((NavigationGoal(0.0, 0.0, pi / 2.0),))
    turn = navigation.update(Pose(0.0, 0.0, 0.0))
    _close("final-align forward speed (mm/s)", turn.forward_speed_mm_s, 0.0)
    if turn.turn_rate_rad_s <= 0.0:
        raise AssertionError("a positive final-heading error should turn left")
    stopped = navigation.update(Pose(0.0, 0.0, pi / 2.0))
    _close("completed forward speed (mm/s)", stopped.forward_speed_mm_s, 0.0)
    _close("completed turn rate (rad/s)", stopped.turn_rate_rad_s, 0.0)
    if not navigation.is_complete():
        raise AssertionError("the route should complete at its final pose")
    return (
        "forward = {:.1f} mm/s; left/right turns = {:.1f}/{:.1f} rad/s; "
        "wrapped turn = {:.1f} rad/s; realignment = {:.1f} rad/s; route completed"
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
            raise AssertionError("planner should return a GridPath")
        if route.cells[0] != start or route.cells[-1] != goal:
            raise AssertionError("route should begin at start and end at goal")
        for cell in route.cells:
            if grid.is_blocked(cell):
                raise AssertionError("every route cell should be free")
        for first, second in zip(route.cells, route.cells[1:]):
            if second not in grid.neighbors(first):
                raise AssertionError(
                    "successive route cells should share a horizontal or vertical side"
                )

    if direct is None:
        raise AssertionError("planner should connect the unobstructed endpoints")
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
        raise AssertionError("planner did not connect start to goal")
    check_route(grid, start, goal, path)

    if planner.plan(open_grid, None, direct_goal) is not None:
        raise AssertionError("a missing start should return None")
    if planner.plan(open_grid, direct_start, None) is not None:
        raise AssertionError("a missing goal should return None")
    if planner.plan(open_grid, GridCell(9, 9), direct_goal) is not None:
        raise AssertionError("an out-of-grid start should return None")

    blocked_start = OccupancyGrid(
        100.0,
        0.0,
        0.0,
        2,
        1,
        (True, False),
    )
    if planner.plan(blocked_start, GridCell(0, 0), GridCell(1, 0)) is not None:
        raise AssertionError("a blocked endpoint should return None")

    divided = OccupancyGrid(
        100.0,
        0.0,
        0.0,
        3,
        2,
        (False, True, False, False, True, False),
    )
    if planner.plan(divided, GridCell(0, 0), GridCell(2, 0)) is not None:
        raise AssertionError("a disconnected goal should return None")

    same = planner.plan(open_grid, direct_start, direct_start)
    if same is None or same.cells != (direct_start,):
        raise AssertionError("start equal to goal should return a one-cell path")
    return "direct path = {} cells; detour path = {} cells; invalid/disconnected = None".format(
        len(direct.cells),
        len(path.cells),
    )


_CHECKS = (
    (
        "SensorModel · encoder distance and measured speed",
        "sensor_model",
        (
            "reset at counts 10/20; move forward with a reversed left encoder "
            "over unequal 25/40 ms samples"
        ),
        (
            "device timestamps set dt; encoder signs set forward distance; "
            "positions accumulate; increments remain per-sample; speed responds"
        ),
        _sensor_model,
    ),
    (
        "WheelSpeedController · signed and limited motor command",
        "wheel_speed_controller",
        (
            "request +100/-100 mm/s at two measured speeds, then verify "
            "direction, response to speed error, limits, and stop"
        ),
        (
            "a larger speed error produces a stronger command in the requested "
            "direction; limits hold; a zero target gives exact zero"
        ),
        _wheel_speed_controller,
    ),
    (
        "SensorModel · robust ultrasound estimate",
        "range_estimator",
        "combine valid, missing, nonfinite, and negative range samples and calculate the median",
        (
            "invalid readings are ignored; enough usable readings produce the "
            "odd/even median; too few produce None"
        ),
        _range_estimator,
    ),
    (
        "DifferentialDrive · body command to wheel targets",
        "differential_drive",
        "check a straight command, a moving turn, and an in-place right turn",
        (
            "straight motion gives equal wheel targets; turning gives the "
            "wheel-speed difference with the correct sign"
        ),
        _differential_drive,
    ),
    (
        "Odometry · measured wheel increments to pose",
        "odometry",
        "update pose after equal, equal-and-opposite, and unequal wheel travel",
        (
            "equal travel advances straight; opposite travel turns in place; "
            "unequal travel gives the corresponding planar arc"
        ),
        _odometry,
    ),
    (
        "NavigationController · goals to motion commands",
        "navigation_controller",
        (
            "check empty/ordered routes, forward/left/right goals, angle wrap, "
            "realignment, and a required final heading"
        ),
        (
            "routes advance in order; steering uses the shorter signed turn; "
            "large heading error suspends forward motion; completion stops"
        ),
        _navigation_controller,
    ),
    (
        "GridPlanner · connected route through free cells",
        "grid_planner",
        (
            "check unobstructed and detour routes, missing or blocked endpoints, "
            "no-route cases, and start equal to goal"
        ),
        (
            "a returned path joins free side-sharing cells from start to goal; "
            "invalid or disconnected endpoints return None"
        ),
        _grid_planner,
    ),
)

_CLASS_KEYS = {
    "SensorModel": "sensor_model",
    "WheelSpeedController": "wheel_speed_controller",
    "DifferentialDrive": "differential_drive",
    "Odometry": "odometry",
    "NavigationController": "navigation_controller",
    "GridPlanner": "grid_planner",
}


def run_component_checks(*component_classes, **components):
    """Run concrete hardware-free examples for the supplied component classes.

    Classes may be passed directly in course order. The earlier named-keyword
    form remains accepted. Set ``include_range=True`` in Challenge 5 to check
    the range-estimation portion of ``SensorModel`` as well.

    Each example reports PASS, NOT IMPLEMENTED, or FAIL. A run with failures,
    or one in which every selected example is not implemented, raises
    AssertionError after printing the summary.
    """
    include_range = components.pop("include_range", False)
    if not isinstance(include_range, bool):
        raise TypeError("include_range must be True or False")
    for component_class in component_classes:
        key = _CLASS_KEYS.get(getattr(component_class, "__name__", ""))
        if key is None:
            raise ValueError(
                "unknown component class: "
                + getattr(component_class, "__name__", str(component_class))
            )
        if key in components:
            raise ValueError("component supplied more than once: " + key)
        components[key] = component_class
    if include_range:
        sensor_model = components.get("sensor_model")
        if sensor_model is None:
            raise ValueError("include_range requires SensorModel")
        components["range_estimator"] = sensor_model

    unknown = set(components).difference(item[1] for item in _CHECKS)
    if unknown:
        raise ValueError("unknown component check: " + sorted(unknown)[0])
    if not components:
        raise ValueError("at least one component class is required")

    passed = 0
    not_implemented = 0
    failed = 0
    print("Concrete component examples use MicroPython without starting either robot.")
    for label, key, input_description, expected, check_function in _CHECKS:
        component_class = components.get(key)
        if component_class is None:
            continue
        print("CHECK · " + label)
        print("INPUT · " + input_description)
        print("EXPECT · " + expected)
        try:
            observed = check_function(component_class)
        except NotImplementedError as error:
            not_implemented += 1
            detail = str(error)
            print(
                "NOT IMPLEMENTED · "
                + label
                + ((" · " + detail) if detail else "")
            )
        except Exception as error:
            failed += 1
            print("FAIL · {} · {}".format(label, error))
        else:
            passed += 1
            print("OBSERVED · " + observed)
            print("PASS · " + label)

    print(
        "{} passed · {} not implemented · {} failed".format(
            passed,
            not_implemented,
            failed,
        )
    )
    if failed:
        raise AssertionError("{} component check(s) failed".format(failed))
    if passed == 0 and not_implemented:
        raise AssertionError("no component checks passed")


__all__ = ("run_component_checks",)
