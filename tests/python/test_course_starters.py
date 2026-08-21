import ast
import pathlib
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
