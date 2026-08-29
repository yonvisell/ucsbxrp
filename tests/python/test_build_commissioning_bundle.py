import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from urllib.parse import urljoin


ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

import build_commissioning_bundle as BUNDLE  # noqa: E402
import install_xrp_service as INSTALLER  # noqa: E402


class BrowserCommissioningBundleTest(unittest.TestCase):
    def test_firmware_url_identity_changes_with_the_firmware_digest(self):
        first = BUNDLE.firmware_bundle_url(
            {"asset": "xrp.uf2", "sha256": "a" * 64}
        )
        second = BUNDLE.firmware_bundle_url(
            {"asset": "xrp.uf2", "sha256": "b" * 64}
        )

        self.assertEqual(first, "firmware/sha256/{}/xrp.uf2".format("a" * 64))
        self.assertNotEqual(first, second)

    def test_manifest_separates_bootstrap_and_slot_relative_runtime(self):
        manifest = BUNDLE.commissioning_manifest()
        runtime_sources = INSTALLER.runtime_files()
        bootstrap_sources = INSTALLER.bootstrap_files()

        self.assertEqual(manifest["schemaVersion"], 2)
        self.assertEqual(manifest["releaseId"], "2026.08-dev.44")
        self.assertEqual(manifest["releaseSequence"], 44)
        self.assertIn("lib/XRPLib/board.py", runtime_sources)
        self.assertIn("lib/phew/server.py", runtime_sources)
        self.assertEqual(
            manifest["compatibility"],
            {
                "courseApiRevision": "0.4-draft",
                "courseLibraryVersion": "0.4.0-dev",
                "serviceVersion": "0.1.0",
                "protocolVersion": 1,
                "protocolRevision": 4,
                "bootstrapVersion": 1,
                "minimumRobotReleaseSequence": 44,
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
                manifest["micropython"]["firmware"]["url"],
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

    def test_command_writes_an_immutable_release_scoped_bundle(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "commissioning"
            output.mkdir()
            (output / "manifest.json").write_text("stale mutable manifest\n")

            self.assertEqual(BUNDLE.main([str(output)]), 0)

            release = INSTALLER.release_metadata()
            manifest_path = (
                output
                / "releases"
                / str(release["release_sequence"])
                / "manifest.json"
            )
            self.assertTrue(manifest_path.is_file())
            self.assertFalse((output / "manifest.json").exists())

            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            deployment_manifest_url = (
                "https://course.test/ucsbxrp/course/commissioning/releases/"
                "{}/manifest.json".format(release["release_sequence"])
            )
            firmware = manifest["micropython"]["firmware"]
            self.assertEqual(
                urljoin(deployment_manifest_url, firmware["url"]),
                "https://course.test/ucsbxrp/course/commissioning/releases/"
                "{}/firmware/sha256/{}/{}".format(
                    release["release_sequence"],
                    firmware["sha256"],
                    firmware["asset"],
                ),
            )
            firmware_path = manifest_path.parent / firmware["url"]
            self.assertEqual(firmware_path.stat().st_size, firmware["bytes"])
            self.assertEqual(
                hashlib.sha256(firmware_path.read_bytes()).hexdigest(),
                firmware["sha256"],
            )
            self.assertEqual(
                urljoin(
                    deployment_manifest_url,
                    manifest["runtime"]["manifest"]["url"],
                ),
                "https://course.test/ucsbxrp/course/commissioning/releases/"
                "{}/files/runtime/runtime-manifest.json".format(
                    release["release_sequence"]
                ),
            )


if __name__ == "__main__":
    unittest.main()
