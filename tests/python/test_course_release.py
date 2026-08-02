import importlib.util
from pathlib import Path
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "course_release", ROOT / "scripts/course_release.py"
)
COURSE_RELEASE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(COURSE_RELEASE)


class CourseReleaseHashTest(unittest.TestCase):
    def test_current_release_manifest_matches_canonical_source(self):
        identity = COURSE_RELEASE.verify_release(
            COURSE_RELEASE.DEFAULT_SOURCE, COURSE_RELEASE.DEFAULT_RELEASE
        )
        self.assertEqual(identity["algorithm"], "sha256-file-manifest-v1")
        self.assertEqual(identity["file_count"], 13)

    def test_manifest_is_ordered_and_includes_paths_and_content_hashes(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "ucsb_xrp"
            root.mkdir()
            (root / "z.py").write_text("Z = 1\n", encoding="utf-8")
            (root / "a.py").write_text("A = 1\n", encoding="utf-8")
            manifest = COURSE_RELEASE.source_manifest(root)

        self.assertLess(manifest.index("ucsb_xrp/a.py"), manifest.index("z.py"))
        self.assertEqual(manifest.count("\n"), 2)

    def test_tree_identity_changes_with_content_or_path(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "ucsb_xrp"
            root.mkdir()
            source = root / "value.py"
            source.write_text("VALUE = 1\n", encoding="utf-8")
            first = COURSE_RELEASE.source_identity(root)["sha256"]
            source.write_text("VALUE = 2\n", encoding="utf-8")
            second = COURSE_RELEASE.source_identity(root)["sha256"]
            source.rename(root / "renamed.py")
            third = COURSE_RELEASE.source_identity(root)["sha256"]

        self.assertNotEqual(first, second)
        self.assertNotEqual(second, third)


if __name__ == "__main__":
    unittest.main()
