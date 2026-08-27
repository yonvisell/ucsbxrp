import importlib.util
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "device_networking",
    ROOT / "device_service/ucsb_xrp_service/networking.py",
)
NETWORKING = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(NETWORKING)


class FakeTime:
    def __init__(self):
        self.now = 0

    def ticks_ms(self):
        return self.now

    def ticks_add(self, value, delta):
        return value + delta

    def ticks_diff(self, left, right):
        return left - right

    def sleep_ms(self, delay):
        self.now += delay


class FakeWlan:
    SEC_WPA_WPA2 = 4194310

    def __init__(self, interface, station_connects=True):
        self.interface = interface
        self.station_connects = station_connects
        self._active = False
        self._connected = False
        self._settings = {
            "mac": b"\x28\xcd\xc1\x19\xaa\x71",
            "ssid": "",
        }
        self._ifconfig = ("0.0.0.0", "0.0.0.0", "0.0.0.0", "0.0.0.0")
        self.connected_with = None
        self.events = []

    def active(self, value=None):
        if value is None:
            return self._active
        self._active = bool(value)
        self.events.append(("active", self._active))

    def disconnect(self):
        self._connected = False
        self.events.append(("disconnect",))

    def connect(self, ssid, password):
        self.connected_with = (ssid, password)
        self._connected = self.station_connects
        self._settings["ssid"] = ssid
        if self._connected:
            self._ifconfig = (
                "192.168.7.34",
                "255.255.255.0",
                "192.168.7.1",
                "192.168.7.1",
            )

    def isconnected(self):
        return self._connected

    def status(self):
        return 3 if self._connected else -2

    def config(self, name=None, **settings):
        if settings:
            self._settings.update(settings)
            self.events.append(("config", dict(settings)))
            return None
        return self._settings[name]

    def ifconfig(self, value=None):
        if value is not None:
            self._ifconfig = tuple(value)
            self.events.append(("ifconfig", self._ifconfig))
        return self._ifconfig


class FakeNetwork:
    STA_IF = 0
    AP_IF = 1
    STAT_CONNECTING = 1
    STAT_GOT_IP = 3
    STAT_NO_AP_FOUND = -2
    STAT_WRONG_PASSWORD = -3
    STAT_CONNECT_FAIL = -1
    WLAN = FakeWlan

    def __init__(self, station_connects=True):
        self.interfaces = {
            self.STA_IF: FakeWlan(self.STA_IF, station_connects),
            self.AP_IF: FakeWlan(self.AP_IF, station_connects),
        }
        self.current_hostname = None

    def hostname(self, value=None):
        if value is not None:
            self.current_hostname = value
        return self.current_hostname

    def WLAN(self, interface):
        return self.interfaces[interface]


class Watchdog:
    def __init__(self):
        self.feeds = 0

    def feed(self):
        self.feeds += 1


class DeviceNetworkingTest(unittest.TestCase):
    def test_legacy_flat_configuration_remains_station_mode(self):
        config = NETWORKING.normalize_config(
            {"hostname": "ucsb-xrp", "ssid": "Pink", "password": "secret"}
        )

        self.assertEqual(config["mode"], NETWORKING.MODE_STATION)
        self.assertEqual(config["station"]["ssid"], "Pink")
        self.assertTrue(config["fallback_to_access_point"])

    def test_dev11_hotspot_profile_moves_to_the_native_dhcp_subnet(self):
        config = NETWORKING.normalize_config(
            {
                "version": 2,
                "mode": "access_point",
                "hostname": "ucsb-xrp",
                "access_point": {
                    "password": "ucsb-xrp",
                    "ifconfig": [
                        "192.168.42.1",
                        "255.255.255.0",
                        "192.168.42.1",
                        "192.168.42.1",
                    ],
                },
            }
        )

        self.assertEqual(
            config["access_point"]["ifconfig"],
            ["192.168.4.1", "255.255.255.0", "192.168.4.1", "192.168.4.1"],
        )

    def test_station_profile_connects_without_exposing_credentials(self):
        fake_network = FakeNetwork(station_connects=True)
        watchdog = Watchdog()
        result = NETWORKING.activate_network(
            {
                "version": 2,
                "mode": "station",
                "hostname": "ucsb-xrp",
                "station": {"ssid": "Pink", "password": "secret"},
                "access_point": {"password": "ucsb-xrp"},
            },
            network_module=fake_network,
            time_module=FakeTime(),
            watchdog=watchdog,
        )

        self.assertEqual(result["mode"], "station")
        self.assertTrue(result["ready"])
        self.assertEqual(
            fake_network.interfaces[0].connected_with, ("Pink", "secret")
        )
        self.assertNotIn("password", result)
        self.assertGreater(watchdog.feeds, 0)

    def test_station_association_can_begin_before_other_boot_work(self):
        fake_network = FakeNetwork(station_connects=True)
        config = {
            "version": 2,
            "mode": "station",
            "hostname": "ucsb-xrp",
            "station": {"ssid": "Pink", "password": "secret"},
            "access_point": {"password": "ucsb-xrp"},
        }

        activation = NETWORKING.begin_network_activation(
            config,
            network_module=fake_network,
        )
        self.assertEqual(
            fake_network.interfaces[0].connected_with,
            ("Pink", "secret"),
        )
        result = NETWORKING.finish_network_activation(
            activation,
            time_module=FakeTime(),
        )
        self.assertTrue(result["ready"])
        self.assertEqual(result["address"], "192.168.7.34")

    def test_access_point_uses_unique_name_fixed_address_and_distributed_channel(self):
        fake_network = FakeNetwork()
        result = NETWORKING.activate_network(
            {
                "version": 2,
                "mode": "access_point",
                "hostname": "ucsb-xrp",
                "access_point": {"password": "ucsb-xrp"},
            },
            network_module=fake_network,
            time_module=FakeTime(),
        )

        self.assertEqual(result["ssid"], "UCSB-XRP-AA71")
        self.assertEqual(result["address"], "192.168.4.1")
        self.assertIn(result["channel"], (1, 6, 11))
        ap_events = fake_network.interfaces[1].events
        self.assertLess(
            next(i for i, event in enumerate(ap_events) if event[0] == "active" and event[1]),
            next(i for i, event in enumerate(ap_events) if event[0] == "ifconfig"),
        )

    def test_station_failure_falls_back_to_the_recoverable_access_point(self):
        fake_network = FakeNetwork(station_connects=False)
        result = NETWORKING.activate_network(
            {
                "version": 2,
                "mode": "station",
                "hostname": "ucsb-xrp",
                "station": {"ssid": "missing", "password": "secret"},
                "access_point": {"password": "ucsb-xrp"},
                "fallback_to_access_point": True,
            },
            timeout_ms=300,
            network_module=fake_network,
            time_module=FakeTime(),
        )

        self.assertEqual(result["requested_mode"], "station")
        self.assertEqual(result["mode"], "access_point")
        self.assertTrue(result["fallback"])
        self.assertEqual(result["station_status"], "network_not_found")

    def test_changing_station_profile_disconnects_the_existing_association(self):
        fake_network = FakeNetwork(station_connects=True)
        station = fake_network.interfaces[0]
        station._active = True
        station._connected = True
        station._settings["ssid"] = "Pink"

        result = NETWORKING.activate_network(
            {
                "version": 2,
                "mode": "station",
                "hostname": "ucsb-xrp",
                "station": {"ssid": "Course LAN", "password": "secret"},
                "access_point": {"password": "ucsb-xrp"},
            },
            network_module=fake_network,
            time_module=FakeTime(),
        )

        self.assertIn(("disconnect",), station.events)
        self.assertEqual(station.connected_with, ("Course LAN", "secret"))
        self.assertEqual(result["ssid"], "Course LAN")

    def test_public_status_never_contains_a_password(self):
        public = NETWORKING.public_network_state(
            {
                "mode": "access_point",
                "ssid": "UCSB-XRP-AA71",
                "address": "192.168.4.1",
                "password": "secret",
            }
        )
        self.assertNotIn("password", public)


if __name__ == "__main__":
    unittest.main()
