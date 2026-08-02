import importlib.util
from pathlib import Path
import unittest


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

    def test_installation_set_has_service_course_reference_and_main(self):
        files = INSTALLER.installation_files()
        self.assertIn("/main.py", files)
        self.assertIn("/lib/ucsb_xrp_service/service.py", files)
        self.assertIn("/lib/ucsb_xrp/__init__.py", files)
        self.assertIn("/lib/ucsb_xrp_reference/__init__.mpy", files)
        self.assertTrue(all(path.is_file() for path in files.values()))

    def test_main_is_written_last(self):
        self.assertEqual(list(INSTALLER.installation_files())[-1], "/main.py")


if __name__ == "__main__":
    unittest.main()
