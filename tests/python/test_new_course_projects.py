"""Independent curriculum contracts and bounded project-policy regressions."""
import ast
import contextlib
import hashlib
import io
import json
import math
import os
from pathlib import Path
import sys
import types
import unittest

ROOT = Path(__file__).resolve().parents[2]
VENDOR = ROOT / "vendor/current"
sys.path[:0] = [str(VENDOR), str(VENDOR / "reference_source")]
from ucsb_xrp import GridCell, GridPath, NavigationConfig, NavigationGoal, OccupancyGrid, Pose, RobotConfig, load_world


@contextlib.contextmanager
def project_module(project, filename):
    directory = VENDOR / project
    names = {p.stem for p in directory.glob("*.py")}
    saved = {name: sys.modules.pop(name) for name in names if name in sys.modules}
    previous_cwd = os.getcwd()
    sys.path.insert(0, str(directory))
    os.chdir(directory)
    try:
        tree = ast.parse((directory / filename).read_text())
        # Import helpers without executing the project entrypoint's motion call.
        if filename == "main.py":
            tree.body = [node for node in tree.body if not (isinstance(node, ast.Expr) and isinstance(node.value, ast.Call))]
        values = {}
        exec(compile(tree, str(directory / filename), "exec"), values)
        yield values
    finally:
        for name in names:
            sys.modules.pop(name, None)
        sys.modules.update(saved)
        sys.path.remove(str(directory))
        os.chdir(previous_cwd)


class NewCourseProjectTests(unittest.TestCase):
    def setUp(self):
        # Device-service tests replace package modules. Bind to the currently
        # active record classes rather than objects imported during discovery.
        import ucsb_xrp
        for name in ("GridCell", "GridPath", "NavigationGoal", "OccupancyGrid", "Pose", "load_world"):
            globals()[name] = getattr(ucsb_xrp, name)

    def test_supplied_drafts_are_byte_identical(self):
        directory = ROOT / "new_draft_curricular"
        expected = json.loads((directory / "supplied_draft_hashes.json").read_text())
        self.assertEqual(set(expected), {"course_summary_9_14.md", "lecture_challenge_new_9_14.csv"})
        for name, digest in expected.items():
            self.assertEqual(hashlib.sha256((directory / name).read_bytes()).hexdigest(), digest, name)

    def test_candidate_inventory_has_five_cumulative_challenges_and_four_demos(self):
        entries = json.loads((VENDOR / "project_catalog.json").read_text())
        candidates = [entry for entry in entries if entry["id"].startswith("new_")]
        self.assertEqual(len(candidates), 9)
        challenges = [entry for entry in candidates if entry["kind"] == "challenge"]
        self.assertEqual(len(challenges), 5)
        component_sets = [set(c["name"] for c in item["components"]) for item in challenges]
        self.assertEqual(component_sets[0], {"SensorModel", "WheelSpeedController"})
        self.assertEqual(component_sets[1], component_sets[0] | {"DifferentialDrive", "LineFollower"})
        self.assertEqual(component_sets[2], component_sets[1] - {"LineFollower"} | {"Odometry", "NavigationController"})
        self.assertEqual(component_sets[3], component_sets[2] | {"GridPlanner"})
        self.assertEqual(component_sets[4], component_sets[3])
        for entry in candidates:
            directory = VENDOR / entry["source"]
            files = [p for p in directory.iterdir() if p.suffix in (".py", ".md", ".json")]
            self.assertLessEqual(len(files), 48)
            self.assertLessEqual(sum(len(p.read_bytes()) for p in files), 128 * 1024)
            for path in files:
                if path.suffix == ".py":
                    compile(path.read_text(), str(path), "exec")
            for component in entry.get("components", []):
                self.assertTrue((directory / component["file"]).exists())

    def test_curling_policy_is_bounded_monotonic_and_latches_stop_on_overshoot(self):
        with project_module("starters/new_challenge_1_robot_curling", "distance_policy.py") as module:
            command = module["distance_command"]
            speeds = [command(distance).forward_speed_mm_s for distance in (-100, 0, 10, 11, 25, 100, 1000)]
            self.assertEqual(speeds[:3], [0, 0, 0])
            self.assertEqual(speeds, sorted(speeds))
            self.assertLessEqual(max(speeds), module["CRUISE_SPEED_MM_S"])
            with self.assertRaises(ValueError):
                command(float("nan"))

    def test_line_finish_requires_ordered_checkpoint_passage(self):
        with project_module("starters/new_challenge_2_arena_line_circuit", "lap_progress.py") as module:
            lap = module["LapProgress"]()
            start = Pose(-555, -300, 0)
            for _ in range(12):
                self.assertFalse(lap.update(start, False, 4))
                self.assertFalse(lap.update(start, True, 4))
            self.assertEqual(lap.checkpoints_reached, 0)
            # Reverse checkpoint order cannot qualify a complete lap.
            for x, y in reversed(module["CHECKPOINTS_MM"]):
                lap.update(Pose(x, y, 0), False, 4)
            self.assertLess(lap.checkpoints_reached, 4)
            lap = module["LapProgress"]()
            for x, y in module["CHECKPOINTS_MM"]:
                self.assertFalse(lap.update(Pose(x, y, 0), False, 4))
            self.assertEqual([lap.update(start, True, 4) for _ in range(4)], [False, False, False, True])

    def test_line_checks_do_not_report_reference_pass_for_unimplemented_student(self):
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            with project_module("starters/new_challenge_2_arena_line_circuit", "component_checks.py") as module:
                module["check_line_follower"]()
        self.assertIn("NOT IMPLEMENTED · LineFollower", output.getvalue())
        self.assertNotIn("PASS · LineFollower", output.getvalue())

    def test_reflectance_contrast_requires_usable_separate_calibration(self):
        with project_module("templates/new_demo_reflectance_calibration", "calibration.py") as module:
            contrast = module["contrast"]
            self.assertAlmostEqual(contrast(0.45, 0.2, 0.7), 0.5)
            self.assertEqual(contrast(1.0, 0.2, 0.7), 1.0)
            self.assertEqual(contrast(0.0, 0.2, 0.7), 0.0)
            for light, dark in ((0.5, 0.51), (0.8, 0.1), (float("nan"), 1)):
                with self.assertRaises(ValueError):
                    contrast(0.5, light, dark)

    def test_heapq_astar_matches_known_costs_and_handles_priority_ties(self):
        with project_module("templates/new_demo_planning_comparison", "search.py") as module:
            for blocked, expected_edges in (([False] * 25, 8), ([False] * 10 + [True] * 5 + [False] * 10, None)):
                grid = OccupancyGrid(100, 0, 0, 5, 5, blocked)
                for algorithm in (module["bfs"], module["astar"]):
                    path, expanded = algorithm(grid, GridCell(0, 0), GridCell(4, 4))
                    self.assertEqual(None if path is None else len(path.cells) - 1, expected_edges)
                    self.assertGreater(expanded, 0)
                    if path:
                        self.assertTrue(all(b in grid.neighbors(a) for a, b in zip(path.cells, path.cells[1:])))
                    same, _ = algorithm(grid, GridCell(0, 0), GridCell(0, 0))
                    self.assertEqual(same.cells, (GridCell(0, 0),))
                    self.assertIsNone(algorithm(grid, None, GridCell(4, 4))[0])
                    self.assertIsNone(algorithm(grid, GridCell(-1, 0), GridCell(4, 4))[0])
            large = OccupancyGrid(10, 0, 0, 33, 33, [False] * 1089)
            with self.assertRaises(ValueError):
                module["astar"](large, GridCell(0, 0), GridCell(1, 1))

    def test_mission_missing_observation_is_not_classified_as_open(self):
        with project_module("starters/new_challenge_5_out_and_back", "mission_policy.py") as module:
            classify = module["observed_gate"]
            self.assertIsNone(classify(None, 550))
            self.assertTrue(classify(380, 550))
            self.assertFalse(classify(1880, 550))

    def test_return_worlds_share_observation_geometry_and_valid_far_reflector(self):
        filename = VENDOR / "starters/new_challenge_5_out_and_back/world.json"
        worlds = json.loads(filename.read_text())["worlds"]
        blocked, opened = worlds
        self.assertEqual(blocked["initial_pose"], opened["initial_pose"])
        self.assertEqual(blocked["markers"], opened["markers"])
        self.assertEqual([o for o in blocked["obstacles"] if not o.get("feature")], opened["obstacles"])
        self.assertTrue(any(o.get("label") == "Known far reflector behind home" for o in opened["obstacles"]))
        for case in worlds:
            world = load_world(str(filename), case["id"])
            grid = OccupancyGrid.from_arena(world.arena_map(), 100, 95)
            for name in ("home", "outbound_1", "outbound_2", "observation"):
                goal = world.waypoint(name)
                self.assertFalse(grid.is_blocked(grid.world_to_cell(goal.x_mm, goal.y_mm)))

    def test_mission_detects_premature_navigation_completion_and_invalid_paths(self):
        with project_module("starters/new_challenge_5_out_and_back", "mission_steps.py") as module:
            class Navigation:
                config = types.SimpleNamespace(position_tolerance_mm=10, heading_tolerance_rad=0.08)
                def start(self, goals):
                    pass
                def is_complete(self):
                    return True
            state = types.SimpleNamespace(pose=Pose(0, 0, 0), measurements=types.SimpleNamespace(time_ms=0))
            _, result = module["follow_route"](None, Navigation(), state, [NavigationGoal(200, 0)], 5)
            self.assertEqual(result, "failed_arrival")
            grid = OccupancyGrid(100, 0, 0, 3, 1, [False, True, False])
            self.assertFalse(module["valid_path"](grid, GridCell(0, 0), GridCell(2, 0), GridPath([GridCell(0, 0), GridCell(1, 0), GridCell(2, 0)])))
        from ucsb_xrp.live import clear
        clear()


if __name__ == "__main__":
    unittest.main()
