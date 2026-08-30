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
    def test_challenge_3_rejects_completion_without_ordered_arrivals(self):
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
        with self.assertRaisesRegex(RuntimeError, "ordered route"), contextlib.redirect_stdout(
            output
        ):
            main["run_challenge"]()

        self.assertIn("Challenge 3 result: route_incomplete", output.getvalue())
        self.assertEqual(robot.step_count, 0)
        self.assertTrue(robot.stopped)

    def test_challenge_3_step_limit_is_visible_and_precedes_motion(self):
        main = load_main_definitions(3)
        robot = FakeRobot(main["INITIAL_POSE"])

        class NeverCompleteNavigation:
            def start(self, _goals):
                pass

            def is_complete(self):
                return False

            def update(self, _pose):
                raise AssertionError("the zero-step fixture must stop before motion")

        main["MAXIMUM_NAVIGATION_STEPS"] = 0
        main["make_robot"] = lambda _config: robot
        main["make_navigation_controller"] = (
            lambda _config: NeverCompleteNavigation()
        )
        output = io.StringIO()
        with self.assertRaisesRegex(RuntimeError, "visible step limit"), contextlib.redirect_stdout(
            output
        ):
            main["run_challenge"]()

        self.assertIn("Challenge 3 result: step_limit", output.getvalue())
        self.assertEqual(robot.step_count, 0)
        self.assertTrue(robot.stopped)

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
        self.assertIn("Challenge 4 result: invalid_path", output.getvalue())

    def test_challenge_5_passes_visible_limit_and_rejects_false_delivery(self):
        main = load_main_definitions(5)
        captured = {}

        class FalseDeliveryMission:
            def __init__(
                self,
                _task,
                _navigation,
                _planner,
                maximum_navigation_steps=None,
            ):
                captured["limit"] = maximum_navigation_steps
                self.maximum_navigation_steps = maximum_navigation_steps
                self.range_estimate_mm = 740.0
                self.feature_blocked = False
                self.planned_path = None
                self.navigation_step_count = 0
                self.result = "delivered"

            def run(self, _robot):
                return types.SimpleNamespace(pose=main["DELIVERY_TASK"].initial_pose)

        main["DeliveryMission"] = FalseDeliveryMission
        main["make_navigation_controller"] = lambda _config: object()
        main["make_grid_planner"] = lambda: object()
        main["make_robot"] = lambda _config: object()
        output = io.StringIO()
        with self.assertRaisesRegex(
            RuntimeError, "without destination evidence"
        ), contextlib.redirect_stdout(output):
            main["run_challenge"]()

        self.assertEqual(captured["limit"], main["MAXIMUM_NAVIGATION_STEPS"])
        self.assertIn("map_decision: center_gate=open", output.getvalue())
        self.assertIn("Challenge 5 result: delivery_incomplete", output.getvalue())
        self.assertNotIn("Challenge 5 result: delivered", output.getvalue())

    def test_goal_evidence_uses_arbitrary_coordinates_and_heading(self):
        main = load_main_definitions(3)
        goal = NavigationGoal(-173.0, 281.0, -2.4)
        self.assertTrue(main["goal_is_reached"](Pose(-178.0, 285.0, -2.36), goal))
        self.assertFalse(main["goal_is_reached"](Pose(-190.0, 281.0, -2.4), goal))
        self.assertFalse(main["goal_is_reached"](Pose(-173.0, 281.0, -2.2), goal))


if __name__ == "__main__":
    unittest.main()
