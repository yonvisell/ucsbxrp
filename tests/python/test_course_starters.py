import ast
import contextlib
import io
import json
import os
import pathlib
import runpy
import sys
import tempfile
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[2]
STARTERS = ROOT / "vendor" / "current" / "starters"
TEMPLATES = ROOT / "vendor" / "current" / "templates"


class CourseStarterTests(unittest.TestCase):
    def test_demo_and_tutorial_templates_are_complete_compilable_projects(self):
        directories = sorted(path for path in TEMPLATES.iterdir() if path.is_dir())
        self.assertEqual(
            [path.name for path in directories],
            ["demo_obstacle_turn", "demo_spiral", "micropython_tutorial"],
        )
        for directory in directories:
            self.assertTrue((directory / "README.md").is_file())
            python_files = sorted(directory.glob("*.py"))
            self.assertGreaterEqual(len(python_files), 3)
            for path in python_files:
                with self.subTest(template=directory.name, file=path.name):
                    compile(path.read_text(encoding="utf-8"), str(path), "exec")

        lessons = sorted((TEMPLATES / "micropython_tutorial").glob("[1-7]_*.py"))
        self.assertEqual([path.name[0] for path in lessons], list("1234567"))

    def test_tutorial_is_progressive_and_student_facing(self):
        tutorial = TEMPLATES / "micropython_tutorial"
        readme = (tutorial / "README.md").read_text(encoding="utf-8")
        for section in (
            "## Run a lesson",
            "## Lesson sequence",
            "## Python essentials used here",
            "## Suggested exercises",
            "## Debugging method",
            "## MicroPython and standard Python",
        ):
            self.assertIn(section, readme)
        for lesson_number in range(1, 8):
            self.assertIn("`{}_".format(lesson_number), readme)
        self.assertIn(
            "Open the **File** menu and select **Make main**",
            readme,
        )

        for lesson_number in range(3, 8):
            source = next(tutorial.glob("{}_*.py".format(lesson_number))).read_text(
                encoding="utf-8"
            )
            with self.subTest(lesson=lesson_number):
                self.assertIn("XRPBot", source)
                self.assertIn("finally:", source)
                self.assertIn("bot.stop()", source)
                self.assertNotIn("while True", source)

        helper = (tutorial / "tutorial_helpers.py").read_text(encoding="utf-8")
        self.assertIn("elapsed_ms < time_limit_ms", helper)
        self.assertIn("finally:", helper)
        self.assertNotIn("while True", helper)

        world = json.loads((tutorial / "world.json").read_text(encoding="utf-8"))
        self.assertEqual(world["default_world"], "tutorial-field")
        tutorial_world = world["worlds"][0]
        self.assertEqual(tutorial_world["obstacles"][0]["label"], "Range target")
        self.assertEqual(tutorial_world["initial_pose"]["heading_rad"], 0)

    def test_first_two_tutorial_lessons_execute_with_expected_results(self):
        tutorial = TEMPLATES / "micropython_tutorial"
        expected_lines = {
            "1_values_and_functions.py": "Lesson 1 complete: 150.0 mm/s",
            "2_collections_and_loops.py": (
                "Lesson 2 complete: 3 segments, 600.0 mm"
            ),
        }
        for filename, expected in expected_lines.items():
            output = io.StringIO()
            with self.subTest(file=filename), contextlib.redirect_stdout(output):
                runpy.run_path(str(tutorial / filename), run_name="__main__")
            self.assertIn(expected, output.getvalue())

    def test_all_five_starters_are_complete_compilable_projects(self):
        directories = sorted(path for path in STARTERS.iterdir() if path.is_dir())
        self.assertEqual(
            [path.name for path in directories],
            ["challenge_1", "challenge_2", "challenge_3", "challenge_4", "challenge_5"],
        )
        component_files = (
            "sensor_model.py",
            "wheel_speed_controller.py",
            "differential_drive.py",
            "odometry.py",
            "navigation_controller.py",
            "grid_planner.py",
        )
        for directory in directories:
            paths = {path.name: path for path in directory.glob("*.py")}
            challenge_number = int(directory.name.rsplit("_", 1)[1])
            component_count = (2, 4, 5, 6, 6)[challenge_number - 1]
            required = {
                "challenge.py",
                "component_checks.py",
                "course_setup.py",
                "main.py",
                "robot_config.py",
                *component_files[:component_count],
            }
            self.assertEqual(set(paths), required, directory.name)
            for name, path in paths.items():
                with self.subTest(challenge=directory.name, file=name):
                    compile(path.read_text(encoding="utf-8"), str(path), "exec")

    def test_each_starter_has_one_switch_per_component_introduced_so_far(self):
        expected_switches = {
            "challenge_1": 2,
            "challenge_2": 4,
            "challenge_3": 5,
            "challenge_4": 6,
            "challenge_5": 6,
        }
        for challenge, expected_count in expected_switches.items():
            source = (STARTERS / challenge / "course_setup.py").read_text(
                encoding="utf-8"
            )
            switches = {
                node.targets[0].id
                for node in ast.walk(ast.parse(source))
                if isinstance(node, ast.Assign)
                and len(node.targets) == 1
                and isinstance(node.targets[0], ast.Name)
                and node.targets[0].id.startswith("USE_STUDENT_")
            }
            self.assertEqual(len(switches), expected_count, challenge)

    def test_component_check_files_expose_one_clear_call_not_check_machinery(self):
        expected_components = {
            "challenge_1": 2,
            "challenge_2": 4,
            "challenge_3": 5,
            "challenge_4": 6,
            "challenge_5": 7,
        }
        project_module_names = (
            "sensor_model",
            "wheel_speed_controller",
            "differential_drive",
            "odometry",
            "navigation_controller",
            "grid_planner",
        )
        for challenge, component_count in expected_components.items():
            directory = STARTERS / challenge
            path = directory / "component_checks.py"
            source = path.read_text(encoding="utf-8")
            with self.subTest(challenge=challenge):
                self.assertLessEqual(len(source.splitlines()), 40)
                self.assertIn("concrete, hardware-free examples", source)
                self.assertIn("PASS means", source)
                self.assertIn("run_component_checks(", source)
                self.assertNotIn("def check_", source)
                self.assertNotIn("RawSensors", source)

                calls = [
                    node
                    for node in ast.walk(ast.parse(source))
                    if isinstance(node, ast.Call)
                    and isinstance(node.func, ast.Name)
                    and node.func.id == "run_component_checks"
                ]
                self.assertEqual(len(calls), 1)
                expected_classes = component_count - (1 if challenge == "challenge_5" else 0)
                self.assertEqual(len(calls[0].args), expected_classes)
                self.assertEqual(
                    {item.arg for item in calls[0].keywords},
                    {"include_range"} if challenge == "challenge_5" else set(),
                )

                saved_modules = {
                    name: sys.modules.pop(name)
                    for name in project_module_names
                    if name in sys.modules
                }
                output = io.StringIO()
                course_source = str(ROOT / "vendor" / "current")
                sys.path.insert(0, course_source)
                sys.path.insert(0, str(directory))
                try:
                    with self.assertRaisesRegex(
                        AssertionError,
                        "no component checks passed",
                    ), contextlib.redirect_stdout(output):
                        runpy.run_path(str(path), run_name="__main__")
                finally:
                    sys.path.remove(str(directory))
                    sys.path.remove(course_source)
                    for name in project_module_names:
                        sys.modules.pop(name, None)
                    sys.modules.update(saved_modules)

                text = output.getvalue()
                self.assertIn(
                    "Concrete component examples use MicroPython without starting either robot.",
                    text,
                )
                self.assertIn(
                    "0 passed · {} not implemented · 0 failed".format(
                        component_count
                    ),
                    text,
                )
                self.assertEqual(text.count("EXAMPLE · "), component_count)
                self.assertIn("input", source.lower())
                self.assertIn("Complete SensorModel.reset", text)
                self.assertNotIn("PENDING", text)

    def test_supplied_components_pass_every_concrete_component_example(self):
        course_source = str(ROOT / "vendor" / "current")
        reference_source = str(ROOT / "vendor" / "current" / "reference_source")
        sys.path.insert(0, reference_source)
        sys.path.insert(0, course_source)
        try:
            from ucsb_xrp.component_checks import run_component_checks
            from ucsb_xrp_reference import (
                DifferentialDrive,
                GridPlanner,
                NavigationController,
                Odometry,
                SensorModel,
                WheelSpeedController,
            )

            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                run_component_checks(
                    SensorModel,
                    WheelSpeedController,
                    DifferentialDrive,
                    Odometry,
                    NavigationController,
                    GridPlanner,
                    include_range=True,
                )
            self.assertIn(
                "7 passed · 0 not implemented · 0 failed",
                output.getvalue(),
            )
        finally:
            sys.path.remove(course_source)
            sys.path.remove(reference_source)
            for name in tuple(sys.modules):
                if name == "ucsb_xrp_reference" or name.startswith(
                    "ucsb_xrp_reference."
                ):
                    sys.modules.pop(name, None)

    def test_grid_planner_check_accepts_a_valid_nonminimum_route(self):
        course_source = str(ROOT / "vendor" / "current")
        sys.path.insert(0, course_source)
        try:
            from ucsb_xrp import GridCell, GridPath, OccupancyGrid
            from ucsb_xrp.component_checks import run_component_checks

            class DepthFirstGridPlanner:
                def plan(self, grid, start, goal):
                    if start is None or goal is None:
                        return None
                    if grid.is_blocked(start) or grid.is_blocked(goal):
                        return None

                    pending = [(start, (start,))]
                    visited = set()
                    while pending:
                        current, route = pending.pop()
                        if current in visited:
                            continue
                        visited.add(current)
                        if current == goal:
                            return GridPath(route)
                        for adjacent in grid.neighbors(current):
                            if adjacent not in visited:
                                pending.append((adjacent, route + (adjacent,)))
                    return None

            open_grid = OccupancyGrid(
                100.0,
                0.0,
                0.0,
                3,
                2,
                (False, False, False, False, False, False),
            )
            nonminimum = DepthFirstGridPlanner().plan(
                open_grid,
                GridCell(0, 0),
                GridCell(2, 0),
            )
            self.assertEqual(len(nonminimum.cells), 5)

            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                run_component_checks(grid_planner=DepthFirstGridPlanner)

            self.assertIn(
                "PASS · GridPlanner · connected route through free cells",
                output.getvalue(),
            )
            self.assertIn(
                "1 passed · 0 not implemented · 0 failed",
                output.getvalue(),
            )
        finally:
            sys.path.remove(course_source)

    def test_partial_component_progress_reports_without_failing(self):
        course_source = str(ROOT / "vendor" / "current")
        reference_source = str(ROOT / "vendor" / "current" / "reference_source")
        sys.path.insert(0, reference_source)
        sys.path.insert(0, course_source)
        try:
            from ucsb_xrp.component_checks import run_component_checks
            from ucsb_xrp_reference import SensorModel

            class UnfinishedWheelSpeedController:
                def __init__(self, config):
                    self.config = config

                def reset(self):
                    pass

                def update(self, target, measured):
                    raise NotImplementedError

            UnfinishedWheelSpeedController.__name__ = "WheelSpeedController"
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                run_component_checks(
                    SensorModel,
                    UnfinishedWheelSpeedController,
                )
            self.assertIn(
                "1 passed · 1 not implemented · 0 failed",
                output.getvalue(),
            )
        finally:
            sys.path.remove(course_source)
            sys.path.remove(reference_source)
            for name in tuple(sys.modules):
                if name == "ucsb_xrp_reference" or name.startswith(
                    "ucsb_xrp_reference."
                ):
                    sys.modules.pop(name, None)

    def test_each_challenge_readme_defines_student_and_supplied_responsibilities(self):
        expected_student_files = {
            "challenge_1": ("sensor_model.py", "wheel_speed_controller.py"),
            "challenge_2": (
                "sensor_model.py",
                "wheel_speed_controller.py",
                "differential_drive.py",
                "odometry.py",
            ),
            "challenge_3": (
                "sensor_model.py",
                "wheel_speed_controller.py",
                "differential_drive.py",
                "odometry.py",
                "navigation_controller.py",
            ),
            "challenge_4": (
                "sensor_model.py",
                "wheel_speed_controller.py",
                "differential_drive.py",
                "odometry.py",
                "navigation_controller.py",
                "grid_planner.py",
            ),
            "challenge_5": (
                "sensor_model.py",
                "wheel_speed_controller.py",
                "differential_drive.py",
                "odometry.py",
                "navigation_controller.py",
                "grid_planner.py",
            ),
        }
        expected_task_parameters = {
            "challenge_1": ("TRAVEL_DISTANCE_MM", "TARGET_TIME_S"),
            "challenge_2": (
                "OUTBOUND_DISTANCE_MM",
                "TURN_HEADING_RAD",
                "RETURN_DISTANCE_MM",
            ),
            "challenge_3": ("ROUTE",),
            "challenge_4": (
                "ARENA_MAP",
                "INITIAL_POSE",
                "DESTINATION",
                "GRID_RESOLUTION_MM",
                "CLEARANCE_MM",
            ),
            "challenge_5": ("DELIVERY_TASK",),
        }
        expected_configuration_names = {
            "challenge_1": (
                "wheel_diameter_mm",
                "encoder_counts_per_revolution",
                "left_encoder_sign",
                "right_encoder_sign",
                "left_start_command",
                "right_start_command",
                "left_speed_command_gain",
                "right_speed_command_gain",
                "sample_period_ms",
                "wheel_speed_filter_time_constant_ms",
                "wheel_speed_kp",
                "max_drive_command",
            ),
            "challenge_2": (
                "track_width_mm",
                "cruise_speed_mm_s",
                "approach_speed_mm_s",
                "slowdown_distance_mm",
                "position_tolerance_mm",
                "turn_rate_rad_s",
                "heading_tolerance_rad",
            ),
            "challenge_3": (
                "cruise_speed_mm_s",
                "approach_speed_mm_s",
                "slowdown_distance_mm",
                "turn_rate_rad_s",
                "position_tolerance_mm",
                "heading_tolerance_rad",
                "realign_heading_rad",
            ),
            "challenge_4": (
                "GRID_RESOLUTION_MM",
                "CLEARANCE_MM",
            ),
            "challenge_5": (
                "grid_resolution_mm",
                "clearance_mm",
                "observed_feature_name",
                "range_sample_count",
                "minimum_usable_range_count",
                "blocked_range_threshold_mm",
                "assume_blocked_without_range",
            ),
        }
        required_sections = (
            "## What you implement",
            "## Provided files and tools",
            "## How the program runs",
            "## Complete the challenge",
        )

        for challenge, student_files in expected_student_files.items():
            text = (STARTERS / challenge / "README.md").read_text(encoding="utf-8")
            with self.subTest(challenge=challenge):
                for section in required_sections:
                    self.assertIn(section, text)
                self.assertNotIn("## Objective", text)
                self.assertNotIn("## Program flow", text)
                self.assertTrue(
                    "Your work" in text or "Your new work" in text,
                    "README must distinguish current student work from supplied or carried-forward code",
                )
                self.assertIn("component_checks.py", text)
                self.assertIn("course_setup.py", text)
                for filename in student_files:
                    self.assertIn("`%s`" % filename, text)
                for parameter in expected_task_parameters[challenge]:
                    self.assertIn("`%s`" % parameter, text)
                for name in expected_configuration_names[challenge]:
                    self.assertIn(name, text)

    def test_student_facing_challenge_text_uses_direct_task_language(self):
        unclear_terms = (
            "bounded course run procedure",
            "bounded motor check",
            "contract",
            "frontier",
            "inverse kinematics",
            "pending",
            "predecessor",
            "recovery copy",
            "recovery-copy",
            "safety tier",
            "task instance",
        )
        for directory in sorted(path for path in STARTERS.iterdir() if path.is_dir()):
            student_text = "\n".join(
                path.read_text(encoding="utf-8")
                for path in directory.iterdir()
                if path.suffix in (".md", ".py")
            ).lower()
            for term in unclear_terms:
                with self.subTest(challenge=directory.name, term=term):
                    self.assertNotIn(term, student_text)

    def test_challenge_progression_text_matches_the_catalog(self):
        catalog = json.loads(
            (ROOT / "vendor/current/project_catalog.json").read_text(
                encoding="utf-8"
            )
        )
        challenges = {
            entry["id"]: entry
            for entry in catalog
            if entry["kind"] == "challenge" and entry["published"]
        }
        for challenge_number in range(2, 6):
            challenge_id = "challenge_%d" % challenge_number
            entry = challenges[challenge_id]
            readme = (STARTERS / challenge_id / "README.md").read_text(
                encoding="utf-8"
            )
            heading = "## Continue from the previous challenge"
            self.assertIn(heading, readme)
            start_section = readme.split(heading, 1)[1].split("\n## ", 1)[0]
            normalized = " ".join(start_section.split())
            with self.subTest(challenge=challenge_id):
                self.assertIn("Create " + entry["label"] + " project", normalized)
                self.assertIn("separate project", normalized)
                self.assertIn("folder remains unchanged", normalized)
                self.assertIn("keeps whether", normalized)
                for component in entry["components"]:
                    self.assertIn("`%s`" % component["file"], readme)
                    if not component["carry_forward"]:
                        self.assertIn("`%s`" % component["file"], start_section)
                        self.assertIn("supplied", normalized)

    def test_mapped_route_states_results_without_prescribing_search_algorithm(self):
        readme = (STARTERS / "challenge_4" / "README.md").read_text(
            encoding="utf-8"
        )
        self.assertNotIn("shortest", readme.lower())
        self.assertNotIn("four-neighbor", readme.lower())
        self.assertIn("connected route through free grid cells", readme)
        self.assertIn("shares one horizontal or vertical side", readme)
        self.assertIn("accept any route", readme.lower())

        catalog = json.loads(
            (ROOT / "vendor/current/project_catalog.json").read_text(
                encoding="utf-8"
            )
        )
        summary = next(
            entry["summary"] for entry in catalog if entry["id"] == "challenge_4"
        )
        self.assertNotIn("shortest", summary.lower())
        self.assertIn("connected route through free grid cells", summary)

    def test_navigation_settings_are_named_and_show_units(self):
        expected_names = {
            "cruise_speed_mm_s",
            "approach_speed_mm_s",
            "slowdown_distance_mm",
            "turn_rate_rad_s",
            "position_tolerance_mm",
            "heading_tolerance_rad",
            "realign_heading_rad",
        }
        for challenge_number in range(1, 6):
            path = STARTERS / ("challenge_%d" % challenge_number) / "robot_config.py"
            tree = ast.parse(path.read_text(encoding="utf-8"))
            calls = [
                node
                for node in ast.walk(tree)
                if isinstance(node, ast.Call)
                and isinstance(node.func, ast.Name)
                and node.func.id == "NavigationConfig"
            ]
            self.assertEqual(len(calls), 1, path)
            self.assertEqual(calls[0].args, [], path)
            self.assertEqual({item.arg for item in calls[0].keywords}, expected_names)

    def test_turn_task_heading_has_one_project_owned_source(self):
        directory = STARTERS / "challenge_2"
        source = (directory / "challenge.py").read_text(encoding="utf-8")
        tree = ast.parse(source)
        self.assertNotIn("from math import pi", source)
        assignments = {
            node.targets[0].id: node.value
            for node in tree.body
            if isinstance(node, ast.Assign)
            and len(node.targets) == 1
            and isinstance(node.targets[0], ast.Name)
        }
        turn_heading = assignments["TURN_HEADING_RAD"]
        self.assertIsInstance(turn_heading, ast.Attribute)
        self.assertEqual(turn_heading.attr, "heading_rad")

        world = json.loads((directory / "world.json").read_text(encoding="utf-8"))
        turn = next(
            marker
            for marker in world["worlds"][0]["markers"]
            if marker.get("name") == "turn"
        )
        self.assertAlmostEqual(turn["heading_rad"], 3.141592653589793)

    def test_delivery_task_has_the_changeable_feature_in_both_virtual_cases(self):
        directory = STARTERS / "challenge_5"
        catalog = json.loads((directory / "world.json").read_text(encoding="utf-8"))
        course_source = str(ROOT / "vendor" / "current")
        previous_directory = os.getcwd()
        sys.path.insert(0, course_source)
        try:
            for world_id in ("gate-blocked", "gate-open"):
                with self.subTest(world=world_id), tempfile.TemporaryDirectory() as temp:
                    selected_catalog = dict(catalog)
                    selected_catalog["default_world"] = world_id
                    pathlib.Path(temp, "world.json").write_text(
                        json.dumps(selected_catalog),
                        encoding="utf-8",
                    )
                    os.chdir(temp)
                    values = runpy.run_path(
                        str(directory / "challenge.py"),
                        run_name="__main__",
                    )
                    task = values["DELIVERY_TASK"]
                    self.assertEqual(values["WORLD"].id, world_id)
                    self.assertEqual(values["MISSION_MAP_WORLD"].id, "gate-blocked")
                    self.assertIn(
                        task.observed_feature_name,
                        task.arena.feature_names,
                    )
                    self.assertEqual(
                        task.arena.with_feature_blocked(
                            task.observed_feature_name,
                            True,
                        ).blocked_features,
                        (task.observed_feature_name,),
                    )
        finally:
            os.chdir(previous_directory)
            sys.path.remove(course_source)


if __name__ == "__main__":
    unittest.main()
