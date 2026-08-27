import asyncio
import builtins
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


class FakeVfsModule(types.ModuleType):
    def __init__(self):
        super().__init__("vfs")
        self.formatted = []
        self.filesystems = []
        self.mounts = []
        self.unmounts = []

        module = self

        class VfsFat:
            def __init__(self, block_device):
                self.block_device = block_device
                module.filesystems.append(self)

            @staticmethod
            def mkfs(block_device):
                module.formatted.append(block_device)

        self.VfsFat = VfsFat

    def mount(self, filesystem, path):
        self.mounts.append((filesystem, path))

    def umount(self, path):
        self.unmounts.append(path)


class DeviceServiceRuntimeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = FakeServer()
        cls.thread_calls = []
        cls.live_updates = []
        cls.managed_start_updates = []
        cls.reset_calls = []
        cls.disabled_phew_logging = []

        fake_thread = types.ModuleType("_thread")
        fake_thread.start_new_thread = lambda function, args: cls.thread_calls.append(
            (function, args)
        )
        fake_thread.allocate_lock = lambda: types.SimpleNamespace(
            acquire=lambda: True,
            release=lambda: None,
        )
        fake_machine = types.ModuleType("machine")
        fake_machine.reset = lambda: cls.reset_calls.append(True)
        fake_machine.WDT = lambda timeout: types.SimpleNamespace(feed=lambda: None)
        fake_network = types.ModuleType("network")
        fake_network.STA_IF = 0
        fake_network.WLAN = lambda _interface: None
        fake_network.hostname = lambda: "ucsb-xrp-test"
        fake_phew = types.ModuleType("phew")
        fake_phew.server = cls.server
        fake_phew_logging = types.ModuleType("phew.logging")
        fake_phew_logging.LOG_ALL = 0x1F
        fake_phew_logging.disable_logging_types = (
            lambda value: cls.disabled_phew_logging.append(value)
        )
        fake_phew.logging = fake_phew_logging
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
        fake_course_run_control = types.ModuleType("ucsb_xrp._run_control")

        class ProgramStopped(BaseException):
            pass

        fake_course_run_control.ProgramStopped = ProgramStopped
        fake_course_run_control.stop_requested = False

        def request_stop():
            fake_course_run_control.stop_requested = True

        def clear_stop():
            fake_course_run_control.stop_requested = False

        fake_course_run_control.request_stop = request_stop
        fake_course_run_control.clear_stop = clear_stop
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
                "phew.logging": fake_phew_logging,
                "uasyncio": fake_uasyncio,
                "ucsb_xrp": fake_ucsb_xrp,
                "ucsb_xrp._telemetry": fake_course_telemetry,
                "ucsb_xrp.live": fake_course_live,
                "ucsb_xrp.robot": fake_course_robot,
                "ucsb_xrp._run_control": fake_course_run_control,
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
        self.reset_calls.clear()
        self.disabled_phew_logging.clear()
        sys.modules["ucsb_xrp._run_control"].stop_requested = False
        self.service._thread_active = False
        self.service._launch_pending = False
        self.service._project_job = None
        self.service._project_worker_started = True
        self.service._project_worker_ready = True
        self.service._project_worker_shutdown = False
        self.service._project_wake_lock = types.SimpleNamespace(
            acquire=lambda: True,
            release=lambda: None,
        )
        self.service._project_execution_lock = types.SimpleNamespace(
            acquire=lambda: True,
            release=lambda: None,
        )
        self.service._run_id = 0
        self.service._lease_deadline = None
        self.service._stop_acknowledged_run_id = None
        self.service._service_watchdog = None
        self.service._logs.clear()
        self.service._last_reply_by_id.clear()
        self.service._reply_order.clear()
        self.service._last_hardware = None
        self.service._last_sample = None
        self.service._active_manifest = None
        self.service._active_ram_slot = None
        self.service._active_ram_manifest = None
        self.service._ram_project_volumes = {"a": None, "b": None}
        self.service._last_project_module_names = []
        self.service._sample_seq = 0
        self.service._sample_epoch_start_ms = 0
        self.service._reset_pending = False
        self.service._network_state = None

    def test_run_reply_precedes_second_core_dispatch(self):
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
            self.service._sample_seq = 41
            self.service._last_sample = (90, 1, 1)

            response = self.service.run_project(
                types.SimpleNamespace(data={"requestId": "runtime-test"})
            )
            reply = json.loads(response.body.decode("utf-8"))

            self.assertEqual(reply["result"]["detail"], "Starting main.py")
            self.assertEqual(self.service._state, "loading")
            self.assertEqual(self.service._sample_seq, 0)
            self.assertIsNone(self.service._last_sample)
            self.assertEqual(self.thread_calls, [])
            self.assertEqual(len(self.server.loop.tasks), 1)

            asyncio.run(self.server.loop.tasks.pop())
            self.assertEqual(self.service._state, "running")
            self.assertEqual(self.thread_calls, [])
            self.assertTrue(self.service._thread_active)
            self.assertIsNotNone(self.service._project_job)
            self.assertEqual(
                self.service._lease_deadline,
                100 + self.service.STARTUP_LEASE_MS,
            )

            self.service._thread_active = True
            lease_response = self.service.renew_lease(
                types.SimpleNamespace(
                    data={"requestId": "lease-test", "runId": 1}
                )
            )
            lease_reply = json.loads(lease_response.body.decode("utf-8"))
            self.assertTrue(lease_reply["ok"])
            self.assertEqual(
                self.service._lease_deadline,
                100 + self.service.STARTUP_LEASE_MS,
            )
            self.assertGreater(
                self.service.STARTUP_LEASE_MS,
                self.service.LEASE_MS,
            )

            with patch.object(self.service.time, "ticks_ms", return_value=5000):
                self.service.renew_lease(
                    types.SimpleNamespace(
                        data={"requestId": "lease-test-later", "runId": 1}
                    )
                )
            self.assertEqual(
                self.service._lease_deadline,
                5000 + self.service.LEASE_MS,
            )

    def test_run_starts_a_retired_worker_only_after_the_reply(self):
        self.service._project_worker_started = False
        self.service._project_worker_ready = False
        self.service._project_worker_shutdown = True
        self.service._launch_pending = True
        self.service._run_id = 3
        starts = []

        def start_worker(_watchdog):
            starts.append("start")
            self.service._project_worker_started = True
            self.service._project_worker_ready = True
            self.service._project_worker_shutdown = False

        with patch.object(
            self.service, "_start_project_worker", side_effect=start_worker
        ):
            asyncio.run(
                self.service._launch_project_after_response(
                    "/slot", "main.py", compile("pass\n", "main.py", "exec"), [], 3
                )
            )

        self.assertEqual(starts, ["start"])
        self.assertTrue(self.service._thread_active)
        self.assertEqual(self.service._state, "running")
        self.assertIsNotNone(self.service._project_job)

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

    def test_persistent_worker_completes_one_job_without_thread_restart(self):
        self.service._stop_motors = lambda: None
        with tempfile.TemporaryDirectory() as project_dir:
            self.service._thread_active = True
            self.service._project_job = (
                project_dir,
                "main.py",
                compile("pass\n", "main.py", "exec"),
                [],
                0,
            )
            self.assertTrue(self.service._project_worker_step())

        self.assertIsNone(self.service._project_job)
        self.assertFalse(self.service._thread_active)
        self.assertEqual(self.service._state, "ready")
        self.assertEqual(self.service._detail, "Program completed")
        self.assertFalse(self.service._project_worker_step())
        self.assertEqual(self.thread_calls, [])

    def test_persistent_worker_survives_a_project_cleanup_failure(self):
        class StopWorker(BaseException):
            pass

        class WakeOnce:
            def __init__(self):
                self.calls = 0

            def acquire(self):
                self.calls += 1
                if self.calls > 1:
                    raise StopWorker()
                return True

        self.service._project_job = ("slot", "main.py", None, [], 1)
        self.service._thread_active = True
        self.service._project_wake_lock = WakeOnce()
        self.service._stop_motors = lambda: None
        with (
            patch.object(
                self.service,
                "_project_runner",
                side_effect=RuntimeError("cleanup failed"),
            ),
        ):
            with self.assertRaises(StopWorker):
                self.service._project_worker()

        self.assertFalse(self.service._project_worker_ready)
        self.assertFalse(self.service._project_worker_started)
        self.assertIsNone(self.service._project_job)
        self.assertFalse(self.service._thread_active)
        self.assertEqual(self.service._state, "error")
        self.assertIn("cleanup failed", self.service._detail)

    def test_persistent_worker_holds_execution_lock_through_cleanup(self):
        class StopWorker(BaseException):
            pass

        events = []

        class WakeOnce:
            def __init__(self):
                self.calls = 0

            def acquire(self):
                self.calls += 1
                if self.calls > 1:
                    raise StopWorker()

        class RecordingLock:
            def acquire(self):
                events.append("execution acquire")

            def release(self):
                events.append("execution release")

        self.service._project_wake_lock = WakeOnce()
        self.service._project_execution_lock = RecordingLock()
        with patch.object(
            self.service,
            "_project_worker_step",
            side_effect=lambda: events.append("project and cleanup"),
        ):
            with self.assertRaises(StopWorker):
                self.service._project_worker()

        self.assertEqual(
            events,
            ["execution acquire", "project and cleanup", "execution release"],
        )

    def test_http_sync_requires_usb_without_compiling_or_writing(self):
        project = {
            "name": "Test project",
            "entrypoint": "main.py",
            "files": {"main.py": "print('ready')\n"},
        }
        with (
            patch.object(self.service, "validate_project") as validate,
            patch.object(self.service, "_compile_project") as compile_project,
            patch.object(self.service, "_write_project") as write_project,
        ):
            response = self.service.sync(
                types.SimpleNamespace(
                    data={"requestId": "flash-requires-usb", "project": project}
                )
            )

        reply = json.loads(response.body.decode("utf-8"))
        self.assertFalse(reply["ok"])
        self.assertEqual(
            reply["error"]["code"],
            "persistent_project_requires_usb",
        )
        self.assertIn("USB setup/repair", reply["error"]["detail"])
        validate.assert_not_called()
        compile_project.assert_not_called()
        write_project.assert_not_called()

    def test_run_preparation_releases_execution_lock_before_dispatch(self):
        events = []

        class RecordingLock:
            def acquire(self):
                events.append("execution acquire")

            def release(self):
                events.append("execution release")

        self.service._project_execution_lock = RecordingLock()
        with tempfile.TemporaryDirectory() as project_dir:
            Path(project_dir, "main.py").write_text("pass\n")
            self.service._read_manifest = lambda: {
                "name": "Test project",
                "entrypoint": "main.py",
                "files": ["main.py"],
                "revision": "test-revision",
            }
            self.service._active_slot_path = lambda: project_dir
            self.service._clear_project_modules = lambda _manifest: events.append(
                "prepare"
            )
            self.service._stop_motors = lambda: None

            response = self.service.run_project(
                types.SimpleNamespace(data={"requestId": "run-boundary"})
            )

        reply = json.loads(response.body.decode("utf-8"))
        self.assertTrue(reply["ok"])
        self.assertEqual(
            events,
            ["execution acquire", "prepare", "execution release"],
        )
        self.assertTrue(self.service._launch_pending)
        self.assertEqual(len(self.server.loop.tasks), 1)
        self.server.loop.tasks.pop().close()

    def test_ram_block_device_and_capacity_are_bounded_and_dynamic(self):
        block_device = self.service.RamProjectBlockDevice(4096)
        self.assertEqual(block_device.ioctl(4, 0), 8)
        self.assertEqual(block_device.ioctl(5, 0), 512)
        self.assertEqual(block_device.writeblocks(0, b"abc", 7), 0)
        result = bytearray(3)
        self.assertEqual(block_device.readblocks(0, result, 7), 0)
        self.assertEqual(result, b"abc")
        self.assertEqual(block_device.readblocks(8, bytearray(1)), -5)

        validate = self.service.validate_project
        small = validate(
            {
                "name": "Small",
                "entrypoint": "main.py",
                "files": {"main.py": "pass\n"},
            }
        )
        larger = validate(
            {
                "name": "Larger",
                "entrypoint": "main.py",
                "files": {
                    "main.py": "pass\n" * 1200,
                    "package/data/settings.txt": "x" * 20000,
                },
            }
        )
        small_capacity = self.service._ram_project_capacity(small)
        larger_capacity = self.service._ram_project_capacity(larger)
        self.assertGreater(larger_capacity, small_capacity)
        self.assertEqual(small_capacity % 4096, 0)
        self.assertLessEqual(
            larger_capacity,
            self.service.RAM_PROJECT_MAX_VOLUME_BYTES,
        )

    def test_ram_mountpoints_are_created_before_the_worker_starts(self):
        events = []

        class Watchdog:
            def feed(self):
                events.append("watchdog")

        mounts = {"a": "/ram-a", "b": "/ram-b"}
        with (
            patch.object(self.service, "RAM_PROJECT_MOUNTS", mounts),
            patch.object(
                self.service,
                "_ensure_dir",
                side_effect=lambda path: events.append("mkdir " + path),
            ),
            patch.object(
                self.service,
                "_start_project_worker",
                side_effect=lambda _watchdog: events.append("start worker"),
            ),
        ):
            self.service._initialize_project_worker(Watchdog())

        self.assertEqual(
            events,
            ["mkdir /ram-a", "mkdir /ram-b", "watchdog", "start worker"],
        )

    def test_prepare_builds_nested_ram_project_and_run_uses_active_path(self):
        fake_vfs = FakeVfsModule()
        project = {
            "name": "Nested RAM project",
            "entrypoint": "main.py",
            "files": {
                "main.py": "from package.helper import VALUE\nprint(VALUE)\n",
                "package/__init__.py": "",
                "package/helper.py": "VALUE = 7\n",
                "data/settings.txt": "mode=test\n",
            },
        }
        with tempfile.TemporaryDirectory() as project_root:
            mount_a = str(Path(project_root, "course_ram_a"))
            mount_b = str(Path(project_root, "course_ram_b"))
            Path(mount_a).mkdir()
            Path(mount_b).mkdir()
            mounts = {"a": mount_a, "b": mount_b}
            with (
                patch.dict(sys.modules, {"vfs": fake_vfs}),
                patch.object(self.service, "RAM_PROJECT_MOUNTS", mounts),
            ):
                response = self.service.prepare_project(
                    types.SimpleNamespace(
                        data={"requestId": "prepare-nested", "project": project}
                    )
                )
                reply = json.loads(response.body.decode("utf-8"))

                self.assertTrue(reply["ok"])
                self.assertEqual(reply["result"]["checked"], 3)
                self.assertEqual(reply["result"]["project"]["lifetime"], "boot")
                self.assertEqual(self.service._active_project_path(), mount_a)
                self.assertEqual(
                    Path(mount_a, "package/helper.py").read_text(),
                    "VALUE = 7\n",
                )
                self.assertEqual(
                    Path(mount_a, "data/settings.txt").read_text(),
                    "mode=test\n",
                )
                self.assertEqual(len(fake_vfs.formatted), 1)
                self.assertEqual(len(fake_vfs.filesystems), 1)
                self.assertEqual(fake_vfs.mounts[0][1], mount_a)
                volume = self.service._ram_project_volumes["a"]
                self.assertIs(
                    fake_vfs.filesystems[0].block_device,
                    fake_vfs.formatted[0],
                )
                self.assertIs(fake_vfs.mounts[0][0], volume["filesystem"])
                self.assertIs(volume["blockDevice"], fake_vfs.formatted[0])

                info = json.loads(
                    self.service.info(types.SimpleNamespace()).body.decode("utf-8")
                )
                self.assertEqual(info["project"], reply["result"]["project"])
                self.assertIn("project.prepare", info["capabilities"])
                self.assertNotIn("project.sync", info["capabilities"])

                with patch.object(self.service, "_stop_motors", return_value=None):
                    run_response = self.service.run_project(
                        types.SimpleNamespace(data={"requestId": "run-prepared"})
                    )
                run_reply = json.loads(run_response.body.decode("utf-8"))
                self.assertTrue(run_reply["ok"])
                asyncio.run(self.server.loop.tasks.pop())

                self.assertEqual(self.service._project_job[0], mount_a)
                self.assertEqual(
                    self.service._project_job[3],
                    ["package.helper"],
                )

    def test_failed_prepare_retains_previous_active_ram_project(self):
        fake_vfs = FakeVfsModule()
        first_project = {
            "name": "First",
            "entrypoint": "main.py",
            "files": {"main.py": "print('first')\n"},
        }
        second_project = {
            "name": "Second",
            "entrypoint": "main.py",
            "files": {"main.py": "print('second')\n"},
        }
        with tempfile.TemporaryDirectory() as project_root:
            mount_a = str(Path(project_root, "course_ram_a"))
            mount_b = str(Path(project_root, "course_ram_b"))
            Path(mount_a).mkdir()
            Path(mount_b).mkdir()
            mounts = {"a": mount_a, "b": mount_b}
            with (
                patch.dict(sys.modules, {"vfs": fake_vfs}),
                patch.object(self.service, "RAM_PROJECT_MOUNTS", mounts),
            ):
                first_response = self.service.prepare_project(
                    types.SimpleNamespace(
                        data={"requestId": "prepare-first", "project": first_project}
                    )
                )
                first_manifest = json.loads(
                    first_response.body.decode("utf-8")
                )["result"]["project"]

                with patch.object(
                    self.service,
                    "_write_ram_project_files",
                    side_effect=OSError("simulated RAM write failure"),
                ):
                    failed_response = self.service.prepare_project(
                        types.SimpleNamespace(
                            data={
                                "requestId": "prepare-second",
                                "project": second_project,
                            }
                        )
                    )

                failed_reply = json.loads(failed_response.body.decode("utf-8"))
                self.assertFalse(failed_reply["ok"])
                self.assertEqual(failed_reply["error"]["code"], "internal_error")
                self.assertEqual(self.service._active_ram_slot, "a")
                self.assertEqual(self.service._active_project_path(), mount_a)
                self.assertEqual(self.service._read_manifest(), first_manifest)
                self.assertEqual(Path(mount_a, "main.py").read_text(), "print('first')\n")
                self.assertIn(mount_b, fake_vfs.unmounts)
                self.assertIsNone(self.service._ram_project_volumes["b"])

    def test_prepare_holds_and_releases_execution_lock(self):
        events = []

        class RecordingLock:
            def acquire(self):
                events.append("acquire")

            def release(self):
                events.append("release")

        project = {
            "name": "Lock test",
            "entrypoint": "main.py",
            "files": {"main.py": "pass\n"},
            "bytes": 5,
        }
        manifest = {
            "name": "Lock test",
            "entrypoint": "main.py",
            "files": ["main.py"],
            "bytes": 5,
            "revision": "lock-revision",
            "lifetime": "boot",
        }
        self.service._project_execution_lock = RecordingLock()
        with (
            patch.object(
                self.service,
                "validate_project",
                side_effect=lambda _value: (events.append("validate"), project)[1],
            ),
            patch.object(
                self.service,
                "_compile_project",
                side_effect=lambda _project: (events.append("compile"), 1)[1],
            ),
            patch.object(
                self.service,
                "_prepare_ram_project",
                side_effect=lambda _project: (events.append("build and swap"), manifest)[1],
            ),
        ):
            response = self.service.prepare_project(
                types.SimpleNamespace(
                    data={"requestId": "prepare-lock", "project": project}
                )
            )

        self.assertTrue(json.loads(response.body.decode("utf-8"))["ok"])
        self.assertEqual(
            events,
            ["acquire", "validate", "compile", "build and swap", "release"],
        )

        events.clear()

        def fail_compile(_project):
            events.append("compile failure")
            raise RuntimeError("compile failed")

        with (
            patch.object(self.service, "validate_project", return_value=project),
            patch.object(
                self.service,
                "_compile_project",
                side_effect=fail_compile,
            ),
        ):
            failed_response = self.service.prepare_project(
                types.SimpleNamespace(
                    data={"requestId": "prepare-lock-failure", "project": project}
                )
            )

        self.assertFalse(
            json.loads(failed_response.body.decode("utf-8"))["ok"]
        )
        self.assertEqual(events, ["acquire", "compile failure", "release"])

    def test_prepare_for_repl_requests_worker_shutdown(self):
        self.service._thread_active = True
        self.service._project_worker_ready = False

        self.service.prepare_for_repl()

        self.assertTrue(self.service._project_worker_shutdown)
        self.assertTrue(sys.modules["ucsb_xrp._run_control"].stop_requested)

    def test_reset_retires_idle_worker_before_machine_reset(self):
        self.service._project_worker_ready = False
        self.service._schedule_reset(delay_ms=0)

        self.assertTrue(self.service._reset_pending)
        asyncio.run(self.server.loop.tasks.pop())

        self.assertTrue(self.service._project_worker_shutdown)
        self.assertEqual(self.reset_calls, [True])

    def test_stop_requests_cooperative_exit_without_resetting_wifi(self):
        self.service._thread_active = True
        response = self.service.stop(
            types.SimpleNamespace(data={"requestId": "stop-test"})
        )
        result = json.loads(response.body.decode("utf-8"))["result"]

        self.assertEqual(result, {"detail": "Stopping program", "reconnecting": False})
        self.assertFalse(sys.modules["ucsb_xrp._run_control"].stop_requested)
        self.assertEqual(self.service._state, "loading")
        self.assertEqual(self.reset_calls, [])
        self.assertEqual(len(self.server.loop.tasks), 1)

        asyncio.run(self.server.loop.tasks.pop())
        self.assertTrue(sys.modules["ucsb_xrp._run_control"].stop_requested)
        self.assertEqual(len(self.server.loop.tasks), 1)
        self.service._thread_active = False
        asyncio.run(self.server.loop.tasks.pop())
        self.assertEqual(self.reset_calls, [])

    def test_stop_falls_back_to_reset_for_noncooperative_code(self):
        self.service._thread_active = True
        self.service.stop(types.SimpleNamespace(data={"requestId": "stop-fallback"}))

        asyncio.run(self.server.loop.tasks.pop())
        asyncio.run(self.server.loop.tasks.pop())
        self.assertEqual(self.service._state, "error")
        self.assertEqual(len(self.server.loop.tasks), 1)
        # The fake thread never executes the worker's finally block; represent
        # its native exit before running the scheduled reset task.
        self.service._project_worker_ready = False
        asyncio.run(self.server.loop.tasks.pop())
        self.assertEqual(self.reset_calls, [True])

    def test_acknowledged_stop_does_not_reset_during_cleanup(self):
        self.service._run_id = 4
        self.service._thread_active = True
        self.service.stop(types.SimpleNamespace(data={"requestId": "stop-ack"}))

        asyncio.run(self.server.loop.tasks.pop())
        self.service._stop_acknowledged_run_id = 4
        # Cleanup deliberately remains active past the cooperative grace.
        asyncio.run(self.server.loop.tasks.pop())

        self.assertTrue(self.service._thread_active)
        self.assertEqual(self.reset_calls, [])
        self.assertEqual(self.server.loop.tasks, [])

    def test_delayed_stop_signal_is_ignored_after_acknowledgment(self):
        run_control = sys.modules["ucsb_xrp._run_control"]
        self.service._run_id = 4
        self.service._thread_active = True
        self.service._stop_acknowledged_run_id = 4

        asyncio.run(self.service._request_stop_after_response(4))

        self.assertFalse(run_control.stop_requested)
        self.assertEqual(self.server.loop.tasks, [])

    def test_project_runner_preserves_stop_requested_after_run_dispatch(self):
        run_control = sys.modules["ucsb_xrp._run_control"]
        self.service._run_id = 5
        run_control.stop_requested = True
        self.service._stop_motors = lambda: None
        with tempfile.TemporaryDirectory() as project_dir:
            self.service._project_runner(
                project_dir,
                "main.py",
                compile(
                    "import ucsb_xrp._run_control as control\n"
                    "assert control.stop_requested\n"
                    "raise control.ProgramStopped()\n",
                    "main.py",
                    "exec",
                ),
                [],
                5,
            )

        self.assertEqual(self.service._state, "ready")
        self.assertEqual(self.service._detail, "Program stopped")
        self.assertEqual(self.service._stop_acknowledged_run_id, 5)
        self.assertFalse(run_control.stop_requested)

    def test_cooperative_stop_is_a_normal_program_result(self):
        run_control = sys.modules["ucsb_xrp._run_control"]
        self.service._stop_motors = lambda: None
        with tempfile.TemporaryDirectory() as project_dir:
            self.service._project_runner(
                project_dir,
                "main.py",
                compile(
                    "from ucsb_xrp._run_control import ProgramStopped\nraise ProgramStopped()\n",
                    "main.py",
                    "exec",
                ),
                [],
                0,
            )

        self.assertEqual(self.service._state, "ready")
        self.assertEqual(self.service._detail, "Program stopped")
        self.assertEqual(self.service._stop_acknowledged_run_id, 0)
        self.assertFalse(run_control.stop_requested)
        self.assertFalse(
            any(entry["stream"] == "stderr" for entry in self.service._logs)
        )

    def test_project_runner_captures_output_from_imported_modules(self):
        original_print = builtins.print
        with tempfile.TemporaryDirectory() as project_dir:
            Path(project_dir, "helper.py").write_text(
                "print('output from helper')\n"
            )
            self.service._stop_motors = lambda: None
            try:
                self.service._project_runner(
                    project_dir,
                    "main.py",
                    compile("print('output from main')\n", "main.py", "exec"),
                    ["helper"],
                    0,
                )
            finally:
                sys.modules.pop("helper", None)

        output = [
            entry["line"]
            for entry in self.service._logs
            if entry["stream"] == "stdout"
        ]
        self.assertEqual(output, ["output from helper", "output from main"])
        self.assertIs(builtins.print, original_print)

    def test_log_retains_complete_multiline_traceback_as_bounded_lines(self):
        long_line = "x" * (self.service.MAX_LOG_LINE_CHARS + 7)
        self.service._append_log(
            "stderr", "Traceback (most recent call last):\n" + long_line
        )

        entries = [
            entry for entry in self.service._logs if entry["stream"] == "stderr"
        ]
        self.assertEqual(entries[0]["line"], "Traceback (most recent call last):")
        self.assertEqual(entries[1]["line"], "x" * self.service.MAX_LOG_LINE_CHARS)
        self.assertEqual(entries[2]["line"], "x" * 7)

    def test_project_runner_does_not_require_cpython_stream_attributes(self):
        original_stdout = sys.stdout
        original_stderr = sys.stderr
        self.service._stop_motors = lambda: None
        try:
            del sys.stdout
            del sys.stderr
            with tempfile.TemporaryDirectory() as project_dir:
                self.service._project_runner(
                    project_dir,
                    "main.py",
                    compile("pass\n", "main.py", "exec"),
                    [],
                    0,
                )
        finally:
            sys.stdout = original_stdout
            sys.stderr = original_stderr

        self.assertEqual(self.service._state, "ready")
        self.assertEqual(self.service._detail, "Program completed")

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

    def test_http_request_logging_is_disabled(self):
        self.service._disable_http_flash_logging()

        self.assertEqual(
            self.disabled_phew_logging,
            [sys.modules["phew.logging"].LOG_ALL],
        )

    def test_project_flash_feeds_watchdog_during_compile_and_each_file(self):
        class Watchdog:
            def __init__(self):
                self.feeds = 0

            def feed(self):
                self.feeds += 1

        watchdog = Watchdog()
        project = {
            "name": "Watchdog project",
            "entrypoint": "main.py",
            "files": {
                "main.py": "print('ready')\n",
                "helper.py": "VALUE = 1\n",
                "README.md": "Test project.\n",
            },
            "bytes": 43,
        }
        self.service._service_watchdog = watchdog

        def ilistdir(path):
            return [
                (
                    entry.name,
                    0x4000 if entry.is_dir() else 0x8000,
                    0,
                    entry.stat().st_size,
                )
                for entry in self.service.os.scandir(path)
            ]

        with tempfile.TemporaryDirectory() as project_root:
            with (
                patch.object(self.service, "PROJECT_ROOT", project_root),
                patch.object(
                    self.service,
                    "ACTIVE_POINTER",
                    project_root + "/active.txt",
                ),
                patch.object(self.service.os, "ilistdir", ilistdir, create=True),
            ):
                self.service._compile_project(project)
                manifest = self.service._write_project(project)

        self.assertEqual(manifest["name"], "Watchdog project")
        # Two feeds around each Python compile and at least two around every
        # filesystem entry, plus manifest and active-pointer activation.
        self.assertGreaterEqual(watchdog.feeds, 12)

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

    def test_active_program_uses_student_thread_hardware_mirror(self):
        course_telemetry = sys.modules["ucsb_xrp._telemetry"]
        mirrored = {
            "leftEncoderCount": 140,
            "rightEncoderCount": 144,
            "rangeMm": 280.0,
            "buttonPressed": True,
            "accelerationMg": [1.0, 2.0, 999.0],
            "angularRateMdps": [10.0, 20.0, 30.0],
            "temperatureC": 27.0,
            "batteryV": 6.2,
            "sensorError": None,
            "leftEffort": 0.2,
            "rightEffort": 0.25,
        }
        self.service._thread_active = True
        self.service._last_hardware = {
            **mirrored,
            "leftEncoderCount": 1,
            "rightEncoderCount": 2,
            "batteryV": 5.0,
        }

        with (
            patch.object(
                course_telemetry,
                "state_snapshot",
                return_value=None,
                create=True,
            ),
            patch.object(
                course_telemetry,
                "hardware_snapshot",
                return_value=mirrored,
                create=True,
            ),
            patch.object(self.service, "_read_hardware") as read_hardware,
        ):
            sample = self.service._hardware_sample()

        self.assertEqual(sample["leftEncoderCount"], 140)
        self.assertEqual(sample["rightEncoderCount"], 144)
        self.assertEqual(sample["batteryV"], 6.2)
        self.assertEqual(sample["temperatureC"], 27.0)
        self.assertEqual(sample["leftEffort"], 0.2)
        self.assertEqual(sample["rightEffort"], 0.25)
        read_hardware.assert_not_called()

    def test_telemetry_endpoint_returns_ordered_new_samples_and_legacy_latest(self):
        course_telemetry = sys.modules["ucsb_xrp._telemetry"]
        base = {
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
        retained = []
        for sequence in range(1, 9):
            retained.append(
                {
                    **base,
                    "sampleSeq": sequence,
                    "sampleTimeMs": (sequence - 1) * 20,
                    "xMm": float(sequence),
                }
            )
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

        with (
            patch.object(
                course_telemetry,
                "buffered_state_snapshots",
                side_effect=lambda after: tuple(
                    item for item in retained if item["sampleSeq"] > after
                ),
                create=True,
            ),
            patch.object(self.service, "_read_hardware") as read_hardware,
        ):
            response = self.service.telemetry(
                types.SimpleNamespace(
                    query={
                        "afterLogSeq": "0",
                        "afterSampleSeq": "2",
                        "runId": "0",
                    }
                )
            )

        result = json.loads(response.body.decode("utf-8"))
        self.assertEqual([item["seq"] for item in result["samples"]], list(range(3, 9)))
        self.assertEqual([item["tMs"] for item in result["samples"]], list(range(40, 160, 20)))
        self.assertEqual(result["sample"], result["samples"][-1])
        self.assertEqual(result["samples"][-1]["xMm"], 8.0)
        read_hardware.assert_not_called()

    def test_active_telemetry_poll_renews_only_its_matching_run(self):
        self.service._thread_active = True
        self.service._run_id = 7
        self.service._lease_deadline = 150
        self.service._last_hardware = {
            "leftEncoderCount": 0,
            "rightEncoderCount": 0,
            "rangeMm": None,
            "buttonPressed": False,
            "accelerationMg": None,
            "angularRateMdps": None,
            "temperatureC": None,
            "batteryV": None,
            "sensorError": None,
        }

        with patch.object(self.service.time, "ticks_ms", return_value=500):
            self.service.telemetry(
                types.SimpleNamespace(
                    query={
                        "afterLogSeq": "0",
                        "afterSampleSeq": "0",
                        "runId": "6",
                    }
                )
            )
            self.assertEqual(self.service._lease_deadline, 150)
            self.service.telemetry(
                types.SimpleNamespace(
                    query={
                        "afterLogSeq": "0",
                        "afterSampleSeq": "0",
                        "runId": "7",
                    }
                )
            )

        self.assertEqual(
            self.service._lease_deadline,
            500 + self.service.LEASE_MS,
        )

    def test_idle_telemetry_adds_one_fresh_sample_to_the_batch(self):
        course_telemetry = sys.modules["ucsb_xrp._telemetry"]
        hardware = {
            "leftEncoderCount": 10,
            "rightEncoderCount": 12,
            "rangeMm": 300.0,
            "buttonPressed": False,
            "accelerationMg": None,
            "angularRateMdps": None,
            "temperatureC": 25.0,
            "batteryV": 6.1,
            "sensorError": None,
        }
        with (
            patch.object(
                course_telemetry,
                "buffered_state_snapshots",
                return_value=(),
                create=True,
            ),
            patch.object(course_telemetry, "state_snapshot", return_value=None, create=True),
            patch.object(self.service, "_read_hardware", return_value=hardware),
        ):
            response = self.service.telemetry(
                types.SimpleNamespace(
                    query={"afterLogSeq": "0", "afterSampleSeq": "0"}
                )
            )

        result = json.loads(response.body.decode("utf-8"))
        self.assertEqual(len(result["samples"]), 1)
        self.assertEqual(result["samples"][0]["seq"], 1)
        self.assertEqual(result["sample"], result["samples"][0])
        self.assertEqual(result["sample"]["rangeMm"], 300.0)

    def test_ready_telemetry_ends_a_retained_batch_with_a_fresh_stopped_sample(self):
        course_telemetry = sys.modules["ucsb_xrp._telemetry"]
        retained = {
            "sampleSeq": 8,
            "sampleTimeMs": 140,
            "xMm": 20.0,
            "yMm": 10.0,
            "headingRad": 0.2,
            "leftWheelSpeedMmS": 120.0,
            "rightWheelSpeedMmS": 130.0,
            "leftWheelDistanceMm": 80.0,
            "rightWheelDistanceMm": 84.0,
            "rangeMm": 250.0,
            "buttonPressed": False,
            "leftEffort": 0.0,
            "rightEffort": 0.0,
            "requestedForwardSpeedMmS": None,
            "requestedTurnRateRadS": None,
            "targetLeftWheelSpeedMmS": None,
            "targetRightWheelSpeedMmS": None,
        }
        hardware = {
            "leftEncoderCount": 250,
            "rightEncoderCount": 260,
            "rangeMm": 275.0,
            "buttonPressed": False,
            "accelerationMg": None,
            "angularRateMdps": None,
            "temperatureC": 25.0,
            "batteryV": 6.1,
            "sensorError": None,
        }
        self.service._sample_seq = 8
        self.service._thread_active = False
        with (
            patch.object(
                course_telemetry,
                "buffered_state_snapshots",
                return_value=(retained,),
                create=True,
            ),
            patch.object(
                course_telemetry, "state_snapshot", return_value=retained, create=True
            ),
            patch.object(self.service, "_read_hardware", return_value=hardware),
        ):
            response = self.service.telemetry(
                types.SimpleNamespace(
                    query={"afterLogSeq": "0", "afterSampleSeq": "0"}
                )
            )

        result = json.loads(response.body.decode("utf-8"))
        self.assertEqual([item["seq"] for item in result["samples"]], [8, 9])
        self.assertEqual(result["sample"], result["samples"][-1])
        self.assertEqual(result["sample"]["leftWheelSpeedMmS"], 0.0)
        self.assertEqual(result["sample"]["rightWheelSpeedMmS"], 0.0)

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
                "begin_network_activation",
                return_value="pending-network",
            ) as begin,
            patch.object(
                self.service,
                "finish_network_activation",
                return_value={
                    "ready": True,
                    "mode": "station",
                    "address": "192.168.7.32",
                },
            ) as finish,
        ):
            address = self.service._connect_wifi(watchdog=watchdog)

        self.assertEqual(address, "192.168.7.32")
        begin.assert_called_once_with(
            config,
            watchdog=watchdog,
            network_module=self.service.network,
        )
        finish.assert_called_once_with(
            "pending-network",
            timeout_ms=20000,
            watchdog=watchdog,
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
