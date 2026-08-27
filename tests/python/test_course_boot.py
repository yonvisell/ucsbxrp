import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[2]
BOOT_PATH = ROOT / "device_service/course_boot.py"


class CourseBootTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location("course_boot_test", BOOT_PATH)
        cls.course_boot = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.course_boot)

    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.runtime_root = Path(self.temporary.name, "course_runtime")
        self.runtime_root.mkdir()
        self.original_root = self.course_boot.RUNTIME_ROOT
        self.original_path = list(sys.path)
        self.course_boot.RUNTIME_ROOT = str(self.runtime_root)
        self.course_boot._active_context = None

    def tearDown(self):
        self.course_boot.RUNTIME_ROOT = self.original_root
        sys.path[:] = self.original_path
        self.course_boot._active_context = None
        self.temporary.cleanup()

    def _activation(self, slot, generation, release, sequence):
        slot_root = self.runtime_root / "slots" / slot
        (slot_root / "lib").mkdir(parents=True)
        manifest = {
            "schemaVersion": 1,
            "releaseId": release,
            "releaseSequence": sequence,
            "compatibility": {
                "courseApiRevision": "0.4-draft",
                "courseLibraryVersion": "0.4.0-dev",
                "serviceVersion": release,
                "protocolVersion": 1,
                "protocolRevision": 1,
                "bootstrapVersion": 1,
            },
            "files": [],
        }
        body = (json.dumps(manifest, sort_keys=True) + "\n").encode()
        (slot_root / "runtime-manifest.json").write_bytes(body)
        return {
            "schemaVersion": 1,
            "generation": generation,
            "slot": slot,
            "releaseId": release,
            "releaseSequence": sequence,
            "runtimeManifestSha256": hashlib.sha256(body).hexdigest(),
        }

    def _write(self, name, value):
        (self.runtime_root / name).write_text(json.dumps(value))

    def test_prepare_runtime_imports_uses_newest_verified_activation(self):
        older = self._activation("a", 4, "release-4", 4)
        newer = self._activation("b", 5, "release-5", 5)
        self._write("active.0.json", older)
        self._write("active.1.json", newer)
        self._write("confirmed.json", older)

        context = self.course_boot.prepare_runtime_imports()

        self.assertEqual(context["releaseId"], "release-5")
        self.assertEqual(context["releaseSequence"], 5)
        self.assertEqual(context["courseApiRevision"], "0.4-draft")
        self.assertEqual(context["courseLibraryVersion"], "0.4.0-dev")
        self.assertIsInstance(context["protocolRevision"], int)
        self.assertIsInstance(context["bootstrapVersion"], int)
        self.assertTrue(context["trial"])
        self.assertEqual(sys.path[0], str(self.runtime_root / "slots/b/lib"))
        self.assertFalse((self.runtime_root / "attempted.json").exists())

    def test_corrupt_newest_manifest_is_ignored(self):
        older = self._activation("a", 4, "release-4", 4)
        newer = self._activation("b", 5, "release-5", 5)
        self._write("active.0.json", older)
        self._write("active.1.json", newer)
        self._write("confirmed.json", older)
        (self.runtime_root / "slots/b/runtime-manifest.json").write_text("{}")

        context = self.course_boot.prepare_runtime_imports()

        self.assertEqual(context["releaseId"], "release-4")
        self.assertFalse(context["trial"])

    def test_attempted_unconfirmed_candidate_returns_to_confirmed_runtime(self):
        older = self._activation("a", 4, "release-4", 4)
        newer = self._activation("b", 5, "release-5", 5)
        self._write("active.0.json", older)
        self._write("active.1.json", newer)
        self._write("confirmed.json", older)
        self._write("attempted.json", newer)

        context = self.course_boot.prepare_runtime_imports()

        self.assertEqual(context["releaseId"], "release-4")
        self.assertFalse(context["trial"])

    def test_confirmation_records_the_exact_runtime_identity(self):
        activation = self._activation("a", 7, "release-7", 7)
        self._write("active.1.json", activation)
        self.course_boot.prepare_runtime_imports()

        self.assertTrue(self.course_boot.confirm_active_runtime())

        marker = json.loads((self.runtime_root / "confirmed.json").read_text())
        self.assertEqual(
            (
                marker["generation"],
                marker["slot"],
                marker["runtimeManifestSha256"],
            ),
            (7, "a", activation["runtimeManifestSha256"]),
        )
        self.assertTrue(self.course_boot.runtime_identity()["confirmed"])

    def test_synchronous_candidate_failure_falls_back_to_confirmed_runtime(self):
        older = self._activation("a", 4, "release-4", 4)
        newer = self._activation("b", 5, "release-5", 5)
        self._write("active.0.json", older)
        self._write("active.1.json", newer)
        self._write("confirmed.json", older)
        calls = []

        def run_service(_watchdog):
            calls.append(self.course_boot.runtime_identity()["releaseId"])
            if len(calls) == 1:
                raise RuntimeError("candidate failed")

        fake_machine = types.ModuleType("machine")
        fake_machine.WDT = lambda timeout: types.SimpleNamespace(feed=lambda: None)
        with (
            patch.dict(sys.modules, {"machine": fake_machine}),
            patch.object(self.course_boot, "_run_service", side_effect=run_service),
        ):
            self.course_boot.boot()

        self.assertEqual(calls, ["release-5", "release-4"])
        attempted = json.loads((self.runtime_root / "attempted.json").read_text())
        self.assertEqual(attempted["generation"], 5)

    def test_keyboard_interrupt_reaches_the_repl_without_fallback(self):
        activation = self._activation("a", 1, "release-1", 1)
        self._write("active.0.json", activation)
        fake_machine = types.ModuleType("machine")
        fake_machine.WDT = lambda timeout: types.SimpleNamespace(feed=lambda: None)
        with (
            patch.dict(sys.modules, {"machine": fake_machine}),
            patch.object(
                self.course_boot,
                "_run_service",
                side_effect=KeyboardInterrupt(),
            ) as run_service,
        ):
            with self.assertRaises(KeyboardInterrupt):
                self.course_boot.boot()

        self.assertEqual(run_service.call_count, 1)


if __name__ == "__main__":
    unittest.main()
