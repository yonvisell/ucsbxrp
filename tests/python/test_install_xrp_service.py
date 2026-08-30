import hashlib
import importlib.util
import json
from pathlib import Path
import types
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "install_xrp_service", ROOT / "scripts/install_xrp_service.py"
)
INSTALLER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INSTALLER)


class MemoryTransport:
    """Small persistent device model for installer transaction tests."""

    def __init__(self, files=None):
        self.files = dict(files or {})
        self.operations = []
        self.serial = types.SimpleNamespace(write=self._serial_write)

    def _serial_write(self, value):
        self.operations.append(("serial", value))

    def enter_raw_repl(self, soft_reset):
        self.operations.append(("raw-repl", soft_reset))

    def fs_readfile(self, path):
        self.operations.append(("read", path))
        if path not in self.files:
            raise OSError(path)
        return self.files[path]

    def fs_writefile(self, path, data):
        self.operations.append(("write", path))
        self.files[path] = data

    def exec(self, code):
        self.operations.append(("exec", code))
        return b""

    def exec_raw_no_follow(self, code):
        self.operations.append(("reset", code))

    def close(self):
        self.operations.append(("close", None))


def direct_hashes(transport, paths):
    return {
        path: (
            hashlib.sha256(transport.files[path]).hexdigest()
            if path in transport.files
            else None
        )
        for path in paths
    }


def direct_replace(transport, path, data):
    transport.operations.append(("replace", path))
    transport.files[path] = data


def direct_remove(transport, path):
    transport.operations.append(("remove", path))
    transport.files.pop(path, None)


class InstallXrpServiceTest(unittest.TestCase):
    def test_raw_repl_entry_interrupts_a_running_service_first(self):
        transport = MemoryTransport()
        with patch.object(INSTALLER.time, "sleep"):
            INSTALLER.enter_raw_repl(transport)
        self.assertEqual(
            transport.operations[:2],
            [("serial", b"\r\x03\x03\x03"), ("raw-repl", True)],
        )

    def test_reset_and_close_restarts_normal_boot_before_releasing_usb(self):
        transport = MemoryTransport()
        INSTALLER.reset_and_close(transport)
        self.assertEqual(
            transport.operations,
            [
                ("reset", "import machine; machine.reset()"),
                ("close", None),
            ],
        )

    def test_release_files_have_stable_boot_and_slot_relative_runtime(self):
        boot = INSTALLER.bootstrap_files()
        runtime = INSTALLER.runtime_files()
        installed = INSTALLER.installation_files("b")

        self.assertEqual(set(boot), {"/main.py", "/course_boot.py"})
        self.assertEqual(list(boot), ["/course_boot.py", "/main.py"])
        self.assertIn("lib/XRPLib/board.py", runtime)
        self.assertIn("lib/XRPLib/encoded_motor.py", runtime)
        self.assertIn("lib/phew/server.py", runtime)
        self.assertIn("lib/ucsb_xrp_service/service.py", runtime)
        self.assertIn("lib/ucsb_xrp/__init__.py", runtime)
        self.assertIn("lib/ucsb_xrp_reference/__init__.mpy", runtime)
        self.assertTrue(all(not path.startswith("/") for path in runtime))
        self.assertIn(
            "/course_runtime/slots/b/lib/ucsb_xrp_service/service.py",
            installed,
        )
        self.assertTrue(all(path.is_file() for path in installed.values()))

    def test_runtime_manifest_is_canonical_and_complete(self):
        manifest = INSTALLER.runtime_manifest()
        data = INSTALLER.canonical_json_bytes(manifest)
        self.assertEqual(manifest["releaseId"], "2026.08-dev.46")
        self.assertEqual(manifest["releaseSequence"], 46)
        self.assertEqual(manifest["compatibility"]["protocolVersion"], 1)
        self.assertTrue(data.endswith(b"\n"))
        self.assertNotIn(b" ", data)
        self.assertEqual(
            {entry["path"] for entry in manifest["files"]},
            set(INSTALLER.runtime_files()),
        )

    def test_replacement_is_verified_before_becoming_active(self):
        class HashingTransport(MemoryTransport):
            def exec(self, code):
                self.operations.append(("exec", code))
                if INSTALLER.HASH_PREFIX in code:
                    path = max((path for path in self.files if path in code), key=len)
                    digest = hashlib.sha256(self.files[path]).hexdigest()
                    return (
                        INSTALLER.HASH_PREFIX + json.dumps({path: digest}) + "\r\n"
                    ).encode()
                if "os.rename" in code:
                    temporary = "/main.py.commissioning"
                    self.files["/main.py"] = self.files.pop(temporary)
                    self.operations.append(("activate", "/main.py"))
                return b""

        transport = HashingTransport({"/main.py": b"old"})
        INSTALLER._replace_remote_file(transport, "/main.py", b"new")

        self.assertEqual(transport.files["/main.py"], b"new")
        activation = transport.operations.index(("activate", "/main.py"))
        temporary_check = next(
            index
            for index, operation in enumerate(transport.operations)
            if operation[0] == "exec"
            and "/main.py.commissioning" in operation[1]
            and INSTALLER.HASH_PREFIX in operation[1]
        )
        self.assertLess(temporary_check, activation)

    def test_remote_hashes_return_digests_without_transferring_file_bytes(self):
        class Transport:
            def exec(self, code):
                self.code = code
                return (INSTALLER.HASH_PREFIX + '{"/main.py":"abc123"}\r\n').encode()

        transport = Transport()
        self.assertEqual(
            INSTALLER._remote_hashes(transport, ["/main.py"]),
            {"/main.py": "abc123"},
        )
        self.assertIn("hashlib.sha256", transport.code)
        self.assertIn("f.read(1024)", transport.code)

    def test_cli_migrates_legacy_install_and_publishes_activation_last(self):
        transport = MemoryTransport(
            {
                "/lib/ucsb_xrp_service/service.py": b"legacy service",
                "/course_projects/student/main.py": b"student work",
                "/xrp_wifi.json": b'{"mode":"station","ssid":"Pink"}',
            }
        )
        serial_module = types.SimpleNamespace(SerialTransport=lambda *_args, **_kw: transport)
        with (
            patch.dict("sys.modules", {"mpremote.transport_serial": serial_module}),
            patch.object(INSTALLER.time, "sleep"),
            patch.object(INSTALLER, "_remote_hashes", side_effect=direct_hashes),
            patch.object(INSTALLER, "_replace_remote_file", side_effect=direct_replace),
            patch.object(INSTALLER, "_remove_remote_file", side_effect=direct_remove),
            patch.object(INSTALLER, "_verify_staged_runtime"),
        ):
            result = INSTALLER.install("/dev/test", discover_address=False)

        activation = result["activation"]
        self.assertEqual(activation["generation"], 1)
        self.assertEqual(activation["slot"], "a")
        self.assertEqual(activation["releaseSequence"], 46)
        active_path = "/course_runtime/active.0.json"
        self.assertEqual(json.loads(transport.files[active_path]), activation)
        manifest_path = "/course_runtime/slots/a/runtime-manifest.json"
        self.assertEqual(
            hashlib.sha256(transport.files[manifest_path]).hexdigest(),
            activation["runtimeManifestSha256"],
        )
        replacements = [
            path for operation, path in transport.operations if operation == "replace"
        ]
        self.assertEqual(replacements[-1], active_path)
        self.assertLess(replacements.index(manifest_path), replacements.index("/course_boot.py"))
        self.assertLess(replacements.index("/course_boot.py"), replacements.index("/main.py"))
        self.assertLess(replacements.index("/main.py"), replacements.index(active_path))
        self.assertEqual(
            transport.files["/course_projects/student/main.py"], b"student work"
        )
        self.assertEqual(
            transport.files["/xrp_wifi.json"],
            b'{"mode":"station","ssid":"Pink"}',
        )
        self.assertEqual(
            transport.files["/lib/ucsb_xrp_service/service.py"], b"legacy service"
        )

    def test_confirmed_matching_release_is_idempotent(self):
        transport = MemoryTransport()
        serial_module = types.SimpleNamespace(SerialTransport=lambda *_args, **_kw: transport)
        patches = (
            patch.dict("sys.modules", {"mpremote.transport_serial": serial_module}),
            patch.object(INSTALLER.time, "sleep"),
            patch.object(INSTALLER, "_remote_hashes", side_effect=direct_hashes),
            patch.object(INSTALLER, "_replace_remote_file", side_effect=direct_replace),
            patch.object(INSTALLER, "_remove_remote_file", side_effect=direct_remove),
            patch.object(INSTALLER, "_verify_staged_runtime"),
        )
        with patches[0], patches[1], patches[2], patches[3], patches[4], patches[5]:
            first = INSTALLER.install("/dev/test", discover_address=False)
            marker = {
                key: first["activation"][key]
                for key in (
                    "generation",
                    "slot",
                    "releaseId",
                    "releaseSequence",
                    "runtimeManifestSha256",
                )
            }
            transport.files[INSTALLER.CONFIRMED_RECORD] = INSTALLER.canonical_json_bytes(
                marker
            )
            activation_replacements = len(
                [
                    path
                    for operation, path in transport.operations
                    if operation == "replace" and path in INSTALLER.ACTIVE_RECORDS
                ]
            )
            second = INSTALLER.install("/dev/test", discover_address=False)

        self.assertEqual(second["activation"]["generation"], 1)
        self.assertEqual(second["installed_count"], 0)
        self.assertEqual(
            len(
                [
                    path
                    for operation, path in transport.operations
                    if operation == "replace" and path in INSTALLER.ACTIVE_RECORDS
                ]
            ),
            activation_replacements,
        )

    def test_repair_stages_the_slot_opposite_the_confirmed_runtime(self):
        transport = MemoryTransport()
        serial_module = types.SimpleNamespace(SerialTransport=lambda *_args, **_kw: transport)
        with (
            patch.dict("sys.modules", {"mpremote.transport_serial": serial_module}),
            patch.object(INSTALLER.time, "sleep"),
            patch.object(INSTALLER, "_remote_hashes", side_effect=direct_hashes),
            patch.object(INSTALLER, "_replace_remote_file", side_effect=direct_replace),
            patch.object(INSTALLER, "_remove_remote_file", side_effect=direct_remove),
            patch.object(INSTALLER, "_verify_staged_runtime"),
        ):
            first = INSTALLER.install("/dev/test", discover_address=False)
            marker = {
                key: first["activation"][key]
                for key in (
                    "generation",
                    "slot",
                    "releaseId",
                    "releaseSequence",
                    "runtimeManifestSha256",
                )
            }
            transport.files[INSTALLER.CONFIRMED_RECORD] = INSTALLER.canonical_json_bytes(
                marker
            )
            corrupt_path = "/course_runtime/slots/a/lib/ucsb_xrp_service/service.py"
            transport.files[corrupt_path] = b"corrupt"
            second = INSTALLER.install("/dev/test", discover_address=False)

        self.assertEqual(second["activation"]["generation"], 2)
        self.assertEqual(second["activation"]["slot"], "b")
        self.assertIn("/course_runtime/active.1.json", transport.files)
        self.assertEqual(transport.files[corrupt_path], b"corrupt")

    def test_failed_stage_never_publishes_activation(self):
        transport = MemoryTransport(
            {
                "/course_projects/student/main.py": b"student work",
                "/xrp_wifi.json": b'{"mode":"access_point"}',
            }
        )
        serial_module = types.SimpleNamespace(SerialTransport=lambda *_args, **_kw: transport)
        with (
            patch.dict("sys.modules", {"mpremote.transport_serial": serial_module}),
            patch.object(INSTALLER.time, "sleep"),
            patch.object(INSTALLER, "_remote_hashes", side_effect=direct_hashes),
            patch.object(INSTALLER, "_replace_remote_file", side_effect=direct_replace),
            patch.object(INSTALLER, "_remove_remote_file", side_effect=direct_remove),
            patch.object(
                INSTALLER,
                "_verify_staged_runtime",
                side_effect=INSTALLER.InstallError("staged import failed"),
            ),
        ):
            with self.assertRaisesRegex(INSTALLER.InstallError, "staged import failed"):
                INSTALLER.install("/dev/test", discover_address=False)

        self.assertFalse(any(path in transport.files for path in INSTALLER.ACTIVE_RECORDS))
        self.assertEqual(
            transport.files["/course_projects/student/main.py"], b"student work"
        )
        self.assertEqual(
            transport.files["/xrp_wifi.json"], b'{"mode":"access_point"}'
        )

    def test_device_address_probe_uses_stable_bootstrap_selection(self):
        code = INSTALLER.device_address_code(5000)
        self.assertIn("course_boot.prepare_runtime_imports()", code)
        self.assertIn("/xrp_wifi.json", code)
        self.assertIn("UCSB_XRP_ADDRESS=", code)
        self.assertIn("machine.WDT(timeout=8388)", code)

    def test_network_address_is_read_before_the_trial_runtime_is_reset(self):
        class AddressTransport(MemoryTransport):
            def exec(self, code):
                self.operations.append(("exec", code))
                if INSTALLER.ADDRESS_PREFIX in code:
                    return b"UCSB_XRP_ADDRESS=192.168.7.25\r\n"
                return b""

        transport = AddressTransport()
        serial_module = types.SimpleNamespace(
            SerialTransport=lambda *_args, **_kw: transport
        )
        with (
            patch.dict("sys.modules", {"mpremote.transport_serial": serial_module}),
            patch.object(INSTALLER.time, "sleep"),
            patch.object(INSTALLER, "_remote_hashes", side_effect=direct_hashes),
            patch.object(INSTALLER, "_replace_remote_file", side_effect=direct_replace),
            patch.object(INSTALLER, "_remove_remote_file", side_effect=direct_remove),
            patch.object(INSTALLER, "_verify_staged_runtime"),
        ):
            result = INSTALLER.install("/dev/test", discover_address=True)

        address_index = next(
            index
            for index, operation in enumerate(transport.operations)
            if operation[0] == "exec" and INSTALLER.ADDRESS_PREFIX in operation[1]
        )
        reset_index = next(
            index
            for index, operation in enumerate(transport.operations)
            if operation[0] == "reset"
        )
        self.assertEqual(result["address"], "192.168.7.25")
        self.assertLess(address_index, reset_index)

    def test_installer_rejects_a_newer_valid_runtime_before_staging(self):
        manifest_data = b'{"releaseId":"future-release"}\n'
        digest = hashlib.sha256(manifest_data).hexdigest()
        record = {
            "schemaVersion": 1,
            "generation": 8,
            "slot": "a",
            "releaseId": "future-release",
            "releaseSequence": 47,
            "runtimeManifestSha256": digest,
        }
        transport = MemoryTransport(
            {
                "/course_runtime/slots/a/runtime-manifest.json": manifest_data,
                "/course_runtime/active.1.json": INSTALLER.canonical_json_bytes(
                    record
                ),
            }
        )
        serial_module = types.SimpleNamespace(
            SerialTransport=lambda *_args, **_kw: transport
        )
        with (
            patch.dict("sys.modules", {"mpremote.transport_serial": serial_module}),
            patch.object(INSTALLER.time, "sleep"),
            patch.object(INSTALLER, "_remote_hashes", side_effect=direct_hashes),
            patch.object(INSTALLER, "_replace_remote_file", side_effect=direct_replace),
            patch.object(INSTALLER, "_remove_remote_file", side_effect=direct_remove),
        ):
            with self.assertRaisesRegex(INSTALLER.InstallError, "newer than"):
                INSTALLER.install("/dev/test", discover_address=False)

        self.assertFalse(
            any(
                operation == "replace"
                for operation, _path in transport.operations
            )
        )

    def test_network_verification_requires_the_activated_runtime(self):
        expected = {
            "releaseId": "2026.08-dev.23",
            "releaseSequence": 23,
            "runtimeManifestSha256": "a" * 64,
        }

        class Response:
            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return False

            def read(self):
                return json.dumps(
                    {
                        "protocol": 1,
                        "address": "192.168.7.25",
                        "runtimeRelease": "2026.08-dev.23",
                        "runtimeReleaseSequence": 23,
                        "runtimeManifestSha256": "a" * 64,
                    }
                ).encode()

        with patch.object(INSTALLER, "urlopen", return_value=Response()):
            info = INSTALLER.wait_for_service(
                "192.168.7.25",
                timeout_s=1,
                expected_activation=expected,
            )
        self.assertEqual(info["runtimeManifestSha256"], "a" * 64)

    def test_parses_only_a_usable_post_restart_address(self):
        self.assertEqual(
            INSTALLER.parse_device_address(
                b"boot log\r\nUCSB_XRP_ADDRESS=192.168.7.32\r\n"
            ),
            "192.168.7.32",
        )
        self.assertIsNone(INSTALLER.parse_device_address(b"\r\n"))
        self.assertIsNone(INSTALLER.parse_device_address("0.0.0.0"))

    def test_transient_usb_install_failure_retries_without_user_action(self):
        expected = {"address": "192.168.7.32", "files": []}
        with (
            patch.object(
                INSTALLER,
                "install",
                side_effect=[
                    INSTALLER.InstallError(
                        "USB service installation failed: device re-enumerated"
                    ),
                    expected,
                ],
            ) as install,
            patch.object(INSTALLER.time, "sleep") as sleep,
        ):
            result = INSTALLER.install_with_usb_retry("/dev/test")

        self.assertEqual(result, expected)
        self.assertEqual(install.call_count, 2)
        install.assert_called_with("/dev/test", discover_address=True)
        sleep.assert_called_once_with(1.0)

    def test_readback_mismatch_is_not_retried(self):
        with patch.object(
            INSTALLER,
            "install",
            side_effect=INSTALLER.InstallError("readback mismatch for /main.py"),
        ) as install:
            with self.assertRaisesRegex(INSTALLER.InstallError, "readback mismatch"):
                INSTALLER.install_with_usb_retry("/dev/test")
        install.assert_called_once_with("/dev/test", discover_address=True)


if __name__ == "__main__":
    unittest.main()
