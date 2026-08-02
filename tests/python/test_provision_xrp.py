import importlib.util
from pathlib import Path
import sys
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[2]


def load_script(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / (name + ".py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


INSTALLER = load_script("install_xrp_service")
XRP_WIFI = load_script("xrp_wifi")
with patch.dict(
    sys.modules,
    {"install_xrp_service": INSTALLER, "xrp_wifi": XRP_WIFI},
):
    PROVISION = load_script("provision_xrp")


class ProvisionXrpTest(unittest.TestCase):
    def test_one_command_path_uses_retrying_usb_operations(self):
        with (
            patch.object(PROVISION.xrp_wifi, "choose_port", return_value="/dev/test"),
            patch.object(
                PROVISION.xrp_wifi,
                "choose_credentials_path",
                return_value=Path("credentials"),
            ),
            patch.object(PROVISION.xrp_wifi, "read_password", return_value="secret"),
            patch.object(
                PROVISION.xrp_wifi,
                "configure_with_usb_retry",
                return_value={
                    "connected": True,
                    "address": "192.168.7.32",
                    "address_mode": "dhcp",
                },
            ) as configure,
            patch.object(
                PROVISION.install_xrp_service,
                "install_with_usb_retry",
                return_value={"address": "192.168.7.32", "files": [1, 2, 3]},
            ) as install,
            patch.object(
                PROVISION.install_xrp_service,
                "wait_for_service",
                return_value={
                    "robotName": "ucsb-xrp",
                    "courseRelease": "2026.08-dev.4",
                    "serviceVersion": "2026.08-dev.4",
                },
            ),
        ):
            result = PROVISION.provision()

        configure.assert_called_once()
        install.assert_called_once_with("/dev/test")
        self.assertEqual(result["courseRelease"], "2026.08-dev.4")
        self.assertEqual(result["installedFiles"], 3)


if __name__ == "__main__":
    unittest.main()
