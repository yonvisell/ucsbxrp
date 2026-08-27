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
    def test_manifest_separates_bootstrap_and_slot_relative_runtime(self):
        manifest = BUNDLE.commissioning_manifest()
        runtime_sources = INSTALLER.runtime_files()
        bootstrap_sources = INSTALLER.bootstrap_files()

        self.assertEqual(manifest["schemaVersion"], 2)
        self.assertEqual(manifest["releaseId"], "2026.08-dev.25")
        self.assertEqual(manifest["releaseSequence"], 25)
        self.assertEqual(
            manifest["compatibility"],
            {
                "courseApiRevision": "0.4-draft",
                "courseLibraryVersion": "0.4.0-dev",
                "serviceVersion": "0.1.0",
                "protocolVersion": 1,
                "protocolRevision": 1,
                "bootstrapVersion": 1,
                "minimumRobotReleaseSequence": 25,
            },
        )
        self.assertEqual(
            {entry["destination"] for entry in manifest["bootstrapFiles"]},
            set(bootstrap_sources),
        )
        self.assertEqual(
            {entry["path"] for entry in manifest["runtime"]["files"]},
            set(runtime_sources),
        )
        self.assertTrue(
            all(
                entry["path"].startswith("lib/")
                and not entry["path"].startswith("/")
                for entry in manifest["runtime"]["files"]
            )
        )

    def test_manifest_entries_hash_the_exact_source_bytes(self):
        manifest = BUNDLE.commissioning_manifest()
        runtime_sources = INSTALLER.runtime_files()
        bootstrap_sources = INSTALLER.bootstrap_files()
        for entry in manifest["runtime"]["files"]:
            data = runtime_sources[entry["path"]].read_bytes()
            self.assertEqual(entry["bytes"], len(data))
            self.assertEqual(entry["sha256"], hashlib.sha256(data).hexdigest())
            self.assertNotIn("reference_source", entry["source"])
        for entry in manifest["bootstrapFiles"]:
            data = bootstrap_sources[entry["destination"]].read_bytes()
            self.assertEqual(entry["bytes"], len(data))
            self.assertEqual(entry["sha256"], hashlib.sha256(data).hexdigest())

        firmware = manifest["micropython"]["firmware"]
        data = (ROOT / "vendor/current/firmware" / firmware["asset"]).read_bytes()
        self.assertEqual(firmware["bytes"], len(data))
        self.assertEqual(firmware["sha256"], hashlib.sha256(data).hexdigest())

    def test_runtime_manifest_digest_covers_exact_canonical_bytes(self):
        manifest = BUNDLE.commissioning_manifest()
        runtime = INSTALLER.runtime_manifest()
        data = INSTALLER.canonical_json_bytes(runtime)

        self.assertTrue(data.endswith(b"\n"))
        self.assertNotIn(b" ", data)
        self.assertEqual(manifest["runtime"]["manifest"]["bytes"], len(data))
        self.assertEqual(
            manifest["runtime"]["manifest"]["sha256"],
            hashlib.sha256(data).hexdigest(),
        )
        self.assertEqual(
            [entry["path"] for entry in runtime["files"]],
            list(INSTALLER.runtime_files()),
        )

    def test_written_bundle_contains_declared_payload_only(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory)
            manifest = BUNDLE.write_bundle(output)
            written_manifest = json.loads(
                (output / "manifest.json").read_text(encoding="utf-8")
            )
            self.assertEqual(written_manifest, manifest)

            runtime_manifest_path = output / manifest["runtime"]["manifest"]["url"]
            runtime_manifest_data = runtime_manifest_path.read_bytes()
            self.assertEqual(
                hashlib.sha256(runtime_manifest_data).hexdigest(),
                manifest["runtime"]["manifest"]["sha256"],
            )
            declared = {
                "manifest.json",
                manifest["runtime"]["manifest"]["url"],
                *(entry["url"] for entry in manifest["bootstrapFiles"]),
                *(entry["url"] for entry in manifest["runtime"]["files"]),
            }
            written = {
                str(path.relative_to(output)).replace("\\", "/")
                for path in output.rglob("*")
                if path.is_file()
            }
            self.assertEqual(written, declared)
            self.assertFalse(any("reference_source" in path for path in written))


if __name__ == "__main__":
    unittest.main()
