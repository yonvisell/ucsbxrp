import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "challenge_authoring", ROOT / "scripts/challenge_authoring.py"
)
AUTHORING = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUTHORING)


class ChallengeAuthoringTests(unittest.TestCase):
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
            draft_root = Path(directory)
            vendor = draft_root / "vendor/current"
            (vendor / "starters").mkdir(parents=True)
            shutil.copytree(
                ROOT / "vendor/current/starters/challenge_5",
                vendor / "starters/challenge_5",
            )
            source_entry = next(
                entry
                for entry in AUTHORING.read_catalog(ROOT)
                if entry["id"] == "challenge_5"
            )
            (vendor / "project_catalog.json").write_text(
                json.dumps([source_entry]), encoding="utf-8"
            )

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


if __name__ == "__main__":
    unittest.main()
