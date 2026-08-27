import importlib.util
import json
from pathlib import Path
import re
import shutil
import tempfile
import unittest
from unittest import mock


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "challenge_authoring", ROOT / "scripts/challenge_authoring.py"
)
AUTHORING = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUTHORING)


class ChallengeAuthoringTests(unittest.TestCase):
    def make_draft_root(self, directory, source_id="challenge_3"):
        draft_root = Path(directory)
        vendor = draft_root / "vendor/current"
        (vendor / "starters").mkdir(parents=True)
        shutil.copytree(
            ROOT / "vendor/current/starters" / source_id,
            vendor / "starters" / source_id,
        )
        source_entry = next(
            entry
            for entry in AUTHORING.read_catalog(ROOT)
            if entry["id"] == source_id
        )
        (vendor / "project_catalog.json").write_text(
            json.dumps([source_entry]), encoding="utf-8"
        )
        return draft_root

    def test_published_catalog_is_complete(self):
        self.assertEqual(AUTHORING.catalog_errors(ROOT), [])

    def test_catalog_has_five_ordered_published_challenges(self):
        entries = [
            entry
            for entry in AUTHORING.read_catalog(ROOT)
            if entry["kind"] == "challenge" and entry["published"]
        ]
        self.assertEqual(
            [entry["id"] for entry in entries],
            ["challenge_1", "challenge_2", "challenge_3", "challenge_4", "challenge_5"],
        )

    def test_new_challenge_remains_a_checked_draft(self):
        with tempfile.TemporaryDirectory() as directory:
            draft_root = self.make_draft_root(directory, "challenge_5")

            created = AUTHORING.create_draft(
                draft_root,
                "challenge_5",
                "challenge_6",
                "Multi-stop delivery",
                "Visit several delivery points.",
            )

            self.assertTrue((created / "world.json").is_file())
            entry = AUTHORING.catalog_entry(
                AUTHORING.read_catalog(draft_root), "challenge_6"
            )
            self.assertFalse(entry["published"])
            self.assertTrue(
                any(
                    "unresolved author task" in error
                    for error in AUTHORING.catalog_errors(
                        draft_root, project_id="challenge_6"
                    )
                )
            )
            with self.assertRaises(AUTHORING.AuthoringError):
                AUTHORING.publish(draft_root, "challenge_6")

    def test_complete_spec_creates_a_checked_unpublished_challenge(self):
        spec = json.loads(
            (ROOT / "docs/examples/waypoint_slalom.challenge.json").read_text(
                encoding="utf-8"
            )
        )
        with tempfile.TemporaryDirectory() as directory:
            draft_root = self.make_draft_root(directory)
            created = AUTHORING.create_draft_from_spec(draft_root, spec)

            self.assertEqual(
                AUTHORING.catalog_errors(
                    draft_root, project_id="challenge_6", include_drafts=True
                ),
                [],
            )
            self.assertIn(
                "## Evidence to collect",
                (created / "README.md").read_text(encoding="utf-8"),
            )
            self.assertIn(
                '"waypoint-slalom"',
                (created / "world.json").read_text(encoding="utf-8"),
            )
            self.assertIn(
                "Waypoint Slalom complete",
                (created / "main.py").read_text(encoding="utf-8"),
            )
            entry = AUTHORING.catalog_entry(
                AUTHORING.read_catalog(draft_root), "challenge_6"
            )
            self.assertFalse(entry["published"])
            self.assertEqual(
                [component["name"] for component in entry["components"]],
                [
                    "SensorModel",
                    "WheelSpeedController",
                    "DifferentialDrive",
                    "Odometry",
                    "NavigationController",
                ],
            )
            self.assertEqual(
                entry["components"][-1]["selection_flag"],
                "USE_STUDENT_NAVIGATION_CONTROLLER",
            )
            generated_readme = (created / "README.md").read_text(
                encoding="utf-8"
            )
            self.assertIn(
                "1. challenge.py loads the initial pose", generated_readme
            )
            self.assertNotIn("```text", generated_readme)
            self.assertNotIn("->", generated_readme)
            AUTHORING.publish(draft_root, "challenge_6")
            self.assertTrue(
                AUTHORING.catalog_entry(
                    AUTHORING.read_catalog(draft_root), "challenge_6"
                )["published"]
            )

    def test_documented_working_spec_matches_checked_example(self):
        documentation = (
            ROOT / "docs/INSTRUCTOR_CHALLENGE_AUTHORING.md"
        ).read_text(encoding="utf-8")
        match = re.search(
            r"## Complete working example:.*?```json\n(.*?)\n```",
            documentation,
            flags=re.DOTALL,
        )
        self.assertIsNotNone(match)
        documented = json.loads(match.group(1))
        checked = json.loads(
            (ROOT / "docs/examples/waypoint_slalom.challenge.json").read_text(
                encoding="utf-8"
            )
        )
        self.assertEqual(documented, checked)

    def test_spec_rejects_unsafe_file_override(self):
        spec = json.loads(
            (ROOT / "docs/examples/waypoint_slalom.challenge.json").read_text(
                encoding="utf-8"
            )
        )
        spec["files"] = {"../main.py": "print('unsafe')\n"}
        with self.assertRaisesRegex(AUTHORING.AuthoringError, "invalid project"):
            AUTHORING.validate_spec(spec)

    def test_spec_rejects_unsafe_or_invalid_student_component(self):
        spec = json.loads(
            (ROOT / "docs/examples/waypoint_slalom.challenge.json").read_text(
                encoding="utf-8"
            )
        )
        spec["student_implementations"][0]["file"] = "../controller.py"
        with self.assertRaisesRegex(
            AUTHORING.AuthoringError, "invalid student component file"
        ):
            AUTHORING.validate_spec(spec)

        spec["student_implementations"][0]["file"] = "controller.py"
        spec["student_implementations"][0]["class_name"] = "not-a-class"
        with self.assertRaisesRegex(
            AUTHORING.AuthoringError, "Python identifier"
        ):
            AUTHORING.validate_spec(spec)

    def test_generated_project_must_define_each_declared_student_class(self):
        spec = json.loads(
            (ROOT / "docs/examples/waypoint_slalom.challenge.json").read_text(
                encoding="utf-8"
            )
        )
        spec["student_implementations"][0]["class_name"] = "MissingController"
        with tempfile.TemporaryDirectory() as directory:
            draft_root = self.make_draft_root(directory)
            with self.assertRaisesRegex(
                AUTHORING.AuthoringError,
                "navigation_controller.py declares class MissingController",
            ):
                AUTHORING.create_draft_from_spec(draft_root, spec)

    def test_generated_catalog_carries_new_component_template_metadata(self):
        spec = json.loads(
            (ROOT / "docs/examples/waypoint_slalom.challenge.json").read_text(
                encoding="utf-8"
            )
        )
        spec["student_implementations"].append(
            {
                "file": "route_analyzer.py",
                "class_name": "RouteAnalyzer",
                "selection_flag": "USE_STUDENT_ROUTE_ANALYZER",
                "responsibility": "Summarize route error from recorded poses.",
            }
        )
        spec["files"]["route_analyzer.py"] = "class RouteAnalyzer:\n    pass\n"
        spec["files"]["course_setup.py"] = (
            ROOT / "vendor/current/starters/challenge_3/course_setup.py"
        ).read_text(encoding="utf-8") + "\nUSE_STUDENT_ROUTE_ANALYZER = False\n"

        with tempfile.TemporaryDirectory() as directory:
            draft_root = self.make_draft_root(directory)
            AUTHORING.create_draft_from_spec(draft_root, spec)
            entry = AUTHORING.catalog_entry(
                AUTHORING.read_catalog(draft_root), "challenge_6"
            )
            self.assertEqual(
                entry["components"][-1],
                {
                    "name": "RouteAnalyzer",
                    "file": "route_analyzer.py",
                    "selection_flag": "USE_STUDENT_ROUTE_ANALYZER",
                    "carry_forward": False,
                },
            )
            self.assertEqual(AUTHORING.project_errors(draft_root, entry), [])

    def test_readme_layout_does_not_define_or_weaken_component_validation(self):
        with tempfile.TemporaryDirectory() as directory:
            draft_root = self.make_draft_root(directory, "challenge_1")
            entry = AUTHORING.catalog_entry(
                AUTHORING.read_catalog(draft_root), "challenge_1"
            )
            project = draft_root / "vendor/current/starters/challenge_1"
            (project / "README.md").write_text(
                """# Challenge 1: Alternate documentation layout

## What you implement

The two student classes are explained in prose, without a metadata table.

## Provided files and tools

- `world.json` defines the visible arena.

## How the program runs

The robot measures, controls, and stops in a repeated sequence.

## Complete the challenge

1. Implement and test the two components.
""",
                encoding="utf-8",
            )
            self.assertEqual(AUTHORING.project_errors(draft_root, entry), [])

            sensor_path = project / "sensor_model.py"
            sensor_path.write_text(
                sensor_path.read_text(encoding="utf-8").replace(
                    "class SensorModel(", "class RenamedSensorModel(", 1
                ),
                encoding="utf-8",
            )
            self.assertIn(
                "challenge_1: sensor_model.py does not define class SensorModel",
                AUTHORING.project_errors(draft_root, entry),
            )

    def test_world_validation_covers_all_supported_geometry(self):
        world = {
            "default_world": "lab",
            "worlds": [
                {
                    "id": "lab",
                    "label": "Lab",
                    "bounds": {
                        "minimum_x_mm": 0,
                        "minimum_y_mm": 0,
                        "maximum_x_mm": 1000,
                        "maximum_y_mm": 800,
                    },
                    "initial_pose": {
                        "x_mm": 100,
                        "y_mm": 100,
                        "heading_rad": 0,
                    },
                    "obstacles": [
                        {
                            "type": "wall",
                            "minimum_x_mm": 300,
                            "minimum_y_mm": 0,
                            "maximum_x_mm": 340,
                            "maximum_y_mm": 300,
                            "label": "Arena wall",
                        },
                        {
                            "type": "block",
                            "feature": "gate",
                            "minimum_x_mm": 500,
                            "minimum_y_mm": 300,
                            "maximum_x_mm": 600,
                            "maximum_y_mm": 400,
                        },
                    ],
                    "markers": [
                        {
                            "type": "start_line",
                            "x1_mm": 50,
                            "y1_mm": 50,
                            "x2_mm": 50,
                            "y2_mm": 150,
                        },
                        {
                            "type": "start_box",
                            "minimum_x_mm": 50,
                            "minimum_y_mm": 50,
                            "maximum_x_mm": 150,
                            "maximum_y_mm": 150,
                        },
                        {
                            "type": "waypoint",
                            "name": "finish",
                            "x_mm": 900,
                            "y_mm": 700,
                            "heading_rad": 1.2,
                        },
                    ],
                }
            ],
        }
        self.assertEqual(AUTHORING._world_errors(world, "example"), [])

        world["worlds"][0]["markers"][0]["x1_mm"] = -1
        self.assertTrue(
            any(
                "inside the arena walls" in error
                for error in AUTHORING._world_errors(world, "example")
            )
        )

    def test_spec_requires_world_names_used_by_copied_program(self):
        spec = json.loads(
            (ROOT / "docs/examples/waypoint_slalom.challenge.json").read_text(
                encoding="utf-8"
            )
        )
        spec["source_id"] = "challenge_2"
        with self.assertRaisesRegex(AUTHORING.AuthoringError, "waypoint 'turn'"):
            AUTHORING.validate_spec(spec)

    def test_complete_challenge_override_may_define_different_world_names(self):
        spec = json.loads(
            (ROOT / "docs/examples/waypoint_slalom.challenge.json").read_text(
                encoding="utf-8"
            )
        )
        spec["source_id"] = "challenge_2"
        spec["files"]["challenge.py"] = "ROUTE = ()\n"
        normalized = AUTHORING.validate_spec(spec)
        self.assertIn("challenge.py", normalized["files"])

    def test_create_command_accepts_downloaded_specification(self):
        spec_source = ROOT / "docs/examples/waypoint_slalom.challenge.json"
        with tempfile.TemporaryDirectory() as directory:
            draft_root = self.make_draft_root(directory)
            result = AUTHORING.main(
                [
                    "--root",
                    str(draft_root),
                    "create",
                    "--spec",
                    str(spec_source),
                ]
            )
            self.assertEqual(result, 0)
            self.assertTrue(
                (
                    draft_root
                    / "vendor/current/starters/challenge_6/README.md"
                ).is_file()
            )

    def test_catalog_replacement_is_atomic_if_the_final_replace_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            draft_root = self.make_draft_root(directory)
            catalog_path = draft_root / AUTHORING.CATALOG_RELATIVE_PATH
            original = catalog_path.read_bytes()
            catalog = AUTHORING.read_catalog(draft_root)
            catalog[0]["title"] = "Changed title"

            with mock.patch.object(
                AUTHORING.os, "replace", side_effect=OSError("replace failed")
            ):
                with self.assertRaisesRegex(OSError, "replace failed"):
                    AUTHORING.write_catalog(draft_root, catalog)

            self.assertEqual(catalog_path.read_bytes(), original)
            self.assertEqual(
                list(catalog_path.parent.glob(".project_catalog.json.*.tmp")), []
            )


if __name__ == "__main__":
    unittest.main()
