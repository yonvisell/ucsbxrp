import importlib.util
from pathlib import Path
import shutil
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "reference_bytecode", ROOT / "scripts/reference_bytecode.py"
)
REFERENCE_BYTECODE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(REFERENCE_BYTECODE)


class ReferenceBytecodeReleaseTest(unittest.TestCase):
    def test_checked_in_artifacts_match_retained_source_and_release(self):
        manifest = REFERENCE_BYTECODE.verify(
            REFERENCE_BYTECODE.DEFAULT_SOURCE,
            REFERENCE_BYTECODE.DEFAULT_OUTPUT,
            ROOT / "vendor" / "current" / "release.json",
        )

        self.assertEqual(manifest["compiler"]["tag"], "v1.28.0")
        self.assertEqual(manifest["compiler"]["portable_abi"], 774)
        self.assertEqual(len(manifest["artifacts"]), 2)
        self.assertTrue(
            all(item["byte_size"] > 0 for item in manifest["artifacts"])
        )

    def test_verification_rejects_an_unexpected_generated_file(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            output = Path(temporary_directory) / "reference_mpy"
            shutil.copytree(REFERENCE_BYTECODE.DEFAULT_OUTPUT, output)
            (output / "stale.mpy").write_bytes(b"unexpected")

            with self.assertRaisesRegex(
                REFERENCE_BYTECODE.BytecodeBuildError, "not exact"
            ):
                REFERENCE_BYTECODE.verify(
                    REFERENCE_BYTECODE.DEFAULT_SOURCE,
                    output,
                    ROOT / "vendor" / "current" / "release.json",
                )


if __name__ == "__main__":
    unittest.main()
