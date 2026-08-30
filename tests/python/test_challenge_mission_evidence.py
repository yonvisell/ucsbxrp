import contextlib
import io
import os
import pathlib
import sys
import types
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]
VENDOR = ROOT / "vendor" / "current"
REFERENCE_SOURCE = VENDOR / "reference_source"
STARTERS = VENDOR / "starters"

sys.path.insert(0, str(VENDOR))
sys.path.insert(0, str(REFERENCE_SOURCE))

from ucsb_xrp import (  # noqa: E402
    GridCell,
    GridPath,
    NavigationGoal,
    OccupancyGrid,
    Pose,
)


def load_main_definitions(challenge_number):
    """Load one starter main.py without executing its final run_challenge()."""
    directory = STARTERS / ("challenge_%d" % challenge_number)
    source = (directory / "main.py").read_text(encoding="utf-8")
    source, final_call = source.rsplit("\nrun_challenge()", 1)
    if final_call.strip():
        raise AssertionError("run_challenge() must remain the final statement")

    module_names = (
        "challenge",
        "course_setup",
        "robot_config",
        "sensor_model",
        "wheel_speed_controller",
        "differential_drive",
        "odometry",
        "navigation_controller",
        "grid_planner",
        "range_safety_controller",
        "pose_corrector",
        "visit_order_planner",
    )
    saved_modules = {name: sys.modules.get(name) for name in module_names}
    previous_directory = os.getcwd()
    sys.path.insert(0, str(directory))
    try:
        for name in module_names:
            sys.modules.pop(name, None)
        os.chdir(directory)
        namespace = {"__name__": "challenge_main_test"}
        exec(compile(source, str(directory / "main.py"), "exec"), namespace)
        return namespace
    finally:
        os.chdir(previous_directory)
        sys.path.remove(str(directory))
        for name in module_names:
            sys.modules.pop(name, None)
            if saved_modules[name] is not None:
                sys.modules[name] = saved_modules[name]


class FakeRobot:
    def __init__(self, initial_pose):
        self.initial_pose = initial_pose
        self.step_count = 0
        self.stopped = False

    def start(self, _initial_pose):
        return types.SimpleNamespace(pose=self.initial_pose)

    def step(self, _command):
        self.step_count += 1
        return types.SimpleNamespace(pose=self.initial_pose)

    def stop(self):
        self.stopped = True


class ChallengeMissionEvidenceTests(unittest.TestCase):
    def test_challenge_3_rejects_completion_without_ordered_goal_evidence(self):
        main = load_main_definitions(3)
        robot = FakeRobot(main["INITIAL_POSE"])

        class PrematureNavigation:
            def start(self, _goals):
                pass

            def is_complete(self):
                return True

            def update(self, _pose):
                raise AssertionError("a completed navigator must not be stepped")

        main["make_robot"] = lambda _config: robot
        main["make_navigation_controller"] = lambda _config: PrematureNavigation()
        output = io.StringIO()
        with self.assertRaisesRegex(
            RuntimeError, "every waypoint"
        ), contextlib.redirect_stdout(output):
            main["run_challenge"]()

        self.assertIn("Challenge 3: result=route_incomplete", output.getvalue())
        self.assertEqual(robot.step_count, 0)
        self.assertTrue(robot.stopped)

    def test_challenges_three_to_eight_have_no_arbitrary_mission_step_cap(self):
        for number in range(3, 9):
            directory = STARTERS / ("challenge_%d" % number)
            source = (directory / "challenge.py").read_text(encoding="utf-8")
            source += (directory / "main.py").read_text(encoding="utf-8")
            self.assertNotIn("MAXIMUM_NAVIGATION_STEPS", source)
            self.assertNotIn("MAXIMUM_APPROACH_STEPS", source)
            self.assertNotIn("MAXIMUM_SETTLE_STEPS", source)
            self.assertNotIn("MAXIMUM_TURN_STEPS", source)

    def test_challenge_4_rejects_a_connected_path_through_a_blocked_cell(self):
        main = load_main_definitions(4)
        grid = OccupancyGrid(
            80.0,
            -240.0,
            -160.0,
            5,
            4,
            (
                False,
                False,
                False,
                False,
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
                False,
                False,
                False,
                False,
                False,
                False,
            ),
        )
        path = GridPath(
            (
                GridCell(0, 1),
                GridCell(1, 1),
                GridCell(2, 1),
                GridCell(3, 1),
                GridCell(4, 1),
            )
        )

        self.assertEqual(
            main["path_error"](grid, GridCell(0, 1), GridCell(4, 1), path),
            "path contains a blocked or out-of-grid cell",
        )

    def test_challenge_4_does_not_construct_robot_for_invalid_planner_path(self):
        main = load_main_definitions(4)

        class BlockedCellPlanner:
            def plan(self, grid, start, goal):
                blocked = next(
                    GridCell(column, row)
                    for row in range(grid.row_count)
                    for column in range(grid.column_count)
                    if grid.is_blocked(GridCell(column, row))
                )
                cells = [start]
                current = start
                for target in (blocked, goal):
                    while current.column != target.column:
                        direction = 1 if target.column > current.column else -1
                        current = GridCell(current.column + direction, current.row)
                        cells.append(current)
                    while current.row != target.row:
                        direction = 1 if target.row > current.row else -1
                        current = GridCell(current.column, current.row + direction)
                        cells.append(current)
                return GridPath(tuple(cells))

        main["make_grid_planner"] = lambda: BlockedCellPlanner()
        main["make_robot"] = lambda _config: self.fail(
            "invalid path must be rejected before constructing a robot"
        )
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            result = main["run_challenge"]()

        self.assertIsNone(result)
        self.assertIn("Challenge 4: result=invalid_path", output.getvalue())

    def test_challenge_5_uses_delivery_mission_result_without_a_step_limit(self):
        main = load_main_definitions(5)
        captured = {}

        class FalseDeliveryMission:
            def __init__(self, _task, _navigation, _planner):
                captured["argument_count"] = 3
                self.range_estimate_mm = 740.0
                self.feature_blocked = False
                self.planned_path = None
                self.navigation_step_count = 0
                self.result = "destination_not_reached"

            def run(self, _robot):
                return types.SimpleNamespace(pose=main["DELIVERY_TASK"].initial_pose)

        main["DeliveryMission"] = FalseDeliveryMission
        main["make_navigation_controller"] = lambda _config: object()
        main["make_grid_planner"] = lambda: object()
        main["make_robot"] = lambda _config: object()
        output = io.StringIO()
        with self.assertRaisesRegex(
            RuntimeError, "valid destination evidence"
        ), contextlib.redirect_stdout(output):
            main["run_challenge"]()

        self.assertEqual(captured["argument_count"], 3)
        self.assertIn("Challenge 5: result=destination_not_reached", output.getvalue())
        self.assertNotIn("result=delivered", output.getvalue())

    def test_challenge_6_distinguishes_early_stop_and_unavailable_range(self):
        main = load_main_definitions(6)
        with self.assertRaisesRegex(RuntimeError, "range is unavailable"):
            main["valid_student_speed"](1.0, 120.0, 180.0, None)

        class ZeroController:
            def update(self, _requested, _measured, _range_mm):
                return 0.0

        class RangeRobot:
            def __init__(self, range_mm):
                self.range_mm = range_mm
                self.commands = []
                self.stopped = False
                self.state = types.SimpleNamespace(
                    pose=main["INITIAL_POSE"],
                    measurements=types.SimpleNamespace(
                        left_speed_mm_s=0.0,
                        right_speed_mm_s=0.0,
                        range_mm=range_mm,
                    ),
                )

            def start(self, _pose):
                return self.state

            def step(self, command, read_range=False):
                self.commands.append((command, read_range))
                return self.state

            def estimate_range(self, samples, minimum):
                usable = [value for value in samples if value is not None]
                return usable[-1] if len(usable) >= minimum else None

            def stop(self):
                self.stopped = True

        main["make_range_safety_controller"] = lambda *_settings: ZeroController()
        cases = (
            (220.0, "complete"),
            (380.0, "complete"),
            (700.0, "early_stop"),
            (None, "range_unavailable"),
        )
        for range_mm, expected in cases:
            with self.subTest(expected=expected):
                robot = RangeRobot(range_mm)
                main["make_robot"] = lambda _config, robot=robot: robot
                output = io.StringIO()
                with contextlib.redirect_stdout(output):
                    main["run_challenge"]()
                self.assertIn("result=" + expected, output.getvalue())
                self.assertTrue(
                    all(
                        command == main["STOP_COMMAND"]
                        for command, _ in robot.commands
                    )
                )
                self.assertTrue(robot.stopped)

    def test_challenge_7_rejects_premature_corrected_navigation_completion(self):
        main = load_main_definitions(7)

        class Robot:
            def __init__(self):
                self.state = types.SimpleNamespace(
                    pose=main["ODOMETRY_INITIAL_POSE"],
                    measurements=types.SimpleNamespace(
                        left_speed_mm_s=0.0,
                        right_speed_mm_s=0.0,
                    ),
                )
                self.stopped = False

            def start(self, _pose):
                return self.state

            def stop(self):
                self.stopped = True

        class NoCorrection:
            def reset(self, pose):
                return pose

            def observe_x(self, pose, *_observation):
                return pose

            def observe_y(self, pose, *_observation):
                return pose

            def corrected_pose(self, pose):
                return pose

        class PrematureNavigation:
            def start(self, _goals):
                pass

            def is_complete(self):
                return True

            def update(self, _pose):
                raise AssertionError("a completed navigator must not be stepped")

        robot = Robot()
        main["make_robot"] = lambda _config: robot
        main["make_pose_corrector"] = lambda _offset: NoCorrection()
        main["make_navigation_controller"] = lambda _config: PrematureNavigation()
        main["turn_to_heading"] = lambda _robot, state, _heading: state
        main["settle"] = lambda _robot, state: state
        main["collect_stationary_range"] = (
            lambda _robot, state, _heading: (state, 300.0)
        )
        output = io.StringIO()
        with self.assertRaisesRegex(
            RuntimeError, "Corrected navigation"
        ), contextlib.redirect_stdout(output):
            main["run_challenge"]()

        self.assertIn("Challenge 7: result=destination_not_reached", output.getvalue())
        self.assertTrue(robot.stopped)

    def test_challenge_8_does_not_record_a_false_endpoint_arrival(self):
        main = load_main_definitions(8)

        class Path:
            cells = (object(), object())

            def to_goals(self, _grid):
                return [NavigationGoal(0.0, 0.0)]

        order = (0, 1, 2, 3, 0)
        paths = {
            pair: Path()
            for pair in zip(order, order[1:])
        }
        main["build_pairwise_paths"] = lambda _grid: (
            tuple(tuple(0 for _ in range(4)) for _ in range(4)),
            paths,
        )

        class Planner:
            def plan(self, *_arguments):
                return order

        class PrematureNavigation:
            def start(self, _goals):
                pass

            def is_complete(self):
                return True

            def update(self, _pose):
                raise AssertionError("a completed navigator must not be stepped")

        robot = FakeRobot(main["INITIAL_POSE"])
        main["make_visit_order_planner"] = lambda: Planner()
        main["make_navigation_controller"] = lambda _config: PrematureNavigation()
        main["make_robot"] = lambda _config: robot
        output = io.StringIO()
        with self.assertRaisesRegex(
            RuntimeError, "route endpoint"
        ), contextlib.redirect_stdout(output):
            main["run_challenge"]()

        self.assertIn("result=endpoint_not_reached endpoint=stop_a", output.getvalue())
        self.assertTrue(robot.stopped)

    def test_goal_evidence_uses_arbitrary_coordinates_and_heading(self):
        main = load_main_definitions(3)
        goal = NavigationGoal(-173.0, 281.0, -2.4)
        self.assertTrue(main["goal_is_reached"](Pose(-178.0, 285.0, -2.36), goal))
        self.assertFalse(main["goal_is_reached"](Pose(-190.0, 281.0, -2.4), goal))
        self.assertFalse(main["goal_is_reached"](Pose(-173.0, 281.0, -2.2), goal))

    def test_challenge_3_goal_evidence_advances_only_in_order(self):
        main = load_main_definitions(3)
        route = (
            NavigationGoal(100.0, 0.0),
            NavigationGoal(200.0, 0.0),
            NavigationGoal(300.0, 0.0),
        )
        self.assertEqual(
            main["count_reached_goals"](Pose(300.0, 0.0, 0.0), route, 0),
            0,
        )
        reached = main["count_reached_goals"](
            Pose(100.0, 0.0, 0.0), route, 0
        )
        self.assertEqual(reached, 1)
        self.assertEqual(
            main["count_reached_goals"](Pose(200.0, 0.0, 0.0), route, reached),
            2,
        )


if __name__ == "__main__":
    unittest.main()
