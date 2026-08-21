"""Small, hardware-free checks for the student component modules.

Run these checks while implementing a component. PENDING means its method still
raises NotImplementedError; FAIL identifies an implemented behavior to inspect.
"""

from math import pi

from ucsb_xrp import (
    GridCell,
    MotionCommand,
    NavigationConfig,
    NavigationGoal,
    OccupancyGrid,
    Pose,
    RawSensors,
    RobotConfig,
    WheelSpeeds,
)

_failures = 0
_passes = 0
_pending = 0


def close(actual, expected, tolerance=1e-6):
    if abs(actual - expected) > tolerance:
        raise AssertionError("expected {}, received {}".format(expected, actual))


def check(name, function):
    global _failures, _passes, _pending
    try:
        function()
    except NotImplementedError:
        _pending += 1
        print("PENDING · " + name)
    except Exception as error:
        _failures += 1
        print("FAIL · {} · {}".format(name, error))
    else:
        _passes += 1
        print("PASS · " + name)


def check_sensor_model():
    from sensor_model import SensorModel

    config = RobotConfig(
        wheel_diameter_mm=60.0,
        encoder_counts_per_revolution=600.0,
        wheel_speed_filter_time_constant_ms=80.0,
    )
    model = SensorModel(config)
    zero = model.reset(RawSensors(100, 10, 20, 500.0, False))
    close(zero.left_position_mm, 0.0)
    measured = model.update(RawSensors(120, 11, 21, 450.0, True))
    close(measured.left_increment_mm, pi / 10.0)
    close(measured.right_increment_mm, pi / 10.0)
    raw_speed_mm_s = 5.0 * pi
    if not 0.0 < measured.left_speed_mm_s < raw_speed_mm_s:
        raise AssertionError("wheel speed should attenuate one-count steps")
    if not measured.button_pressed:
        raise AssertionError("USER button state was not preserved")


def check_wheel_controller():
    from wheel_speed_controller import WheelSpeedController

    config = RobotConfig(
        left_start_command=0.1,
        right_start_command=0.1,
        left_speed_command_gain=0.002,
        right_speed_command_gain=0.002,
        wheel_speed_kp=0.001,
        max_drive_command=0.6,
    )
    controller = WheelSpeedController(config)
    controller.reset()
    command = controller.update(WheelSpeeds(100.0, -100.0), WheelSpeeds(80.0, -80.0))
    close(command.left, 0.32)
    close(command.right, -0.32)


def check_differential_drive():
    from differential_drive import DifferentialDrive

    drive = DifferentialDrive(RobotConfig(track_width_mm=100.0))
    speeds = drive.wheel_speeds(MotionCommand(100.0, 2.0))
    close(speeds.left_mm_s, 0.0)
    close(speeds.right_mm_s, 200.0)


def check_odometry():
    from odometry import Odometry

    odometry = Odometry(RobotConfig(track_width_mm=100.0))
    odometry.reset(Pose(0.0, 0.0, 0.0))
    pose = odometry.update(10.0, 10.0)
    close(pose.x_mm, 10.0)
    close(pose.y_mm, 0.0)
    close(pose.heading_rad, 0.0)


def check_navigation():
    from navigation_controller import NavigationController

    config = NavigationConfig(
        cruise_speed_mm_s=120.0,
        approach_speed_mm_s=50.0,
        slowdown_distance_mm=150.0,
        turn_rate_rad_s=0.8,
        position_tolerance_mm=10.0,
        heading_tolerance_rad=0.08,
        realign_heading_rad=0.25,
    )
    navigation = NavigationController(config)
    navigation.start((NavigationGoal(200.0, 0.0),))
    command = navigation.update(Pose(0.0, 0.0, 0.0))
    if command.forward_speed_mm_s <= 0.0:
        raise AssertionError("a goal straight ahead should request forward motion")


def check_grid_planner():
    from grid_planner import GridPlanner

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
    path = GridPlanner().plan(grid, start, goal)
    if path is None or path.cells[0] != start or path.cells[-1] != goal:
        raise AssertionError("planner did not connect start to goal")
    if len(path.cells) != 5:
        raise AssertionError("planner did not return a shortest free path")


check("SensorModel", check_sensor_model)
check("WheelSpeedController", check_wheel_controller)

try:
    import differential_drive
except ImportError:
    pass
else:
    check("DifferentialDrive", check_differential_drive)

try:
    import odometry
except ImportError:
    pass
else:
    check("Odometry", check_odometry)

try:
    import navigation_controller
except ImportError:
    pass
else:
    check("NavigationController", check_navigation)

try:
    import grid_planner
except ImportError:
    pass
else:
    check("GridPlanner", check_grid_planner)

print("{} passed · {} pending · {} failed".format(_passes, _pending, _failures))
if _failures:
    raise AssertionError("{} component check(s) failed".format(_failures))
