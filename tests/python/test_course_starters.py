import ast
import contextlib
import io
import json
import pathlib
import runpy
import sys
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

    def test_tutorial_is_progressive_bounded_and_student_facing(self):
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

    def test_component_check_files_expose_instructions_not_check_machinery(self):
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
                self.assertIn("# Normal use:", source)
                self.assertIn("# Example:", source)
                self.assertIn("run_component_checks(", source)
                self.assertNotIn("def check_", source)
                self.assertNotIn("RawSensors", source)

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
                    with contextlib.redirect_stdout(output):
                        runpy.run_path(str(path), run_name="__main__")
                finally:
                    sys.path.remove(str(directory))
                    sys.path.remove(course_source)
                    for name in project_module_names:
                        sys.modules.pop(name, None)
                    sys.modules.update(saved_modules)

                text = output.getvalue()
                self.assertIn(
                    "Component checks use MicroPython without starting either robot.",
                    text,
                )
                self.assertIn(
                    "0 passed · {} pending · 0 failed".format(component_count),
                    text,
                )

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
        required_sections = (
            "## Objective",
            "## Student implementations",
            "## Supplied project files and services",
            "## Program flow",
            "## Work sequence",
        )

        for challenge, student_files in expected_student_files.items():
            text = (STARTERS / challenge / "README.md").read_text(encoding="utf-8")
            with self.subTest(challenge=challenge):
                for section in required_sections:
                    self.assertIn(section, text)
                self.assertIn("```text", text)
                self.assertIn("* student implementation", text)
                self.assertIn("component_checks.py", text)
                self.assertIn("course_setup.py", text)
                for filename in student_files:
                    self.assertIn("`%s`" % filename, text)
                for parameter in expected_task_parameters[challenge]:
                    self.assertIn("`%s`" % parameter, text)

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


if __name__ == "__main__":
    unittest.main()
