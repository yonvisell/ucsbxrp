import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import build_commissioning_bundle as BUNDLE  # noqa: E402
import install_xrp_service as INSTALLER  # noqa: E402


class BrowserCommissioningBundleTest(unittest.TestCase):
    def test_manifest_reuses_exact_installer_files_and_verified_firmware(self):
        manifest = BUNDLE.commissioning_manifest()
        expected = INSTALLER.installation_files()

        self.assertEqual(manifest["releaseId"], "2026.08-dev.14")
        self.assertEqual(manifest["serviceVersion"], "2026.08-dev.14")
        self.assertEqual(manifest["courseLibraryVersion"], "0.4.0-dev")
        self.assertEqual(
            {entry["destination"] for entry in manifest["files"]},
            set(expected),
        )
        for entry in manifest["files"]:
            data = expected[entry["destination"]].read_bytes()
            self.assertEqual(entry["bytes"], len(data))
            self.assertEqual(entry["sha256"], hashlib.sha256(data).hexdigest())
            self.assertNotIn("reference_source", entry["source"])

        firmware = manifest["micropython"]["firmware"]
        data = (
            ROOT / "vendor/current/firmware" / firmware["asset"]
        ).read_bytes()
        self.assertEqual(firmware["bytes"], len(data))
        self.assertEqual(firmware["sha256"], hashlib.sha256(data).hexdigest())

    def test_written_bundle_contains_only_manifest_and_install_payload(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            manifest = BUNDLE.write_bundle(output)
            written_manifest = json.loads(
                (output / "manifest.json").read_text(encoding="utf-8")
            )
            self.assertEqual(written_manifest, manifest)
            files = sorted(path for path in output.rglob("*") if path.is_file())
            self.assertEqual(len(files), len(manifest["files"]) + 1)
            self.assertFalse(any("reference_source" in str(path) for path in files))


if __name__ == "__main__":
    unittest.main()
