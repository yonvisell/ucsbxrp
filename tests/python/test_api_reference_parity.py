import ast
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[2]


class ApiReferenceParityTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
