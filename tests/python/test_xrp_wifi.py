import importlib.util
from pathlib import Path
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("xrp_wifi", ROOT / "scripts/xrp_wifi.py")
XRP_WIFI = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(XRP_WIFI)


class XrpWifiTest(unittest.TestCase):
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
        XRP_WIFI.enter_raw_repl(transport, soft_reset=True)

        self.assertEqual(transport.serial.writes, [b"\r\x03\x03\x03"])
        self.assertTrue(transport.soft_reset)

    def test_reads_password_only_file_without_echoing_it(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "credentials.txt"
            path.write_text("not-a-real-password\n", encoding="utf-8")
            self.assertEqual(
                XRP_WIFI.read_password(path, "Pink"), "not-a-real-password"
            )

    def test_reads_named_network_from_small_details_file(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "Details.md"
            path.write_text(
                "# Local networks\nBLUE: ignored\nPink = selected\n",
                encoding="utf-8",
            )
            self.assertEqual(XRP_WIFI.read_password(path, "pink"), "selected")

    def test_rejects_ambiguous_credentials(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "Details.md"
            path.write_text("first\nsecond\n", encoding="utf-8")
            with self.assertRaises(XRP_WIFI.WifiSetupError):
                XRP_WIFI.read_password(path, "Pink")

    def test_parses_only_prefixed_device_result(self):
        output = b"boot log\nUCSB_XRP_WIFI={\"connected\":true,\"address\":\"1.2.3.4\"}\n"
        self.assertEqual(
            XRP_WIFI.parse_result(output),
            {"connected": True, "address": "1.2.3.4"},
        )

    def test_builds_optional_static_network_without_exposing_it_in_code(self):
        config = XRP_WIFI.make_device_config(
            "Pink",
            "not-a-real-password",
            "ucsb-xrp",
            static_address="192.168.7.30",
            gateway="192.168.7.1",
        )
        self.assertEqual(
            config["ifconfig"],
            ["192.168.7.30", "255.255.255.0", "192.168.7.1", "192.168.7.1"],
        )
        self.assertNotIn("not-a-real-password", XRP_WIFI.device_connect_code(5000))

    def test_static_network_requires_a_gateway(self):
        with self.assertRaises(XRP_WIFI.WifiSetupError):
            XRP_WIFI.make_device_config(
                "Pink",
                "not-a-real-password",
                "ucsb-xrp",
                static_address="192.168.7.30",
            )

    def test_device_code_never_embeds_a_password(self):
        code = XRP_WIFI.device_connect_code(5000)
        self.assertIn(XRP_WIFI.DEVICE_CONFIG, code)
        self.assertNotIn("password-value", code)
        self.assertIn("UCSB_XRP_WIFI=", code)
        self.assertIn("waiting_for_ip", code)

    def test_device_execution_waits_longer_than_the_association_deadline(self):
        class Transport:
            def __init__(self):
                self.timeout = None

            def exec_raw(self, _code, timeout):
                self.timeout = timeout
                return b'UCSB_XRP_WIFI={"connected":true,"address":"1.2.3.4"}\n', b""

        transport = Transport()
        result = XRP_WIFI.execute_device_connect(transport, timeout_s=20)

        self.assertEqual(transport.timeout, 25)
        self.assertEqual(result["address"], "1.2.3.4")


if __name__ == "__main__":
    unittest.main()
