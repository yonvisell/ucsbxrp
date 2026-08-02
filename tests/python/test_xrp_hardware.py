import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "xrp_hardware", ROOT / "scripts/xrp_hardware.py"
)
HARDWARE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(HARDWARE)


class HardwareHelpersTest(unittest.TestCase):
    def test_status_is_classified_and_secrets_are_redacted(self):
        status = HARDWARE.parse_status_text(
            "Version: 2.1.0\n"
            "\n"
            "Chip ID: abcd-1234\n"
            "WiFi Mode: AP\n"
            "AP SSID: XRP-abcd-1234\n"
            "AP PASS: xrp-wpilib\n"
            "IP Address: 192.168.42.1\n"
        )
        self.assertEqual(HARDWARE.classify_status(status), "xrp-wpilib")
        redacted = HARDWARE.redact_status(status)
        self.assertEqual(redacted["AP PASS"], "<redacted>")
        self.assertEqual(redacted["AP SSID"], "<unique-name-redacted>")
        self.assertNotIn("Chip ID", redacted)
        self.assertEqual(
            redacted["Chip ID SHA-256"],
            hashlib.sha256(b"abcd-1234").hexdigest(),
        )

    def test_firmware_verification_rejects_size_and_hash_changes(self):
        content = b"verified firmware bytes"
        release = {
            "micropython": {
                "asset": "firmware.uf2",
                "byte_size": len(content),
                "sha256": hashlib.sha256(content).hexdigest(),
            }
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "firmware.uf2"
            path.write_bytes(content)
            result = HARDWARE.verify_firmware(path, release)
            self.assertTrue(result["verified"])
            path.write_bytes(content + b"changed")
            with self.assertRaises(HARDWARE.HardwareError):
                HARDWARE.verify_firmware(path, release)

    def test_bootloader_requires_one_exact_connected_port(self):
        original_ports = HARDWARE.find_controller_ports
        try:
            HARDWARE.find_controller_ports = lambda: []
            with self.assertRaisesRegex(HARDWARE.HardwareError, "observed 0"):
                HARDWARE.enter_bootloader("/dev/does-not-matter")
        finally:
            HARDWARE.find_controller_ports = original_ports

    def test_probe_classifies_micropython_usb_without_status_volume(self):
        class Port:
            device = "/dev/cu.test"
            manufacturer = "MicroPython"
            product = "Board in FS mode"
            vid = HARDWARE.EXPECTED_VID
            pid = HARDWARE.EXPECTED_PID
            serial_number = "not-committed"

        original_ports = HARDWARE.find_controller_ports
        original_status = HARDWARE.read_status_file
        original_volumes = HARDWARE.find_boot_volumes
        try:
            HARDWARE.find_controller_ports = lambda: [Port()]
            HARDWARE.read_status_file = lambda: (None, {})
            HARDWARE.find_boot_volumes = lambda: []
            result = HARDWARE.probe()
        finally:
            HARDWARE.find_controller_ports = original_ports
            HARDWARE.read_status_file = original_status
            HARDWARE.find_boot_volumes = original_volumes

        self.assertEqual(
            result["runtime_classification"], "micropython-usb-device"
        )


if __name__ == "__main__":
    unittest.main()
