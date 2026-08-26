"""Supplied hardware-free checks for course component implementations."""

from math import pi

from .config import NavigationConfig, RobotConfig
from .maps import OccupancyGrid
from .records import (
    DriveCommand,
    GridCell,
    MotionCommand,
    NavigationGoal,
    Pose,
    RawSensors,
    WheelSpeeds,
)


def _close(actual, expected, tolerance=1e-6):
    if abs(actual - expected) > tolerance:
        raise AssertionError(
            "expected {}, received {}".format(expected, actual)
        )


def _sensor_model(component_class):
    config = RobotConfig(
        wheel_diameter_mm=60.0,
        encoder_counts_per_revolution=600.0,
        wheel_speed_filter_time_constant_ms=80.0,
    )
    model = component_class(config)
    zero = model.reset(RawSensors(100, 10, 20, 500.0, False))
    _close(zero.dt_s, 0.0)
    _close(zero.left_position_mm, 0.0)
    _close(zero.right_position_mm, 0.0)
    _close(zero.left_increment_mm, 0.0)
    _close(zero.right_increment_mm, 0.0)
    _close(zero.left_speed_mm_s, 0.0)
    _close(zero.right_speed_mm_s, 0.0)
    _close(zero.range_mm, 500.0)
    measured = model.update(RawSensors(120, 11, 21, 450.0, True))
    _close(measured.dt_s, 0.02)
    _close(measured.left_position_mm, pi / 10.0)
    _close(measured.right_position_mm, pi / 10.0)
    _close(measured.left_increment_mm, pi / 10.0)
    _close(measured.right_increment_mm, pi / 10.0)
    raw_one_count_speed_mm_s = 5.0 * pi
    if not 0.0 < measured.left_speed_mm_s < raw_one_count_speed_mm_s:
        raise AssertionError(
            "measured wheel speed should regularize a one-count step"
        )
    if not measured.button_pressed:
        raise AssertionError("USER button state was not preserved")


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
    command = controller.update(
        WheelSpeeds(100.0, -100.0),
        WheelSpeeds(80.0, -80.0),
    )
    if not isinstance(command, DriveCommand):
        raise AssertionError("update() should return a DriveCommand")
    if command.left <= 0.0 or command.right >= 0.0:
        raise AssertionError("commands should follow the target wheel directions")
    if abs(command.left) > 0.6 or abs(command.right) > 0.6:
        raise AssertionError("commands should respect max_drive_command")
    stopped = controller.update(
        WheelSpeeds(0.0, 0.0),
        WheelSpeeds(20.0, -20.0),
    )
    if stopped.left != 0.0 or stopped.right != 0.0:
        raise AssertionError("a zero target should command exact zero")


def _range_estimator(component_class):
    model = component_class(RobotConfig())
    samples = (None, 400.0, float("nan"), -2.0, 100.0, 300.0, 200.0)
    _close(model.estimate_range(samples, 3), 250.0)
    if model.estimate_range(samples, 5) is not None:
        raise AssertionError("too few usable readings should return None")
    _close(model.estimate_range((500.0, 100.0, 300.0), 3), 300.0)
    _close(model.estimate_range((500.0, 100.0, 300.0, 200.0), 4), 250.0)


def _differential_drive(component_class):
    drive = component_class(RobotConfig(track_width_mm=100.0))
    straight = drive.wheel_speeds(MotionCommand(80.0, 0.0))
    _close(straight.left_mm_s, 80.0)
    _close(straight.right_mm_s, 80.0)
    speeds = drive.wheel_speeds(MotionCommand(100.0, 2.0))
    _close(speeds.left_mm_s, 0.0)
    _close(speeds.right_mm_s, 200.0)
    turn = drive.wheel_speeds(MotionCommand(0.0, -1.0))
    _close(turn.left_mm_s, 50.0)
    _close(turn.right_mm_s, -50.0)


def _odometry(component_class):
    odometry = component_class(RobotConfig(track_width_mm=100.0))
    initial = odometry.reset(Pose(0.0, 0.0, 0.0))
    if initial != Pose(0.0, 0.0, 0.0) or odometry.pose != initial:
        raise AssertionError("reset() and pose should report the initial pose")
    pose = odometry.update(10.0, 10.0)
    _close(pose.x_mm, 10.0)
    _close(pose.y_mm, 0.0)
    _close(pose.heading_rad, 0.0)
    odometry.reset(Pose(0.0, 0.0, 0.0))
    turn = odometry.update(-50.0, 50.0)
    _close(turn.x_mm, 0.0)
    _close(turn.y_mm, 0.0)
    _close(turn.heading_rad, 1.0)


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
    _close(stopped.forward_speed_mm_s, 0.0)
    _close(stopped.turn_rate_rad_s, 0.0)

    navigation.start((NavigationGoal(200.0, 0.0),))
    command = navigation.update(Pose(0.0, 0.0, 0.0))
    if not isinstance(command, MotionCommand):
        raise AssertionError("update() should return a MotionCommand")
    if command.forward_speed_mm_s <= 0.0:
        raise AssertionError("a goal straight ahead should request forward motion")
    if navigation.current_goal() != NavigationGoal(200.0, 0.0):
        raise AssertionError("current_goal() should return the active goal")

    navigation.start((NavigationGoal(0.0, 0.0, pi / 2.0),))
    turn = navigation.update(Pose(0.0, 0.0, 0.0))
    _close(turn.forward_speed_mm_s, 0.0)
    if turn.turn_rate_rad_s <= 0.0:
        raise AssertionError("a positive final-heading error should turn left")
    stopped = navigation.update(Pose(0.0, 0.0, pi / 2.0))
    _close(stopped.forward_speed_mm_s, 0.0)
    _close(stopped.turn_rate_rad_s, 0.0)
    if not navigation.is_complete():
        raise AssertionError("the route should complete at its final pose")


def _grid_planner(component_class):
    planner = component_class()
    open_grid = OccupancyGrid(
        100.0,
        0.0,
        0.0,
        3,
        1,
        (False, False, False),
    )
    direct_start = GridCell(0, 0)
    direct_goal = GridCell(2, 0)
    direct = planner.plan(open_grid, direct_start, direct_goal)
    if direct is None or direct.cells != (
        direct_start,
        GridCell(1, 0),
        direct_goal,
    ):
        raise AssertionError("planner should return the direct three-cell path")

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
    if path is None or path.cells[0] != start or path.cells[-1] != goal:
        raise AssertionError("planner did not connect start to goal")
    if len(path.cells) != 5:
        raise AssertionError("planner did not return a shortest free path")
    for first, second in zip(path.cells, path.cells[1:]):
        if second not in grid.neighbors(first):
            raise AssertionError("successive path cells must be free neighbors")

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


_CHECKS = (
    (
        "SensorModel · encoder distance and measured speed",
        "sensor_model",
        _sensor_model,
    ),
    (
        "WheelSpeedController · signed and bounded motor command",
        "wheel_speed_controller",
        _wheel_speed_controller,
    ),
    (
        "SensorModel · robust ultrasound estimate",
        "range_estimator",
        _range_estimator,
    ),
    (
        "DifferentialDrive · body command to wheel targets",
        "differential_drive",
        _differential_drive,
    ),
    (
        "Odometry · straight wheel increments to pose",
        "odometry",
        _odometry,
    ),
    (
        "NavigationController · forward goal to motion command",
        "navigation_controller",
        _navigation_controller,
    ),
    (
        "GridPlanner · shortest path around a blocked cell",
        "grid_planner",
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
    pending = 0
    failed = 0
    print("Concrete component examples use MicroPython without starting either robot.")
    for label, key, check_function in _CHECKS:
        component_class = components.get(key)
        if component_class is None:
            continue
        try:
            check_function(component_class)
        except NotImplementedError:
            pending += 1
            print("PENDING · " + label)
        except Exception as error:
            failed += 1
            print("FAIL · {} · {}".format(label, error))
        else:
            passed += 1
            print("PASS · " + label)

    print("{} passed · {} pending · {} failed".format(passed, pending, failed))
    if failed:
        raise AssertionError("{} component check(s) failed".format(failed))


__all__ = ("run_component_checks",)
