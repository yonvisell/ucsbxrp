import asyncio
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import time
import types
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[2]
SERVICE_DIR = ROOT / "device_service/ucsb_xrp_service"


class FakeLoop:
    def __init__(self):
        self.tasks = []

    def create_task(self, coroutine):
        self.tasks.append(coroutine)


class FakeServer:
    class Response:
        def __init__(self, body, status=200, headers=None):
            self.body = body
            self.status = status
            self.headers = headers or {}

    def __init__(self):
        self.loop = FakeLoop()
        self.routes = {}

    def route(self, path, methods=None):
        def register(function):
            self.routes[(path, tuple(methods or ("GET",)))] = function
            return function

        return register

    def catchall(self):
        return self.route("*")

    def run(self, **_values):
        pass


class DeviceServiceRuntimeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = FakeServer()
        cls.thread_calls = []
        cls.live_updates = []
        cls.managed_start_updates = []

        fake_thread = types.ModuleType("_thread")
        fake_thread.start_new_thread = lambda function, args: cls.thread_calls.append(
            (function, args)
        )
        fake_machine = types.ModuleType("machine")
        fake_machine.reset = lambda: None
        fake_machine.WDT = lambda timeout: types.SimpleNamespace(feed=lambda: None)
        fake_network = types.ModuleType("network")
        fake_network.STA_IF = 0
        fake_network.WLAN = lambda _interface: None
        fake_phew = types.ModuleType("phew")
        fake_phew.server = cls.server
        fake_uasyncio = types.ModuleType("uasyncio")

        async def sleep_ms(_delay):
            await asyncio.sleep(0)

        fake_uasyncio.sleep_ms = sleep_ms
        fake_course_telemetry = types.ModuleType("ucsb_xrp._telemetry")
        fake_course_telemetry.clear_state = lambda: None
        fake_course_live = types.ModuleType("ucsb_xrp.live")
        fake_course_live.clear = lambda: None
        fake_course_live.runtime_snapshot_json = (
            lambda: '{"revision":0,"parameters":[],"watches":[]}'
        )
        fake_course_live.queue_update = lambda name, value: cls.live_updates.append(
            (name, value)
        )
        fake_course_robot = types.ModuleType("ucsb_xrp.robot")
        fake_course_robot._set_managed_start = (
            lambda enabled: cls.managed_start_updates.append(enabled)
        )
        fake_ucsb_xrp = types.ModuleType("ucsb_xrp")
        fake_ucsb_xrp.__path__ = []

        package = types.ModuleType("ucsb_xrp_service")
        package.__path__ = [str(SERVICE_DIR)]
        protocol_spec = importlib.util.spec_from_file_location(
            "ucsb_xrp_service.protocol", SERVICE_DIR / "protocol.py"
        )
        protocol = importlib.util.module_from_spec(protocol_spec)

        cls.module_patch = patch.dict(
            sys.modules,
            {
                "_thread": fake_thread,
                "machine": fake_machine,
                "network": fake_network,
                "phew": fake_phew,
                "uasyncio": fake_uasyncio,
                "ucsb_xrp": fake_ucsb_xrp,
                "ucsb_xrp._telemetry": fake_course_telemetry,
                "ucsb_xrp.live": fake_course_live,
                "ucsb_xrp.robot": fake_course_robot,
                "ucsb_xrp_service": package,
                "ucsb_xrp_service.protocol": protocol,
            },
        )
        cls.module_patch.start()
        protocol_spec.loader.exec_module(protocol)

        cls.time_patches = [
            patch.object(time, "ticks_ms", return_value=100, create=True),
            patch.object(time, "ticks_us", return_value=100000, create=True),
            patch.object(time, "ticks_add", side_effect=lambda value, delta: value + delta, create=True),
            patch.object(time, "ticks_diff", side_effect=lambda left, right: left - right, create=True),
            patch.object(time, "sleep_ms", return_value=None, create=True),
        ]
        for time_patch in cls.time_patches:
            time_patch.start()

        service_spec = importlib.util.spec_from_file_location(
            "ucsb_xrp_service.service", SERVICE_DIR / "service.py"
        )
        cls.service = importlib.util.module_from_spec(service_spec)
        sys.modules[service_spec.name] = cls.service
        service_spec.loader.exec_module(cls.service)

    @classmethod
    def tearDownClass(cls):
        for coroutine in cls.server.loop.tasks:
            coroutine.close()
        for time_patch in reversed(cls.time_patches):
            time_patch.stop()
        cls.module_patch.stop()

    def setUp(self):
        self.server.loop.tasks.clear()
        self.thread_calls.clear()
        self.live_updates.clear()
        self.managed_start_updates.clear()
        self.service._thread_active = False
        self.service._launch_pending = False
        self.service._run_id = 0
        self.service._logs.clear()
        self.service._last_reply_by_id.clear()
        self.service._reply_order.clear()
        self.service._last_hardware = None
        self.service._last_sample = None

    def test_run_reply_precedes_second_core_launch(self):
        with tempfile.TemporaryDirectory() as project_dir:
            Path(project_dir, "main.py").write_text("print('ready')\n")
            manifest = {
                "name": "Test project",
                "entrypoint": "main.py",
                "files": ["main.py"],
                "revision": "test-revision",
            }
            self.service._read_manifest = lambda: manifest
            self.service._active_slot_path = lambda: project_dir
            self.service._clear_project_modules = lambda _manifest: None
            self.service._stop_motors = lambda: None

            response = self.service.run_project(
                types.SimpleNamespace(data={"requestId": "runtime-test"})
            )
            reply = json.loads(response.body.decode("utf-8"))

            self.assertEqual(reply["result"]["detail"], "Starting main.py")
            self.assertEqual(self.service._state, "loading")
            self.assertEqual(self.thread_calls, [])
            self.assertEqual(len(self.server.loop.tasks), 1)

            asyncio.run(self.server.loop.tasks.pop())
            self.assertEqual(self.service._state, "running")
            self.assertEqual(len(self.thread_calls), 1)

    def test_project_runner_bypasses_then_restores_user_button_start(self):
        with tempfile.TemporaryDirectory() as project_dir:
            self.service._stop_motors = lambda: None

            self.service._project_runner(
                project_dir,
                "main.py",
                compile("pass\n", "main.py", "exec"),
                [],
                0,
            )

        self.assertEqual(self.managed_start_updates, [True, False])

    def test_watchdog_interval_fits_the_rp2350_limit(self):
        self.assertGreaterEqual(self.service.SERVICE_WATCHDOG_MS, 5000)
        self.assertLessEqual(self.service.SERVICE_WATCHDOG_MS, 8388)

        class StoppingWatchdog:
            def __init__(self):
                self.feeds = 0

            def feed(self):
                self.feeds += 1
                if self.feeds == 2:
                    raise RuntimeError("stop test loop")

        watchdog = StoppingWatchdog()
        with self.assertRaisesRegex(RuntimeError, "stop test loop"):
            asyncio.run(self.service._feed_service_watchdog(watchdog))
        self.assertEqual(watchdog.feeds, 2)

    def test_physical_sample_labels_odometry_without_claiming_ground_truth(self):
        course_telemetry = sys.modules["ucsb_xrp._telemetry"]
        published = {
            "xMm": 125.0,
            "yMm": -30.0,
            "headingRad": 0.4,
            "leftWheelSpeedMmS": 88.0,
            "rightWheelSpeedMmS": 102.0,
            "leftWheelDistanceMm": 345.0,
            "rightWheelDistanceMm": 351.0,
            "rangeMm": 450.0,
            "buttonPressed": False,
            "leftEffort": 0.2,
            "rightEffort": 0.24,
            "requestedForwardSpeedMmS": 95.0,
            "requestedTurnRateRadS": 0.1,
            "targetLeftWheelSpeedMmS": 87.25,
            "targetRightWheelSpeedMmS": 102.75,
        }
        self.service._thread_active = True
        self.service._last_hardware = {
            "leftEncoderCount": 40,
            "rightEncoderCount": 44,
            "rangeMm": None,
            "buttonPressed": False,
            "accelerationMg": None,
            "angularRateMdps": None,
            "temperatureC": 26.0,
            "batteryV": 6.0,
            "sensorError": None,
        }

        with patch.object(
            course_telemetry,
            "state_snapshot",
            return_value=published,
            create=True,
        ):
            sample = self.service._hardware_sample()

        self.assertTrue(sample["poseAvailable"])
        self.assertEqual(sample["xMm"], 125.0)
        self.assertTrue(sample["estimatedPoseAvailable"])
        self.assertEqual(sample["estimatedXmm"], 125.0)
        self.assertFalse(sample["groundTruthPoseAvailable"])
        self.assertIsNone(sample["groundTruthXmm"])
        self.assertEqual(sample["requestedForwardSpeedMmS"], 95.0)
        self.assertEqual(sample["requestedTurnRateRadS"], 0.1)
        self.assertEqual(sample["targetLeftWheelSpeedMmS"], 87.25)
        self.assertEqual(sample["targetRightWheelSpeedMmS"], 102.75)
        self.assertEqual(sample["leftWheelDistanceMm"], 345.0)
        self.assertEqual(sample["rightWheelDistanceMm"], 351.0)

    def test_wifi_connection_uses_the_shared_profile_and_feeds_watchdog(self):
        class Watchdog:
            def __init__(self):
                self.feeds = 0

            def feed(self):
                self.feeds += 1

        watchdog = Watchdog()
        config = {"hostname": "ucsb-xrp", "ssid": "Pink", "password": "secret"}
        with (
            patch("builtins.open", return_value=object()),
            patch.object(self.service.json, "load", return_value=config),
            patch.object(
                self.service,
                "activate_network",
                return_value={
                    "ready": True,
                    "mode": "station",
                    "address": "192.168.7.32",
                },
            ) as activate,
        ):
            address = self.service._connect_wifi(watchdog=watchdog)

        self.assertEqual(address, "192.168.7.32")
        activate.assert_called_once_with(
            config,
            timeout_ms=20000,
            watchdog=watchdog,
            network_module=self.service.network,
            time_module=self.service.time,
        )

    def test_parameter_update_is_correlated_and_queued(self):
        self.service._thread_active = True

        response = self.service.set_runtime_parameter(
            types.SimpleNamespace(
                data={
                    "requestId": "parameter-1",
                    "name": "forward_speed_mm_s",
                    "value": 175,
                }
            )
        )
        reply = json.loads(response.body.decode("utf-8"))

        self.assertTrue(reply["ok"])
        self.assertEqual(reply["requestId"], "parameter-1")
        self.assertEqual(self.live_updates, [("forward_speed_mm_s", 175)])
        self.assertIn("runtimeJson", reply["result"])

    def test_invalid_parameter_is_a_client_error_not_a_service_failure(self):
        self.service._thread_active = True
        live_module = sys.modules["ucsb_xrp.live"]

        with patch.object(
            live_module,
            "queue_update",
            side_effect=ValueError("unknown live parameter: missing"),
        ):
            response = self.service.set_runtime_parameter(
                types.SimpleNamespace(
                    data={
                        "requestId": "parameter-2",
                        "name": "missing",
                        "value": 1,
                    }
                )
            )
        reply = json.loads(response.body.decode("utf-8"))

        self.assertFalse(reply["ok"])
        self.assertEqual(reply["error"]["code"], "invalid_parameter")
        self.assertEqual(response.status, 400)
        self.assertEqual(self.service._logs, [])


if __name__ == "__main__":
    unittest.main()
