import math
import pathlib
import sys
import unittest


REPOSITORY_ROOT = pathlib.Path(__file__).resolve().parents[2]
VENDOR_ROOT = REPOSITORY_ROOT / "vendor" / "current"
REFERENCE_SOURCE_ROOT = VENDOR_ROOT / "reference_source"
sys.path.insert(0, str(VENDOR_ROOT))
sys.path.insert(0, str(REFERENCE_SOURCE_ROOT))

from ucsb_xrp import (  # noqa: E402
    ArenaMap,
    DeliveryMission,
    DeliveryTask,
    GridCell,
    GridPath,
    Measurements,
    MotionCommand,
    NavigationConfig,
    NavigationGoal,
    OccupancyGrid,
    Pose,
    RawSensors,
    Rectangle,
    Robot,
    RobotConfig,
    RobotState,
    STOP_COMMAND,
)
from ucsb_xrp_reference import (  # noqa: E402
    DifferentialDrive,
    GridPlanner,
    NavigationController,
    Odometry,
    SensorModel,
    WheelSpeedController,
)
from ucsb_xrp._telemetry import clear_state, state_snapshot  # noqa: E402
from ucsb_xrp import _telemetry as course_telemetry  # noqa: E402
from ucsb_xrp.robot import _set_managed_start  # noqa: E402


def navigation_config():
    return NavigationConfig(
        cruise_speed_mm_s=120,
        approach_speed_mm_s=45,
        slowdown_distance_mm=150,
        turn_rate_rad_s=0.8,
        position_tolerance_mm=10,
        heading_tolerance_rad=0.08,
        realign_heading_rad=0.25,
    )


class GeometryAndPlanningTests(unittest.TestCase):
    def test_named_feature_changes_without_mutating_source_map(self):
        arena = ArenaMap(
            (0, 0, 400, 300),
            obstacles=((100, 100, 150, 150),),
            features={"door": (200, 100, 220, 200)},
        )
        blocked = arena.with_feature_blocked("door", True)

        self.assertEqual(arena.blocked_features, ())
        self.assertEqual(blocked.blocked_features, ("door",))
        self.assertTrue(arena.is_free(210, 150))
        self.assertFalse(blocked.is_free(210, 150))
        self.assertFalse(arena.is_free(95, 125, clearance_mm=5))
        self.assertFalse(arena.is_free(3, 3, clearance_mm=5))

    def test_grid_coordinates_neighbors_and_endpoint_rules(self):
        arena = ArenaMap((0, 0, 300, 200), obstacles=((100, 0, 200, 100),))
        grid = OccupancyGrid.from_arena(arena, resolution_mm=100)

        self.assertEqual((grid.column_count, grid.row_count), (3, 2))
        self.assertEqual(grid.world_to_cell(10, 10), GridCell(0, 0))
        self.assertIsNone(grid.world_to_cell(300, 20))
        self.assertEqual(grid.cell_center(GridCell(2, 1)), (250.0, 150.0))
        self.assertTrue(grid.is_blocked(GridCell(1, 0)))
        self.assertEqual(
            grid.neighbors(GridCell(0, 0)),
            (GridCell(0, 1),),
        )

    def test_breadth_first_search_returns_a_shortest_path(self):
        grid = OccupancyGrid(
            resolution_mm=100,
            origin_x_mm=0,
            origin_y_mm=0,
            column_count=4,
            row_count=3,
            blocked=(
                False,
                True,
                False,
                False,
                False,
                True,
                False,
                False,
                False,
                False,
                False,
                False,
            ),
        )
        path = GridPlanner().plan(grid, GridCell(0, 0), GridCell(3, 0))

        self.assertIsNotNone(path)
        self.assertEqual(path.cells[0], GridCell(0, 0))
        self.assertEqual(path.cells[-1], GridCell(3, 0))
        self.assertEqual(len(path.cells), 8)
        self.assertEqual(
            path.to_goals(grid),
            (
                NavigationGoal(50, 250),
                NavigationGoal(350, 250),
                NavigationGoal(350, 50),
            ),
        )

    def test_planner_handles_identity_blocked_and_disconnected_cases(self):
        open_grid = OccupancyGrid(10, 0, 0, 2, 1, (False, False))
        self.assertEqual(
            GridPlanner().plan(open_grid, GridCell(0, 0), GridCell(0, 0)),
            GridPath((GridCell(0, 0),)),
        )
        self.assertIsNone(GridPlanner().plan(open_grid, None, GridCell(0, 0)))

        closed_grid = OccupancyGrid(10, 0, 0, 3, 1, (False, True, False))
        self.assertIsNone(
            GridPlanner().plan(closed_grid, GridCell(0, 0), GridCell(2, 0))
        )


class KinematicsAndNavigationTests(unittest.TestCase):
    def setUp(self):
        self.config = RobotConfig(track_width_mm=100)

    def test_inverse_kinematics_preserves_forward_and_turn_conventions(self):
        result = DifferentialDrive(self.config).wheel_speeds(
            MotionCommand(forward_speed_mm_s=200, turn_rate_rad_s=1.0)
        )
        self.assertEqual(result.left_mm_s, 150)
        self.assertEqual(result.right_mm_s, 250)

    def test_odometry_integrates_straight_turn_and_exact_arc(self):
        odometry = Odometry(self.config)
        self.assertEqual(odometry.reset(Pose(0, 0, 0)), Pose(0, 0, 0))
        self.assertEqual(odometry.update(20, 20), Pose(20, 0, 0))

        turn = odometry.update(-math.pi * 25, math.pi * 25)
        self.assertAlmostEqual(turn.x_mm, 20)
        self.assertAlmostEqual(turn.y_mm, 0)
        self.assertAlmostEqual(turn.heading_rad, math.pi / 2)

        arc = Odometry(self.config)
        arc.reset(Pose(0, 0, 0))
        pose = arc.update(0, math.pi * 50)
        self.assertAlmostEqual(pose.x_mm, 50)
        self.assertAlmostEqual(pose.y_mm, 50)
        self.assertAlmostEqual(pose.heading_rad, math.pi / 2)

    def test_navigation_turns_drives_slows_aligns_and_completes(self):
        controller = NavigationController(navigation_config())
        final = NavigationGoal(200, 0, math.pi / 2)
        controller.start((final,))

        turn = controller.update(Pose(0, 0, math.pi / 2))
        self.assertEqual(turn.forward_speed_mm_s, 0)
        self.assertLess(turn.turn_rate_rad_s, 0)

        drive = controller.update(Pose(0, 0, 0))
        approach = controller.update(Pose(100, 0, 0))
        self.assertEqual(drive.forward_speed_mm_s, 120)
        self.assertEqual(approach.forward_speed_mm_s, 45)

        align = controller.update(Pose(197, 0, 0))
        self.assertEqual(align.forward_speed_mm_s, 0)
        self.assertGreater(align.turn_rate_rad_s, 0)
        self.assertEqual(controller.update(Pose(197, 0, math.pi / 2)), STOP_COMMAND)
        self.assertTrue(controller.is_complete())


class FakeBot:
    def __init__(self):
        self.events = []
        self.count = 0

    def wait_for_button(self):
        self.events.append("wait")

    def reset_encoders(self):
        self.events.append("reset")
        self.count = 0

    def read(self, include_range=False):
        self.events.append("range" if include_range else "read")
        self.count += 10
        return RawSensors(
            time_ms=self.count * 2,
            left_encoder_count=self.count,
            right_encoder_count=self.count,
            range_mm=180 if include_range else None,
            button_pressed=False,
        )

    def set_drive(self, command):
        self.events.append(("drive", command))

    def stop(self):
        self.events.append("stop")


class RobotAndMissionTests(unittest.TestCase):
    def make_robot(self):
        config = RobotConfig(
            sample_period_ms=20,
            wheel_diameter_mm=100 / math.pi,
            encoder_counts_per_revolution=100,
            track_width_mm=100,
            left_start_command=0.1,
            right_start_command=0.1,
            left_speed_command_gain=0.001,
            right_speed_command_gain=0.001,
            wheel_speed_kp=0,
            max_drive_command=0.5,
        )
        bot = FakeBot()
        clock = iter((100, 105, 120))
        robot = Robot(
            config,
            bot,
            SensorModel(config),
            WheelSpeedController(config),
            DifferentialDrive(config),
            Odometry(config),
            _sleep_ms=lambda duration: bot.events.append(("sleep", duration)),
            _ticks_ms=lambda: next(clock),
        )
        return robot, bot

    def test_robot_runs_one_measured_control_sample_in_order(self):
        clear_state()
        robot, bot = self.make_robot()
        initial = robot.start(Pose(0, 0, 0))
        state = robot.step(MotionCommand(100, 0), read_range=True)

        self.assertEqual(initial.pose, Pose(0, 0, 0))
        self.assertEqual(bot.events[:3], ["wait", "reset", "read"])
        self.assertEqual(bot.events[4], ("sleep", 15))
        self.assertEqual(bot.events[5], "range")
        self.assertEqual(state.pose, Pose(10, 0, 0))
        self.assertEqual(state.measurements.range_mm, 180)
        self.assertEqual(robot.last_overrun_ms, 0)
        published = state_snapshot()
        self.assertEqual(published["xMm"], 10)
        self.assertGreater(published["leftEffort"], 0)
        self.assertEqual(published["requestedForwardSpeedMmS"], 100)
        self.assertEqual(published["requestedTurnRateRadS"], 0)
        self.assertEqual(published["targetLeftWheelSpeedMmS"], 100)
        self.assertEqual(published["targetRightWheelSpeedMmS"], 100)
        self.assertEqual(published["leftWheelDistanceMm"], 10)
        self.assertEqual(published["rightWheelDistanceMm"], 10)
        robot.stop()
        self.assertEqual(state_snapshot()["leftEffort"], 0)
        self.assertIsNone(state_snapshot()["requestedForwardSpeedMmS"])

    def test_robot_rejects_a_programming_type_error_in_range_samples(self):
        robot, _bot = self.make_robot()

        with self.assertRaisesRegex(
            TypeError,
            "range sample 1 must be a number or None; received str",
        ):
            robot.estimate_range([180.0, "blah", None], 1)

    def test_managed_run_starts_without_waiting_for_user_button(self):
        robot, bot = self.make_robot()

        _set_managed_start(True)
        try:
            robot.start(Pose(0, 0, 0))
        finally:
            _set_managed_start(False)

        self.assertEqual(bot.events[:2], ["reset", "read"])

    def test_virtual_bridge_receives_estimate_request_and_wheel_targets(self):
        class BrowserBridge:
            def __init__(self):
                self.calls = []

            def publish_course_state(self, *values):
                self.calls.append(values)

        bridge = BrowserBridge()
        original_publisher = course_telemetry._publish_browser_state
        course_telemetry._publish_browser_state = bridge.publish_course_state
        try:
            robot, _bot = self.make_robot()
            robot.start(Pose(0, 0, 0))
            robot.step(MotionCommand(100, 0))
        finally:
            course_telemetry._publish_browser_state = original_publisher

        published = bridge.calls[-1]
        self.assertEqual(published[:3], (10, 0, 0))
        self.assertAlmostEqual(published[3], 100.0)
        self.assertAlmostEqual(published[4], 100.0)
        self.assertEqual(published[5:7], (10.0, 10.0))
        self.assertEqual(published[7:], (100, 0, 100.0, 100.0))

    def test_robot_uses_absolute_wrap_safe_sample_deadlines(self):
        config = RobotConfig(sample_period_ms=20, max_drive_command=0.5)
        bot = FakeBot()
        clock = iter((250, 254, 14, 24, 34))

        def ticks_add(value, delta):
            return (value + delta) % 256

        def ticks_diff(later, earlier):
            return ((later - earlier + 128) % 256) - 128

        robot = Robot(
            config,
            bot,
            SensorModel(config),
            WheelSpeedController(config),
            DifferentialDrive(config),
            Odometry(config),
            _sleep_ms=lambda duration: bot.events.append(("sleep", duration)),
            _ticks_add=ticks_add,
            _ticks_diff_fn=ticks_diff,
            _ticks_ms=lambda: next(clock),
        )

        robot.start(Pose(0, 0, 0))
        robot.step(STOP_COMMAND)
        robot.step(STOP_COMMAND)

        sleeps = [event for event in bot.events if isinstance(event, tuple) and event[0] == "sleep"]
        self.assertEqual(sleeps, [("sleep", 16), ("sleep", 10)])
        self.assertEqual(robot.last_overrun_ms, 0)

    def test_delivery_mission_observes_plans_navigates_and_always_stops(self):
        arena = ArenaMap(
            (0, 0, 300, 200),
            features={"gate": (100, 0, 200, 100)},
        )
        task = DeliveryTask(
            initial_pose=Pose(50, 150, 0),
            arena=arena,
            grid_resolution_mm=100,
            clearance_mm=0,
            destination=NavigationGoal(250, 150, 0),
            observed_feature_name="gate",
            range_sample_count=3,
            minimum_usable_range_count=2,
            blocked_range_threshold_mm=100,
            assume_blocked_without_range=True,
        )

        class MissionRobot:
            def __init__(self):
                self.state = RobotState(
                    Measurements(0, 0, 0, 0, 0, 0, 0, 0, None, False),
                    task.initial_pose,
                )
                self.ranges = iter((None, 180, 200))
                self.stopped = False

            def start(self, _pose):
                return self.state

            def step(self, _command, read_range=False):
                value = next(self.ranges) if read_range else None
                self.state = RobotState(
                    Measurements(0, 0, 0, 0, 0, 0, 0, 0, value, False),
                    Pose(250, 150, 0) if not read_range else self.state.pose,
                )
                return self.state

            def estimate_range(self, samples, minimum):
                usable = [value for value in samples if value is not None]
                return sum(usable) / len(usable) if len(usable) >= minimum else None

            def stop(self):
                self.stopped = True

        class OneStepNavigation:
            def __init__(self):
                self.complete = True
                self.goals = ()

            def start(self, goals):
                self.goals = goals
                self.complete = False

            def update(self, _pose):
                self.complete = True
                return STOP_COMMAND

            def is_complete(self):
                return self.complete

        robot = MissionRobot()
        navigation = OneStepNavigation()
        mission = DeliveryMission(task, navigation, GridPlanner())

        self.assertIsNone(mission.range_estimate_mm)
        self.assertIsNone(mission.feature_blocked)
        self.assertIsNone(mission.planned_path)
        self.assertEqual(mission.navigation_step_count, 0)
        self.assertIsNone(mission.maximum_navigation_steps)

        result = mission.run(robot)

        self.assertEqual(mission.result, "delivered")
        self.assertEqual(mission.range_estimate_mm, 190)
        self.assertFalse(mission.feature_blocked)
        self.assertIsNotNone(mission.planned_path)
        self.assertEqual(mission.navigation_step_count, 1)
        self.assertEqual(result.pose, Pose(250, 150, 0))
        self.assertGreaterEqual(len(navigation.goals), 1)
        self.assertTrue(robot.stopped)

    def test_delivery_mission_exposes_and_honors_only_explicit_step_limit(self):
        arena = ArenaMap(
            (0, 0, 300, 200),
            features={"gate": (100, 0, 200, 100)},
        )
        task = DeliveryTask(
            initial_pose=Pose(50, 150, 0),
            arena=arena,
            grid_resolution_mm=100,
            clearance_mm=0,
            destination=NavigationGoal(250, 150, 0),
            observed_feature_name="gate",
            range_sample_count=1,
            minimum_usable_range_count=1,
            blocked_range_threshold_mm=100,
            assume_blocked_without_range=True,
        )

        class Robot:
            def __init__(self):
                self.state = RobotState(
                    Measurements(0, 0, 0, 0, 0, 0, 0, 0, None, False),
                    task.initial_pose,
                )
                self.stopped = False

            def start(self, _pose):
                return self.state

            def step(self, _command, read_range=False):
                self.state = RobotState(
                    Measurements(
                        self.state.measurements.time_ms + 20,
                        0.02,
                        0,
                        0,
                        0,
                        0,
                        0,
                        0,
                        200 if read_range else None,
                        False,
                    ),
                    self.state.pose,
                )
                return self.state

            def estimate_range(self, samples, _minimum):
                return samples[0]

            def stop(self):
                self.stopped = True

        class NeverCompleteNavigation:
            def start(self, _goals):
                pass

            def update(self, _pose):
                return STOP_COMMAND

            def is_complete(self):
                return False

        robot = Robot()
        mission = DeliveryMission(
            task,
            NeverCompleteNavigation(),
            GridPlanner(),
            maximum_navigation_steps=2,
        )

        result = mission.run(robot)

        self.assertEqual(mission.maximum_navigation_steps, 2)
        self.assertEqual(mission.navigation_step_count, 2)
        self.assertEqual(mission.result, "step_limit")
        self.assertIsNotNone(mission.planned_path)
        self.assertEqual(result, robot.state)
        self.assertTrue(robot.stopped)


if __name__ == "__main__":
    unittest.main()
