import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "install_xrp_service", ROOT / "scripts/install_xrp_service.py"
)
INSTALLER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INSTALLER)


class InstallXrpServiceTest(unittest.TestCase):
    def test_raw_repl_entry_interrupts_a_running_service_first(self):
        class Serial:
            def __init__(self):
                self.writes = []

            def write(self, value):
                self.writes.append(value)

        class Transport:
            def __init__(self):
                self.serial = Serial()
                self.soft_reset = None

            def enter_raw_repl(self, soft_reset):
                self.soft_reset = soft_reset

        transport = Transport()
        INSTALLER.enter_raw_repl(transport)

        self.assertEqual(transport.serial.writes, [b"\r\x03\x03\x03"])
        self.assertFalse(transport.soft_reset)

    def test_reset_and_close_restarts_normal_boot_before_releasing_usb(self):
        class Transport:
            def __init__(self):
                self.commands = []
                self.closed = False

            def exec_raw_no_follow(self, code):
                self.commands.append(code)

            def close(self):
                self.closed = True

        transport = Transport()
        INSTALLER.reset_and_close(transport)

        self.assertEqual(transport.commands, ["import machine; machine.reset()"])
        self.assertTrue(transport.closed)

    def test_installation_set_has_service_course_reference_and_main(self):
        files = INSTALLER.installation_files()
        self.assertIn("/main.py", files)
        self.assertIn("/lib/ucsb_xrp_service/service.py", files)
        self.assertIn("/lib/ucsb_xrp/__init__.py", files)
        self.assertIn("/lib/ucsb_xrp_reference/__init__.mpy", files)
        self.assertTrue(all(path.is_file() for path in files.values()))

    def test_install_feed_uses_the_rp2350_watchdog_limit(self):
        class Transport:
            def __init__(self):
                self.code = []

            def exec(self, value):
                self.code.append(value)

        transport = Transport()
        INSTALLER.feed_install_watchdog(transport)

        self.assertEqual(INSTALLER.INSTALL_WATCHDOG_MS, 8388)
        self.assertIn("machine.WDT(timeout=8388).feed()", transport.code[0])

    def test_main_is_written_last(self):
        self.assertEqual(list(INSTALLER.installation_files())[-1], "/main.py")

    def test_matching_remote_file_is_left_unchanged(self):
        class Transport:
            def __init__(self):
                self.writes = []

            def fs_readfile(self, _path):
                return b"expected"

            def fs_writefile(self, path, data):
                self.writes.append((path, data))

        transport = Transport()

        self.assertTrue(
            INSTALLER._remote_file_matches(transport, "/main.py", b"expected")
        )
        self.assertEqual(transport.writes, [])

    def test_replacement_is_verified_before_becoming_active(self):
        class Transport:
            def __init__(self):
                self.files = {"/main.py": b"old"}
                self.operations = []

            def fs_writefile(self, path, data):
                self.operations.append(("write", path))
                self.files[path] = data

            def fs_readfile(self, path):
                self.operations.append(("read", path))
                return self.files[path]

            def exec(self, code):
                self.operations.append(("code", code))
                self.operations.append(("activate", "/main.py"))
                self.files["/main.py"] = self.files.pop("/main.py.commissioning")

        transport = Transport()
        INSTALLER._replace_remote_file(transport, "/main.py", b"new")

        self.assertEqual(transport.files["/main.py"], b"new")
        self.assertLess(
            transport.operations.index(("read", "/main.py.commissioning")),
            transport.operations.index(("activate", "/main.py")),
        )
        activation_code = next(
            operation[1]
            for operation in transport.operations
            if operation[0] == "code"
        )
        self.assertIn("os.rename", activation_code)
        self.assertNotIn("os.remove", activation_code)

    def test_parses_only_a_usable_post_restart_address(self):
        self.assertEqual(
            INSTALLER.parse_device_address(
                b"boot log\r\nUCSB_XRP_ADDRESS=192.168.7.32\r\n"
            ),
            "192.168.7.32",
        )
        self.assertIsNone(INSTALLER.parse_device_address(b"\r\n"))
        self.assertIsNone(INSTALLER.parse_device_address("0.0.0.0"))

    def test_post_restart_address_code_reads_saved_credentials_at_runtime(self):
        code = INSTALLER.device_address_code(5000)
        self.assertIn("/xrp_wifi.json", code)
        self.assertIn("UCSB_XRP_ADDRESS=", code)
        self.assertIn("machine.WDT(timeout=8388)", code)
        self.assertIn("watchdog.feed()", code)
        self.assertNotIn("password-value", code)

    def test_main_feeds_watchdog_before_importing_the_service(self):
        code = (ROOT / "device_service" / "main.py").read_text()
        self.assertLess(
            code.index("_watchdog.feed()"),
            code.index("from ucsb_xrp_service"),
        )
        self.assertIn("run(_watchdog)", code)

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
        sleep.assert_called_once_with(1.0)

    def test_readback_mismatch_is_not_retried(self):
        with patch.object(
            INSTALLER,
            "install",
            side_effect=INSTALLER.InstallError("readback mismatch for /main.py"),
        ) as install:
            with self.assertRaisesRegex(INSTALLER.InstallError, "readback mismatch"):
                INSTALLER.install_with_usb_retry("/dev/test")

        install.assert_called_once_with("/dev/test")


if __name__ == "__main__":
    unittest.main()
