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
        self.service._thread_active = False
        self.service._launch_pending = False
        self.service._run_id = 0
        self.service._logs.clear()

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


if __name__ == "__main__":
    unittest.main()
