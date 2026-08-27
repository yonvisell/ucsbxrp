import ast
import os
from pathlib import Path
import re
import subprocess
import sys
import unittest


ROOT = Path(__file__).resolve().parents[2]


class ApiReferenceParityTests(unittest.TestCase):
    def _run_course_snippet(self, source, working_directory=ROOT):
        environment = os.environ.copy()
        environment["PYTHONPATH"] = str(ROOT / "vendor/current")
        return subprocess.run(
            [sys.executable, "-c", source],
            cwd=working_directory,
            env=environment,
            check=True,
            capture_output=True,
            text=True,
        )

    def _public_names(self, relative_path):
        module = ast.parse((ROOT / relative_path).read_text(encoding="utf-8"))
        for statement in module.body:
            if not isinstance(statement, ast.Assign):
                continue
            if any(
                isinstance(target, ast.Name) and target.id == "__all__"
                for target in statement.targets
            ):
                return ast.literal_eval(statement.value)
        self.fail("{} must define __all__".format(relative_path))

    def _assert_names_are_documented(self, path, names):
        reference = (ROOT / path).read_text(encoding="utf-8")
        missing = [
            name
            for name in names
            if re.search(
                r"(?<![A-Za-z0-9_])" + re.escape(name) + r"(?![A-Za-z0-9_])",
                reference,
            )
            is None
        ]
        self.assertEqual(missing, [], "Add every public name to {}".format(path))

    def test_every_public_course_symbol_is_named_in_the_student_reference(self):
        public_names = self._public_names("vendor/current/ucsb_xrp/__init__.py")

        self._assert_names_are_documented(
            "apps/reference/src/ReferenceApp.tsx", public_names
        )
        self._assert_names_are_documented("USER_REFERENCE.md", public_names)
        self._assert_names_are_documented(
            "v2_03_ucsb_xrp_api_reference.txt", public_names
        )

    def test_live_module_public_functions_are_named_in_each_api_reference(self):
        public_names = self._public_names("vendor/current/ucsb_xrp/live.py")
        for path in (
            "apps/reference/src/ReferenceApp.tsx",
            "USER_REFERENCE.md",
            "v2_03_ucsb_xrp_api_reference.txt",
        ):
            with self.subTest(path=path):
                self._assert_names_are_documented(path, public_names)

    def test_active_api_documents_the_actual_component_import_boundary(self):
        reference = (ROOT / "v2_03_ucsb_xrp_api_reference.txt").read_text(
            encoding="utf-8"
        )
        for component in (
            "SensorModel",
            "WheelSpeedController",
            "DifferentialDrive",
            "Odometry",
            "NavigationController",
            "GridPlanner",
        ):
            with self.subTest(component=component):
                self.assertNotIn("from ucsb_xrp import " + component, reference)
                self.assertIn(component + "Base", reference)

        normalized = " ".join(reference.split())
        self.assertIn(
            "the range does not need to contain an exact whole number of steps",
            normalized.lower(),
        )

    def test_active_guide_covers_project_worlds_live_plots_and_speed_filtering(self):
        guide = (ROOT / "v2_02_ucsb_xrp_library_user_guide.txt").read_text(
            encoding="utf-8"
        )
        for name in (
            "ProjectWorld",
            "load_world",
            "world.json",
            "live.plot",
            "wheel-speed estimator response time",
        ):
            with self.subTest(name=name):
                self.assertIn(name, guide)

    def test_corrected_web_reference_examples_execute_in_their_named_context(self):
        self._run_course_snippet(
            """
from ucsb_xrp import live

cruise_speed = live.number(
    "cruise_speed_mm_s", 120.0, 60.0, 220.0, 10.0,
    unit="mm/s", label="Cruise speed",
)
target_speed_mm_s = 120.0
measured_speed_mm_s = 105.0
live.plot(
    "wheel_speed_error_mm_s",
    target_speed_mm_s - measured_speed_mm_s,
    unit="mm/s",
)
assert cruise_speed.value == 120.0
"""
        )

        challenge_five = ROOT / "vendor/current/starters/challenge_5"
        self._run_course_snippet(
            """
from ucsb_xrp import load_world

world = load_world()
start_pose = world.initial_pose
arena = world.arena_map(blocked_features=("center_gate",))
destination = world.waypoint("destination")
assert start_pose is not None
assert arena.blocked_features == ("center_gate",)
assert destination is not None
""",
            challenge_five,
        )

    def test_web_reference_uses_current_names_and_unambiguous_argument_rows(self):
        reference = (ROOT / "apps/reference/src/ReferenceApp.tsx").read_text(
            encoding="utf-8"
        )
        self.assertNotIn("target_mm_s - measured_mm_s", reference)
        self.assertIn('blocked_features=("center_gate",)', reference)
        self.assertIn('world.waypoint("destination")', reference)
        self.assertNotRegex(reference, r'name: "[^"]+, [^"]+"')

        grid_path_entry = reference.split(
            'name="GridPath.to_goals"', 1
        )[1].split("/>", 1)[0]
        self.assertNotIn(
            "TypeError if grid is not OccupancyGrid", grid_path_entry
        )
        for signature in (
            "SensorModel.update(raw: RawSensors)",
            "Robot.step(command: MotionCommand",
            "GridPath.to_goals(grid: OccupancyGrid",
            "OccupancyGrid.world_to_cell(x_mm: float",
            "XRPBot.read(include_range: bool",
        ):
            with self.subTest(signature=signature):
                self.assertIn(signature, reference)


if __name__ == "__main__":
    unittest.main()
