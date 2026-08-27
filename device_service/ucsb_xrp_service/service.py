"""HTTP target service for the current RP2350 XRP.

The service is deliberately private infrastructure. Student code sees only
``ucsb_xrp`` and XRPLib. Browser clients use a small JSON API over either the
XRP access point or an ordinary local network; polling keeps the implementation
dependable on stock MicroPython.
"""

import gc
import builtins
import io
import json
import math
import os
import sys
import time

import _thread
import machine
import network
from phew import logging as phew_logging
from phew import server

from .protocol import (
    LineLogWriter,
    MAX_LOG_LINE_CHARS,
    PROTOCOL_VERSION,
    SERVICE_VERSION,
    ProtocolError,
)
from .protocol import reply as protocol_reply
from .protocol import project_revision, validate_project, validate_request_id
from .networking import (
    begin_network_activation,
    finish_network_activation,
    public_network_state,
)


COURSE_RELEASE = "2026.08-dev.37"
CONFIG_PATH = "/xrp_wifi.json"
SLOTS = ("a", "b")
RAM_PROJECT_MOUNTS = {
    "a": "/course_ram_a",
    "b": "/course_ram_b",
}
RAM_PROJECT_BLOCK_BYTES = 512
RAM_PROJECT_MIN_VOLUME_BYTES = 32 * 1024
RAM_PROJECT_MAX_VOLUME_BYTES = 384 * 1024
RAM_PROJECT_BASE_OVERHEAD_BYTES = 16 * 1024
RAM_PROJECT_ENTRY_OVERHEAD_BYTES = 1024
LEASE_MS = 6000
STARTUP_LEASE_MS = 10000
LAUNCH_AFTER_RESPONSE_MS = 80
SERVICE_WATCHDOG_MS = 7000
LOG_LIMIT = 160
TELEMETRY_LOG_BATCH_LIMIT = 8
TELEMETRY_SAMPLE_BATCH_LIMIT = 8
STOP_GRACE_MS = 2500
PROJECT_WORKER_IDLE_MS = 5
PROJECT_WORKER_START_TIMEOUT_MS = 500

_boot_ms = time.ticks_ms()
try:
    _boot_id = "".join("{:02x}".format(value) for value in os.urandom(6))
except Exception:
    _boot_id = "ticks-{}".format(time.ticks_us())
_run_id = 0
_state = "ready"
_detail = "Physical XRP ready"
_thread_active = False
_launch_pending = False
_project_job = None
_project_worker_started = False
_project_worker_ready = False
_project_worker_shutdown = False
_project_wake_lock = None
_project_execution_lock = None
_lease_deadline = None
_stop_acknowledged_run_id = None
_service_watchdog = None
_logs = []
_log_seq = 0
_sample_seq = 0
_sample_epoch_start_ms = 0
_last_sample = None
_last_hardware = None
_active_ram_slot = None
_active_ram_manifest = None
_ram_project_volumes = {"a": None, "b": None}
_last_project_module_names = []
_last_reply_by_id = {}
_reply_order = []
_network_state = None
_reset_pending = False


def _runtime_identity():
    """Return one release identity for both legacy and slotted installs."""
    try:
        import course_boot

        context = course_boot.runtime_identity()
    except (ImportError, AttributeError):
        context = None
    if not isinstance(context, dict):
        context = {}
    release_id = context.get("releaseId")
    if not isinstance(release_id, str) or not release_id:
        release_id = COURSE_RELEASE
    service_version = context.get("serviceVersion")
    if not isinstance(service_version, str) or not service_version:
        service_version = SERVICE_VERSION
    course_library_version = context.get("courseLibraryVersion")
    if not isinstance(course_library_version, str) or not course_library_version:
        try:
            import ucsb_xrp

            course_library_version = getattr(ucsb_xrp, "__version__", None)
        except Exception:
            course_library_version = None
    release_sequence = context.get("releaseSequence")
    if not isinstance(release_sequence, int) or isinstance(release_sequence, bool):
        release_sequence = None
    runtime_generation = context.get("generation")
    if not isinstance(runtime_generation, int) or isinstance(runtime_generation, bool):
        runtime_generation = None
    protocol_revision = context.get("protocolRevision", PROTOCOL_VERSION)
    if not isinstance(protocol_revision, int) or isinstance(protocol_revision, bool):
        protocol_revision = PROTOCOL_VERSION
    bootstrap_version = context.get("bootstrapVersion", 1)
    if not isinstance(bootstrap_version, int) or isinstance(bootstrap_version, bool):
        bootstrap_version = 1
    manifest_digest = context.get("runtimeManifestSha256")
    if not isinstance(manifest_digest, str):
        manifest_digest = None
    course_api_revision = context.get("courseApiRevision")
    if not isinstance(course_api_revision, str):
        course_api_revision = None
    return {
        "runtimeRelease": release_id,
        "runtimeReleaseSequence": release_sequence,
        "runtimeGeneration": runtime_generation,
        "runtimeManifestSha256": manifest_digest,
        "courseApiRevision": course_api_revision,
        "courseLibraryVersion": course_library_version,
        "serviceVersion": service_version,
        "protocolRevision": protocol_revision,
        "bootstrapVersion": bootstrap_version,
    }


def _robot_id():
    """Return the controller's stable hardware identifier as lowercase hex."""
    try:
        value = machine.unique_id()
        return "".join("{:02x}".format(byte) for byte in value)
    except Exception:
        return None


def _cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
        "Access-Control-Allow-Private-Network": "true",
        "Access-Control-Max-Age": "600",
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
    }


def _json_response(value, status=200):
    body = json.dumps(value, separators=(",", ":")).encode("utf-8")
    headers = _cors_headers()
    headers["Content-Length"] = str(len(body))
    return server.Response(body, status=status, headers=headers)


def _error_response(request_id, code, detail, status=400):
    return _json_response(
        protocol_reply(
            request_id,
            ok=False,
            error={"code": code, "detail": detail},
        ),
        status=status,
    )


def _append_log(stream, line):
    global _log_seq
    text = str(line)
    lines = text.split("\n")
    if text.endswith("\n"):
        lines.pop()
    for source_line in lines:
        while len(source_line) > MAX_LOG_LINE_CHARS:
            _append_log_record(stream, source_line[:MAX_LOG_LINE_CHARS])
            source_line = source_line[MAX_LOG_LINE_CHARS:]
        _append_log_record(stream, source_line)


def _append_log_record(stream, line):
    global _log_seq
    _log_seq += 1
    _logs.append(
        {
            "seq": _log_seq,
            "tMs": time.ticks_diff(time.ticks_ms(), _boot_ms),
            "stream": stream,
            "line": line,
        }
    )
    if len(_logs) > LOG_LIMIT:
        del _logs[: len(_logs) - LOG_LIMIT]


def _set_state(state, detail):
    global _state, _detail
    _state = state
    _detail = detail
    _append_log("system", detail)


def _extend_run_lease(duration_ms):
    """Extend the active deadline without shortening an existing grace period."""
    global _lease_deadline
    candidate = time.ticks_add(time.ticks_ms(), duration_ms)
    if (
        _lease_deadline is None
        or time.ticks_diff(candidate, _lease_deadline) > 0
    ):
        _lease_deadline = candidate


def _feed_watchdog_now():
    """Feed the service watchdog during synchronous project work."""
    if _service_watchdog is not None:
        _service_watchdog.feed()


def _disable_http_flash_logging():
    """Keep Phew request accounting out of the controller filesystem."""
    phew_logging.disable_logging_types(phew_logging.LOG_ALL)


def _stop_motors():
    first_error = None
    try:
        from XRPLib.encoded_motor import EncodedMotor

        left = EncodedMotor.get_default_encoded_motor(index=1)
        right = EncodedMotor.get_default_encoded_motor(index=2)
        try:
            left.set_effort(0.0)
        except Exception as exc:
            first_error = exc
        try:
            right.set_effort(0.0)
        except Exception as exc:
            if first_error is None:
                first_error = exc
    except Exception as exc:
        first_error = exc
    if first_error is not None:
        _append_log(
            "stderr", "Could not set both drive commands to zero: " + str(first_error)
        )


def _ensure_dir(path):
    try:
        os.mkdir(path)
    except OSError:
        pass


def _make_parent_dirs(root, relative_path):
    parts = relative_path.split("/")[:-1]
    current = root
    for part in parts:
        current += "/" + part
        _ensure_dir(current)


class RamProjectBlockDevice:
    """Bytearray storage implementing MicroPython's extended block protocol."""

    def __init__(self, byte_count):
        if byte_count <= 0 or byte_count % RAM_PROJECT_BLOCK_BYTES:
            raise ValueError("RAM project volume size must use complete blocks")
        self.block_size = RAM_PROJECT_BLOCK_BYTES
        self.data = bytearray(byte_count)

    def readblocks(self, block_num, buffer, offset=0):
        address = block_num * self.block_size + offset
        end = address + len(buffer)
        if address < 0 or end > len(self.data):
            return -5
        buffer[:] = self.data[address:end]
        return 0

    def writeblocks(self, block_num, buffer, offset=None):
        if offset is None:
            offset = 0
        address = block_num * self.block_size + offset
        end = address + len(buffer)
        if address < 0 or end > len(self.data):
            return -5
        self.data[address:end] = buffer
        return 0

    def ioctl(self, operation, argument):
        if operation in (1, 2, 3):
            return 0
        if operation == 4:
            return len(self.data) // self.block_size
        if operation == 5:
            return self.block_size
        if operation == 6:
            address = argument * self.block_size
            end = address + self.block_size
            if address < 0 or end > len(self.data):
                return -5
            self.data[address:end] = bytes(self.block_size)
            return 0
        return None


def _ram_project_directory_count(project):
    directories = set()
    for path in project["files"]:
        parts = path.split("/")[:-1]
        current = ""
        for part in parts:
            current = part if not current else current + "/" + part
            directories.add(current)
    return len(directories)


def _ram_project_capacity(project):
    """Size one FAT volume for project text, entries, and filesystem metadata."""
    entry_count = len(project["files"]) + _ram_project_directory_count(project)
    required = (
        project["bytes"]
        + RAM_PROJECT_BASE_OVERHEAD_BYTES
        + entry_count * RAM_PROJECT_ENTRY_OVERHEAD_BYTES
    )
    required = max(required, RAM_PROJECT_MIN_VOLUME_BYTES)
    allocation_unit = 8 * RAM_PROJECT_BLOCK_BYTES
    capacity = (
        (required + allocation_unit - 1) // allocation_unit
    ) * allocation_unit
    if capacity > RAM_PROJECT_MAX_VOLUME_BYTES:
        raise ProtocolError(
            "project_too_large",
            "project needs a RAM volume larger than {} bytes".format(
                RAM_PROJECT_MAX_VOLUME_BYTES
            ),
        )
    return capacity


def _vfs_module():
    """Load the MicroPython VFS module only when a RAM project is prepared."""
    try:
        import vfs

        return vfs
    except ImportError:
        # Older MicroPython builds expose VfsFat and mount through ``os``.
        return os


def _ensure_ram_project_mounts():
    """Create the two persistent mountpoint entries before core 1 starts."""
    for slot in SLOTS:
        _ensure_dir(RAM_PROJECT_MOUNTS[slot])


def _initialize_project_worker(watchdog):
    """Establish RAM-project mountpoints, then start persistent core 1."""
    _ensure_ram_project_mounts()
    watchdog.feed()
    _start_project_worker(watchdog)


def _discard_ram_project_volume(slot, vfs_module=None):
    global _ram_project_volumes
    volume = _ram_project_volumes.get(slot)
    if volume is None:
        return
    if vfs_module is None:
        vfs_module = _vfs_module()
    try:
        vfs_module.umount(RAM_PROJECT_MOUNTS[slot])
    except OSError:
        pass
    _ram_project_volumes[slot] = None
    gc.collect()


def _write_ram_project_files(root, project):
    for path, content in project["files"].items():
        _feed_watchdog_now()
        _make_parent_dirs(root, path)
        with open(root + "/" + path, "w") as handle:
            handle.write(content)
        _feed_watchdog_now()


def _ram_project_manifest(project):
    manifest = {
        "name": project["name"],
        "entrypoint": project["entrypoint"],
        "files": sorted(project["files"].keys()),
        "bytes": project["bytes"],
        "revision": project_revision(project),
        "lifetime": "boot",
    }
    if "world.json" in project["files"]:
        manifest["worldJson"] = project["files"]["world.json"]
    return manifest


def _prepare_ram_project(project):
    """Build the inactive RAM volume, then publish it as one atomic project."""
    global _active_ram_slot, _active_ram_manifest, _ram_project_volumes
    inactive = "b" if _active_ram_slot == "a" else "a"
    mount_path = RAM_PROJECT_MOUNTS[inactive]
    capacity = _ram_project_capacity(project)
    vfs_module = _vfs_module()
    _discard_ram_project_volume(inactive, vfs_module=vfs_module)
    try:
        block_device = RamProjectBlockDevice(capacity)
    except MemoryError:
        raise ProtocolError(
            "project_too_large",
            "not enough controller RAM for the prepared project",
        )

    mounted = False
    try:
        _feed_watchdog_now()
        vfs_module.VfsFat.mkfs(block_device)
        filesystem = vfs_module.VfsFat(block_device)
        vfs_module.mount(filesystem, mount_path)
        mounted = True
        _write_ram_project_files(mount_path, project)
        manifest = _ram_project_manifest(project)
        _feed_watchdog_now()
    except Exception:
        if mounted:
            try:
                vfs_module.umount(mount_path)
            except OSError:
                pass
        gc.collect()
        raise

    _ram_project_volumes[inactive] = {
        "blockDevice": block_device,
        "filesystem": filesystem,
        "capacityBytes": capacity,
    }
    _active_ram_slot = inactive
    _active_ram_manifest = manifest
    return manifest


def _active_project_path():
    if _active_ram_slot in SLOTS and _active_ram_manifest is not None:
        return RAM_PROJECT_MOUNTS[_active_ram_slot]
    return None


def _read_manifest():
    """Return the project prepared during this controller boot, if any."""
    return _active_ram_manifest


def _compile_project(project):
    checked = 0
    for path, source in project["files"].items():
        if path.endswith(".py"):
            _feed_watchdog_now()
            compile(source, path, "exec")
            checked += 1
            _feed_watchdog_now()
    return checked


def _project_module_names(manifest):
    names = []
    entrypoint = manifest["entrypoint"]
    for path in manifest["files"]:
        if path == entrypoint or not path.endswith(".py"):
            continue
        module_name = path[:-3].replace("/", ".")
        if module_name.endswith(".__init__"):
            module_name = module_name[: -len(".__init__")]
        if module_name and module_name not in names:
            names.append(module_name)
    return names


def _entrypoint_project_imports(manifest, source):
    """Find project modules imported at the entrypoint's top level."""
    candidates = _project_module_names(manifest)
    imported = []
    for line in source.splitlines():
        if not line or line != line.lstrip():
            continue
        stripped = line.strip()
        names = []
        if stripped.startswith("from ") and " import " in stripped:
            names.append(stripped[5:].split(" import ", 1)[0].lstrip("."))
        elif stripped.startswith("import "):
            for value in stripped[7:].split(","):
                names.append(value.strip().split(" ", 1)[0])
        for name in names:
            if name in candidates and name not in imported:
                imported.append(name)
    return imported


def _clear_project_modules(manifest):
    """Discard imports owned by the previous project before another run.

    The HTTP service and student program use separate RP2350 cores. Project
    imports therefore happen only on the student core, while this cleanup runs
    before that core starts. Keeping the manifest in memory also prevents the
    service core from reading the flash filesystem while those imports occur.
    """
    global _last_project_module_names
    current_names = _project_module_names(manifest)
    names = list(_last_project_module_names)
    for module_name in current_names:
        if module_name not in names:
            names.append(module_name)
    # Remove children first so a package cannot retain an old child attribute.
    names.sort(key=lambda value: value.count("."), reverse=True)
    for module_name in names:
        try:
            del sys.modules[module_name]
        except KeyError:
            pass
    _last_project_module_names = current_names


def _project_runner(slot_path, entrypoint, entry_code, startup_modules, run_id):
    global _thread_active, _lease_deadline, _stop_acknowledged_run_id
    previous_cwd = os.getcwd()
    stdout = LineLogWriter("stdout", _append_log)
    previous_print = builtins.print
    inserted_path = False
    outcome_state = "ready"
    outcome_detail = "Program completed"
    managed_start = None
    try:
        os.chdir(slot_path)
        if not sys.path or sys.path[0] != slot_path:
            sys.path.insert(0, slot_path)
            inserted_path = True
        from ucsb_xrp.robot import _set_managed_start
        from ucsb_xrp._run_control import ProgramStopped, clear_stop

        managed_start = _set_managed_start
        managed_start(True)
        # MicroPython does not expose ``sys.stdout``. Replacing the built-in
        # print function captures output from imported project modules as well
        # as main.py, then the finally block restores it for the service.
        builtins.print = stdout.print
        # Keep the HTTP handler paused while the student core performs its
        # first project imports. RP2350 flash reads are then isolated from
        # response allocation on the service core.
        for module_name in startup_modules:
            __import__(module_name)
        globals_value = {
            "__name__": "__main__",
            "__file__": entrypoint,
            "print": stdout.print,
        }
        exec(entry_code, globals_value, globals_value)
    except ProgramStopped:
        # Acknowledge the cooperative signal before motor and interpreter
        # cleanup. The service can then distinguish slow cleanup from a
        # program that never observed the request.
        _stop_acknowledged_run_id = run_id
        outcome_state = "ready"
        outcome_detail = "Program stopped"
    except BaseException as exc:
        buffer = io.StringIO()
        try:
            sys.print_exception(exc, buffer)
            detail = buffer.getvalue().strip()
        except Exception:
            detail = type(exc).__name__ + ": " + str(exc)
        _append_log("stderr", detail)
        outcome_state = "error"
        outcome_detail = "Program stopped after an exception"
    finally:
        builtins.print = previous_print
        if managed_start is not None:
            managed_start(False)
        try:
            clear_stop()
        except Exception:
            pass
        _stop_motors()
        stdout.flush()
        if inserted_path:
            try:
                sys.path.remove(slot_path)
            except ValueError:
                pass
        os.chdir(previous_cwd)
        _lease_deadline = None
        _thread_active = False
        if run_id == _run_id:
            _set_state(outcome_state, outcome_detail)


def _project_worker_step():
    """Run one queued project and return whether work was available."""
    global _project_job
    job = _project_job
    if job is None:
        return False
    _project_job = None
    _project_runner(*job)
    return True


def _project_worker():
    """Keep core 1 alive and blocked between project runs.

    The execution lock gives the service a precise boundary around project
    cleanup and the next RAM-project activation. Blocking on the wake lock also
    prevents an idle Python loop from competing with the HTTP service.
    """
    global _project_worker_ready, _project_worker_started
    global _thread_active, _lease_deadline, _project_job
    wake_lock = _project_wake_lock
    execution_lock = _project_execution_lock
    if wake_lock is None or execution_lock is None:
        raise RuntimeError("Project worker locks are unavailable")
    _project_worker_ready = True
    try:
        while True:
            wake_lock.acquire()
            if _project_worker_shutdown:
                break
            execution_lock.acquire()
            try:
                try:
                    _project_worker_step()
                except BaseException as exc:
                    # A cleanup failure must not destroy the only core-1
                    # worker. Keep the service responsive, stop the motors,
                    # and report the failure before accepting another run.
                    _project_job = None
                    _thread_active = False
                    _lease_deadline = None
                    _stop_motors()
                    detail = "Project worker recovered from {}: {}".format(
                        type(exc).__name__, str(exc)
                    )
                    _append_log("stderr", detail)
                    _set_state("error", detail)
            finally:
                # _thread_active becomes false near the end of project
                # cleanup. This lock remains held until the worker has fully
                # returned, so the service core cannot activate a new project
                # or start the next run during those final instructions.
                execution_lock.release()
            if _project_worker_shutdown:
                break
    finally:
        _project_worker_ready = False
        _project_worker_started = False


def _start_project_worker(watchdog):
    """Start core 1 once during service startup and verify that it is idle."""
    global _project_worker_started, _project_worker_shutdown
    global _project_wake_lock, _project_execution_lock
    if _project_worker_started:
        return
    _project_worker_shutdown = False
    wake_lock = _thread.allocate_lock()
    wake_lock.acquire()
    _project_wake_lock = wake_lock
    _project_execution_lock = _thread.allocate_lock()
    deadline = time.ticks_add(time.ticks_ms(), PROJECT_WORKER_START_TIMEOUT_MS)
    while True:
        try:
            _thread.start_new_thread(_project_worker, ())
            _project_worker_started = True
            break
        except OSError:
            # Core 1 can remain natively occupied for a few instructions after
            # its Python worker clears the ready flag. Retry against the actual
            # core-availability signal instead of imposing a fixed delay.
            watchdog.feed()
            if time.ticks_diff(deadline, time.ticks_ms()) <= 0:
                raise RuntimeError("Project worker core did not become available")
            time.sleep_ms(1)
    while not _project_worker_ready:
        watchdog.feed()
        if time.ticks_diff(deadline, time.ticks_ms()) <= 0:
            _project_worker_started = False
            raise RuntimeError("Project worker did not start")
        time.sleep_ms(PROJECT_WORKER_IDLE_MS)


def _begin_project_worker_shutdown():
    """Ask core 1 to exit before reset or a USB raw-REPL session."""
    global _project_worker_shutdown, _launch_pending, _project_job
    _project_worker_shutdown = True
    _launch_pending = False
    if _project_job is not None and not _thread_active:
        _project_job = None
    if _thread_active:
        try:
            from ucsb_xrp._run_control import request_stop

            request_stop()
        except Exception:
            pass
    elif _project_worker_started and _project_worker_ready:
        try:
            _project_wake_lock.release()
        except (AttributeError, RuntimeError):
            pass


def prepare_for_repl(timeout_ms=300):
    """Retire core 1 so Web Serial can enter raw REPL reliably."""
    _begin_project_worker_shutdown()
    deadline = time.ticks_add(time.ticks_ms(), timeout_ms)
    while (
        _project_worker_ready
        and time.ticks_diff(deadline, time.ticks_ms()) > 0
    ):
        time.sleep_ms(PROJECT_WORKER_IDLE_MS)


async def _launch_project_after_response(
    slot_path, entrypoint, entry_code, startup_modules, run_id
):
    """Dispatch work to core 1 after the small run response has left core 0.

    RP2350 MicroPython shares one interpreter and heap across both cores.
    Starting project execution while the HTTP handler is still allocating its
    response can make an allocator lockup unrecoverable. The browser treats
    ``loading`` as an active run state, so this short deferred dispatch is
    visible without adding another student-facing step.
    """
    global _launch_pending, _thread_active, _lease_deadline, _project_job
    import uasyncio

    await uasyncio.sleep_ms(LAUNCH_AFTER_RESPONSE_MS)
    if _reset_pending or not _launch_pending or run_id != _run_id:
        return
    if not _project_worker_ready:
        try:
            _start_project_worker(_service_watchdog)
        except Exception as exc:
            _launch_pending = False
            _lease_deadline = None
            detail = "Project worker could not start: {}: {}".format(
                type(exc).__name__, str(exc)
            )
            _append_log("stderr", detail)
            _set_state("error", detail)
            return
    _launch_pending = False
    _thread_active = True
    # The first telemetry poll is sent only after the browser's startup quiet
    # interval. Give that exchange time to arrive even when core 1 is importing
    # project code. Later telemetry polls renew the shorter normal lease; the
    # hardware watchdog remains the faster recovery for an interpreter lock.
    _extend_run_lease(STARTUP_LEASE_MS)
    _set_state("running", "Running " + entrypoint)
    if _project_job is not None:
        _thread_active = False
        _lease_deadline = None
        detail = "Project worker is unavailable"
        _append_log("stderr", detail)
        _set_state("error", detail)
        return
    _project_job = (
        slot_path,
        entrypoint,
        entry_code,
        startup_modules,
        run_id,
    )
    _project_wake_lock.release()


async def _reset_after_response(delay_ms):
    import uasyncio

    await uasyncio.sleep_ms(delay_ms)
    _begin_project_worker_shutdown()
    deadline = time.ticks_add(time.ticks_ms(), 300)
    while (
        _project_worker_ready
        and time.ticks_diff(deadline, time.ticks_ms()) > 0
    ):
        await uasyncio.sleep_ms(PROJECT_WORKER_IDLE_MS)
    machine.reset()


def _schedule_reset(delay_ms=220):
    # Hardware Timer callbacks run in interrupt context, where importing and
    # reset setup are unreliable. An event-loop task lets the HTTP response
    # leave first, then resets in ordinary MicroPython execution context.
    global _reset_pending
    _reset_pending = True
    server.loop.create_task(_reset_after_response(delay_ms))


async def _reset_if_program_does_not_stop(run_id):
    """Keep Wi-Fi active for normal course programs; reset only as fallback."""
    import uasyncio

    await uasyncio.sleep_ms(STOP_GRACE_MS)
    if (
        _thread_active
        and run_id == _run_id
        and _stop_acknowledged_run_id != run_id
    ):
        _set_state("error", "Program did not stop; restarting target service")
        _schedule_reset()


def _clear_course_run_state(detail="Program state reset"):
    """Return the course runtime to its idle state without rebooting Wi-Fi."""
    global _sample_seq, _sample_epoch_start_ms, _last_sample
    global _stop_acknowledged_run_id
    _stop_motors()
    from ucsb_xrp._telemetry import clear_state
    from ucsb_xrp._run_control import clear_stop
    from ucsb_xrp.live import clear as clear_runtime

    clear_state()
    clear_stop()
    clear_runtime()
    _sample_seq = 0
    _sample_epoch_start_ms = time.ticks_diff(time.ticks_ms(), _boot_ms)
    _last_sample = None
    _stop_acknowledged_run_id = None
    _set_state("ready", detail)


async def _reset_course_run_after_response(run_id):
    """Stop the current program, then reset only its course-visible state."""
    import uasyncio

    await uasyncio.sleep_ms(LAUNCH_AFTER_RESPONSE_MS)
    if _thread_active and run_id == _run_id:
        from ucsb_xrp._run_control import request_stop

        request_stop()
        deadline = time.ticks_add(time.ticks_ms(), STOP_GRACE_MS)
        while (
            _thread_active
            and run_id == _run_id
            and time.ticks_diff(deadline, time.ticks_ms()) > 0
        ):
            await uasyncio.sleep_ms(PROJECT_WORKER_IDLE_MS)
    if _thread_active and run_id == _run_id:
        # Student code that never yields cannot be recovered safely from the
        # service core. A controller restart remains the exceptional fallback.
        _set_state("error", "Program did not stop; restarting target service")
        _schedule_reset()
        return
    _clear_course_run_state()


async def _request_stop_after_response(run_id):
    """Signal core 1 only after the Stop response has left the service core."""
    import uasyncio

    await uasyncio.sleep_ms(LAUNCH_AFTER_RESPONSE_MS)
    if (
        not _thread_active
        or run_id != _run_id
        or _stop_acknowledged_run_id == run_id
    ):
        return
    from ucsb_xrp._run_control import request_stop

    request_stop()
    server.loop.create_task(_reset_if_program_does_not_stop(run_id))


def _read_hardware():
    global _last_hardware
    values = {
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
    try:
        from XRPLib.board import Board
        from XRPLib.encoded_motor import EncodedMotor
        from XRPLib.imu import IMU
        from XRPLib.rangefinder import Rangefinder

        values["leftEncoderCount"] = int(
            EncodedMotor.get_default_encoded_motor(index=1).get_position_counts()
        )
        values["rightEncoderCount"] = int(
            EncodedMotor.get_default_encoded_motor(index=2).get_position_counts()
        )
        raw_range_cm = Rangefinder.get_default_rangefinder().distance()
        if isinstance(raw_range_cm, (int, float)) and raw_range_cm > 0:
            values["rangeMm"] = float(raw_range_cm) * 10.0
        board = Board.get_default_board()
        values["buttonPressed"] = bool(board.is_button_pressed())
        values["batteryV"] = float(board.get_battery_voltage())
        imu = IMU.get_default_imu()
        values["accelerationMg"] = list(imu.get_acc_rates())
        values["angularRateMdps"] = list(imu.get_gyro_rates())
        values["temperatureC"] = float(imu.temperature())
    except Exception as exc:
        values["sensorError"] = type(exc).__name__ + ": " + str(exc)
    _last_hardware = values
    return values


def _empty_hardware():
    return {
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


def _sample_value(pose, hardware, sequence, time_ms, left_speed, right_speed):
    """Build one wire sample without reading any device."""
    left_count = (
        hardware["leftEncoderCount"]
        if pose is None or pose.get("leftEncoderCount") is None
        else pose["leftEncoderCount"]
    )
    right_count = (
        hardware["rightEncoderCount"]
        if pose is None or pose.get("rightEncoderCount") is None
        else pose["rightEncoderCount"]
    )
    return {
        "tMs": time_ms,
        "seq": sequence,
        "source": "physical",
        "poseAvailable": pose is not None,
        "xMm": 0.0 if pose is None else pose["xMm"],
        "yMm": 0.0 if pose is None else pose["yMm"],
        "headingRad": 0.0 if pose is None else pose["headingRad"],
        "estimatedPoseAvailable": pose is not None,
        "estimatedXmm": None if pose is None else pose["xMm"],
        "estimatedYmm": None if pose is None else pose["yMm"],
        "estimatedHeadingRad": None if pose is None else pose["headingRad"],
        "groundTruthPoseAvailable": False,
        "groundTruthXmm": None,
        "groundTruthYmm": None,
        "groundTruthHeadingRad": None,
        "requestedForwardSpeedMmS": (
            None if pose is None else pose.get("requestedForwardSpeedMmS")
        ),
        "requestedTurnRateRadS": (
            None if pose is None else pose.get("requestedTurnRateRadS")
        ),
        "targetLeftWheelSpeedMmS": (
            None if pose is None else pose.get("targetLeftWheelSpeedMmS")
        ),
        "targetRightWheelSpeedMmS": (
            None if pose is None else pose.get("targetRightWheelSpeedMmS")
        ),
        "leftEffort": (
            hardware.get("leftEffort", 0.0)
            if pose is None
            else pose["leftEffort"]
        ),
        "rightEffort": (
            hardware.get("rightEffort", 0.0)
            if pose is None
            else pose["rightEffort"]
        ),
        "leftWheelSpeedMmS": left_speed,
        "rightWheelSpeedMmS": right_speed,
        "leftWheelDistanceMm": (
            None if pose is None else pose.get("leftWheelDistanceMm")
        ),
        "rightWheelDistanceMm": (
            None if pose is None else pose.get("rightWheelDistanceMm")
        ),
        "leftEncoderCount": left_count,
        "rightEncoderCount": right_count,
        "collision": False,
        "rangeMm": (
            hardware["rangeMm"]
            if pose is None or pose["rangeMm"] is None
            else pose["rangeMm"]
        ),
        "buttonPressed": (
            hardware["buttonPressed"]
            if pose is None
            else pose["buttonPressed"]
        ),
        "accelerationMg": hardware["accelerationMg"],
        "angularRateMdps": hardware["angularRateMdps"],
        "temperatureC": hardware["temperatureC"],
        "batteryV": hardware["batteryV"],
        "sensorError": hardware["sensorError"],
    }


def _course_sample(pose, hardware):
    """Translate one retained Robot.step publication without device I/O."""
    global _sample_seq
    sequence = pose.get("sampleSeq")
    if not isinstance(sequence, int) or sequence <= 0:
        _sample_seq += 1
        sequence = _sample_seq
    elif sequence > _sample_seq:
        _sample_seq = sequence
    elapsed_ms = pose.get("sampleTimeMs")
    if not isinstance(elapsed_ms, int) or elapsed_ms < 0:
        time_ms = time.ticks_diff(time.ticks_ms(), _boot_ms)
    else:
        time_ms = _sample_epoch_start_ms + elapsed_ms
    return _sample_value(
        pose,
        hardware,
        sequence,
        time_ms,
        pose["leftWheelSpeedMmS"],
        pose["rightWheelSpeedMmS"],
    )


def _hardware_sample():
    global _sample_seq, _last_sample
    now = time.ticks_ms()
    try:
        from ucsb_xrp._telemetry import state_snapshot

        pose = state_snapshot()
    except Exception:
        pose = None
    try:
        from ucsb_xrp._telemetry import hardware_snapshot

        mirrored_hardware = hardware_snapshot()
    except (ImportError, AttributeError):
        mirrored_hardware = None

    # XRPLib's I2C and encoder drivers are not safe for concurrent access from
    # both RP2350 cores. While a student program is active, use its published
    # course state and the latest stationary peripheral sample. Direct device
    # reads resume as soon as the program thread finishes.
    if _thread_active:
        hardware = mirrored_hardware or _last_hardware or _empty_hardware()
        if pose is not None:
            return _course_sample(pose, hardware)
        return _sample_value(None, hardware, 0, 0, 0.0, 0.0)
    else:
        hardware = _read_hardware()

    left_count = hardware["leftEncoderCount"]
    right_count = hardware["rightEncoderCount"]
    left_speed = 0.0
    right_speed = 0.0
    if not _thread_active and _last_sample is not None:
        dt_ms = time.ticks_diff(now, _last_sample[0])
        if dt_ms > 0:
            millimeters_per_count = math.pi * 60.0 / 585.0
            left_speed = (
                (left_count - _last_sample[1]) * millimeters_per_count * 1000.0 / dt_ms
            )
            right_speed = (
                (right_count - _last_sample[2]) * millimeters_per_count * 1000.0 / dt_ms
            )
    _last_sample = (now, left_count, right_count)
    _sample_seq += 1
    return _sample_value(
        pose,
        hardware,
        _sample_seq,
        time.ticks_diff(now, _boot_ms),
        left_speed,
        right_speed,
    )


def _buffered_course_samples(after_sample_seq, maximum=None):
    """Read one ordered page from the bounded course-state ring."""
    try:
        from ucsb_xrp._telemetry import buffered_state_snapshots

        snapshots = buffered_state_snapshots(after_sample_seq)
    except (ImportError, AttributeError):
        # A service installed beside an older course package still exposes the
        # legacy single-sample response instead of failing the endpoint.
        snapshots = ()
    more = maximum is not None and len(snapshots) > maximum
    if more:
        snapshots = snapshots[:maximum]
    try:
        from ucsb_xrp._telemetry import hardware_snapshot

        mirrored_hardware = hardware_snapshot()
    except (ImportError, AttributeError):
        mirrored_hardware = None
    if not snapshots:
        return [], more
    hardware = (
        (mirrored_hardware or _last_hardware or _empty_hardware())
        if _thread_active
        else _read_hardware()
    )
    return [_course_sample(snapshot, hardware) for snapshot in snapshots], more


def _runtime_snapshot_json():
    try:
        from ucsb_xrp.live import runtime_snapshot_json

        value = runtime_snapshot_json()
        if not isinstance(value, str) or len(value) > 32768:
            raise ValueError("runtime snapshot is invalid")
        return value
    except Exception:
        return '{"revision":0,"parameters":[],"watches":[],"plots":[]}'


def _state_result(after_log_seq=0, maximum_logs=None):
    logs = [item for item in _logs if item["seq"] > after_log_seq]
    more_logs = maximum_logs is not None and len(logs) > maximum_logs
    if more_logs:
        logs = logs[:maximum_logs]
    value = {
        "bootId": _boot_id,
        "state": _state,
        "detail": _detail,
        "runId": _run_id,
        "project": _read_manifest(),
        "runtimeJson": _runtime_snapshot_json(),
        "logs": logs,
    }
    if maximum_logs is not None:
        value["moreLogs"] = more_logs
    return value


def _remember_reply(request_id, value):
    if request_id in _last_reply_by_id:
        return
    _last_reply_by_id[request_id] = value
    _reply_order.append(request_id)
    while len(_reply_order) > 20:
        old = _reply_order.pop(0)
        del _last_reply_by_id[old]


def _command(request, operation):
    request_id = None
    try:
        body = request.data if isinstance(request.data, dict) else {}
        request_id = validate_request_id(body.get("requestId"))
        previous = _last_reply_by_id.get(request_id)
        if previous is not None:
            return _json_response(previous)
        result = operation(body)
        value = protocol_reply(request_id, result=result)
        _remember_reply(request_id, value)
        return _json_response(value)
    except ProtocolError as exc:
        return _error_response(request_id, exc.code, exc.detail)
    except SyntaxError as exc:
        detail = "{}:{}:{}: {}".format(
            getattr(exc, "filename", "project"),
            getattr(exc, "lineno", 0),
            getattr(exc, "offset", 0),
            getattr(exc, "msg", str(exc)),
        )
        return _error_response(request_id, "syntax_error", detail, status=422)
    except Exception as exc:
        _append_log("stderr", type(exc).__name__ + ": " + str(exc))
        return _error_response(
            request_id,
            "internal_error",
            type(exc).__name__ + ": " + str(exc),
            status=500,
        )


@server.route("/api/v1/info")
def info(request):
    identity = _runtime_identity()
    return _json_response(
        {
            "protocol": PROTOCOL_VERSION,
            # Keep these two names for older clients while exposing the
            # independent compatibility fields used by current clients.
            "serviceVersion": identity["serviceVersion"],
            "courseRelease": identity["runtimeRelease"],
            "runtimeRelease": identity["runtimeRelease"],
            "runtimeReleaseSequence": identity["runtimeReleaseSequence"],
            "runtimeGeneration": identity["runtimeGeneration"],
            "runtimeManifestSha256": identity["runtimeManifestSha256"],
            "courseApiRevision": identity["courseApiRevision"],
            "courseLibraryVersion": identity["courseLibraryVersion"],
            "protocolRevision": identity["protocolRevision"],
            "bootstrapVersion": identity["bootstrapVersion"],
            "robotId": _robot_id(),
            "recoveryWatchdogMs": SERVICE_WATCHDOG_MS,
            "bootId": _boot_id,
            "robotName": network.hostname(),
            "address": _network_state["address"] if _network_state else None,
            "network": public_network_state(_network_state or {}),
            "project": _read_manifest(),
            "runtimeJson": _runtime_snapshot_json(),
            "capabilities": [
                "project.check",
                "project.prepare",
                "project.current",
                "program.run",
                "program.stop",
                "target.reset",
                "telemetry.poll",
                "logs.poll",
                "runtime.parameters",
            ],
        }
    )


@server.route("/api/v1/state")
def state(request):
    try:
        after = int(request.query.get("afterLogSeq", "0"))
    except ValueError:
        after = 0
    return _json_response(_state_result(after))


@server.route("/api/v1/telemetry")
def telemetry(request):
    try:
        after = int(request.query.get("afterLogSeq", "0"))
    except ValueError:
        after = 0
    try:
        after_sample = int(request.query.get("afterSampleSeq", "0"))
    except ValueError:
        after_sample = 0
    if after_sample < 0:
        after_sample = 0
    try:
        requested_run = int(request.query.get("runId", "0"))
    except ValueError:
        requested_run = 0
    if _thread_active and requested_run == _run_id:
        # A successful telemetry request is already proof that the controlling
        # browser is present. Renew the run here instead of requiring a second
        # serialized HTTP request before the next poll or a Stop command.
        _extend_run_lease(LEASE_MS)
    value = _state_result(after, TELEMETRY_LOG_BATCH_LIMIT)
    samples, more_samples = _buffered_course_samples(
        after_sample, TELEMETRY_SAMPLE_BATCH_LIMIT
    )
    value["moreSamples"] = more_samples
    if _thread_active and samples:
        sample = samples[-1]
    elif _thread_active:
        # No new Robot.step publication is available yet. Keep the legacy
        # latest-sample field for older clients, but an empty batch tells newer
        # clients not to duplicate it.
        sample = _hardware_sample()
    elif _launch_pending:
        sample = _sample_value(
            None,
            _last_hardware or _empty_hardware(),
            0,
            0,
            0.0,
            0.0,
        )
    elif more_samples:
        # Drain retained motion samples before publishing the final stopped
        # sample. Otherwise its newer sequence would make the browser skip the
        # remaining page and close a recording before all retained data arrives.
        sample = samples[-1]
    else:
        # Preserve any final course-loop samples not yet collected, then end
        # the batch with a fresh stopped sample. A newly opened Monitor must
        # never present the last moving wheel speed as the current ready state.
        sample = _hardware_sample()
        samples.append(sample)
    value["samples"] = samples
    value["sample"] = sample
    return _json_response(value)


@server.route("/api/v1/check", methods=["POST"])
def check(request):
    def operation(body):
        project = validate_project(body.get("project"))
        checked = _compile_project(project)
        return {"detail": "{} Python files compiled".format(checked)}

    return _command(request, operation)


@server.route("/api/v1/sync", methods=["POST"])
def sync(request):
    def operation(body):
        raise ProtocolError(
            "persistent_project_requires_usb",
            "persistent project installation requires USB setup/repair",
        )

    return _command(request, operation)


@server.route("/api/v1/prepare", methods=["POST"])
def prepare_project(request):
    def operation(body):
        if _thread_active or _launch_pending or _project_job is not None:
            raise ProtocolError("target_busy", "stop the program before preparing")
        execution_lock = _project_execution_lock
        if execution_lock is not None:
            execution_lock.acquire()
        try:
            # Core 1 may have been completing cleanup when the request arrived.
            # Hold the same execution boundary used by Run through validation,
            # compilation, inactive-volume construction, and final activation.
            if _thread_active or _launch_pending or _project_job is not None:
                raise ProtocolError(
                    "target_busy", "stop the program before preparing"
                )
            project = validate_project(body.get("project"))
            checked = _compile_project(project)
            manifest = _prepare_ram_project(project)
            _set_state("ready", "Project prepared in RAM")
            return {
                "detail": "Project prepared in RAM",
                "checked": checked,
                "project": manifest,
            }
        finally:
            if execution_lock is not None:
                execution_lock.release()

    return _command(request, operation)


@server.route("/api/v1/run", methods=["POST"])
def run_project(request):
    def operation(body):
        global _run_id, _launch_pending, _lease_deadline
        global _stop_acknowledged_run_id
        global _sample_seq, _sample_epoch_start_ms, _last_sample
        if _thread_active or _launch_pending or _project_job is not None:
            raise ProtocolError("target_busy", "a program is already running")
        execution_lock = _project_execution_lock
        if execution_lock is not None:
            execution_lock.acquire()
        try:
            if _thread_active or _launch_pending or _project_job is not None:
                raise ProtocolError("target_busy", "a program is already running")
            manifest = _read_manifest()
            if manifest is None:
                raise ProtocolError(
                    "no_project", "prepare a project before running"
                )
            slot_path = _active_project_path()
            if slot_path is None:
                raise ProtocolError(
                    "no_project", "prepare a project before running"
                )
            entrypoint = manifest["entrypoint"]
            with open(slot_path + "/" + entrypoint) as handle:
                source = handle.read()
            # Prepare the next run only after prior core-1 cleanup is complete.
            # The lock is released before deferred dispatch wakes the worker.
            entry_code = compile(source, entrypoint, "exec")
            startup_modules = _entrypoint_project_imports(manifest, source)
            _clear_project_modules(manifest)
            _stop_motors()
            from ucsb_xrp._telemetry import clear_state
            from ucsb_xrp._run_control import clear_stop
            from ucsb_xrp.live import clear as clear_runtime

            clear_state()
            clear_stop()
            clear_runtime()
            # The run ID and telemetry sequence together define one sample epoch.
            # The browser resets its cursor when the run changes, so every project
            # starts at sample 1 without colliding with prior idle telemetry.
            _sample_seq = 0
            _sample_epoch_start_ms = time.ticks_diff(time.ticks_ms(), _boot_ms)
            _last_sample = None
            gc.collect()
            _run_id += 1
            _stop_acknowledged_run_id = None
            _launch_pending = True
            _lease_deadline = None
            _set_state("loading", "Starting " + entrypoint)
            server.loop.create_task(
                _launch_project_after_response(
                    slot_path, entrypoint, entry_code, startup_modules, _run_id
                )
            )
            return {"detail": _detail, "runId": _run_id}
        finally:
            if execution_lock is not None:
                execution_lock.release()

    return _command(request, operation)


@server.route("/api/v1/parameter", methods=["POST"])
def set_runtime_parameter(request):
    def operation(body):
        if not _thread_active:
            raise ProtocolError("target_idle", "start a program before changing parameters")
        from ucsb_xrp.live import queue_update, runtime_snapshot_json

        try:
            queue_update(body.get("name"), body.get("value"))
        except (TypeError, ValueError) as exc:
            raise ProtocolError("invalid_parameter", str(exc))
        return {"runtimeJson": runtime_snapshot_json()}

    return _command(request, operation)


@server.route("/api/v1/lease", methods=["POST"])
def renew_lease(request):
    def operation(body):
        requested_run = body.get("runId")
        if _thread_active and requested_run == _run_id:
            _extend_run_lease(LEASE_MS)
        return {"state": _state, "runId": _run_id}

    return _command(request, operation)


@server.route("/api/v1/stop", methods=["POST"])
def stop(request):
    def operation(body):
        global _launch_pending, _lease_deadline
        _launch_pending = False
        _lease_deadline = None
        if _thread_active:
            _set_state("loading", "Stopping program")
            server.loop.create_task(_request_stop_after_response(_run_id))
            return {"detail": "Stopping program", "reconnecting": False}
        _stop_motors()
        _set_state("ready", "Program already stopped")
        return {"detail": "Program already stopped", "reconnecting": False}

    return _command(request, operation)


@server.route("/api/v1/reset", methods=["POST"])
def reset(request):
    def operation(body):
        global _launch_pending, _lease_deadline
        _launch_pending = False
        _lease_deadline = None
        if _thread_active:
            _set_state("loading", "Resetting program state")
            server.loop.create_task(_reset_course_run_after_response(_run_id))
            return {
                "detail": "Resetting program state",
                "reconnecting": False,
            }
        _clear_course_run_state()
        return {"detail": "Program state reset", "reconnecting": False}

    return _command(request, operation)


@server.catchall()
def catchall(request):
    if request.method == "OPTIONS":
        return _json_response({}, status=204)
    return _json_response(
        {"ok": False, "error": {"code": "not_found", "detail": "Unknown endpoint"}},
        status=404,
    )


async def _watch_run_lease():
    global _lease_deadline
    import uasyncio

    while True:
        if (
            _thread_active
            and _lease_deadline is not None
            and time.ticks_diff(_lease_deadline, time.ticks_ms()) <= 0
        ):
            _lease_deadline = None
            _set_state("error", "Run connection expired; restarting target service")
            _schedule_reset()
        await uasyncio.sleep_ms(200)


async def _feed_service_watchdog(watchdog):
    """Keep a hardware recovery path independent of the Python VM locks."""
    import uasyncio

    while True:
        if not _reset_pending:
            watchdog.feed()
        await uasyncio.sleep_ms(500)


async def _confirm_runtime_after_server_start():
    """Confirm a trial runtime on the first service event-loop turn."""
    import uasyncio

    # The coroutine cannot run until ``server.run`` has started its loop. At
    # that point all imports, hardware singletons, the program worker, Wi-Fi,
    # and recurring service tasks have already been prepared successfully.
    await uasyncio.sleep_ms(0)
    try:
        import course_boot

        confirmed = course_boot.confirm_active_runtime()
        if confirmed:
            _append_log("system", "Course runtime confirmed")
    except Exception as exc:
        _append_log(
            "stderr",
            "Could not confirm course runtime: {}: {}".format(
                type(exc).__name__, str(exc)
            ),
        )
        # An unconfirmed candidate must not appear healthy until a later reset
        # unexpectedly returns to the prior release. Reset now so the stable
        # bootstrap performs that fallback immediately.
        _schedule_reset()


def _connect_wifi(timeout_ms=20000, watchdog=None, activation=None):
    global _network_state
    if activation is None:
        config = json.load(open(CONFIG_PATH))
        activation = begin_network_activation(
            config,
            watchdog=watchdog,
            network_module=network,
        )
    _network_state = finish_network_activation(
        activation,
        timeout_ms=timeout_ms,
        watchdog=watchdog,
        time_module=time,
    )
    if not _network_state.get("ready") or not _network_state.get("address"):
        raise RuntimeError(
            "Wi-Fi setup failed with status {}".format(
                _network_state.get("status", "unknown")
            )
        )
    return _network_state["address"]


def run(watchdog=None, network_activation=None):
    global _service_watchdog
    if watchdog is None:
        watchdog = machine.WDT(timeout=SERVICE_WATCHDOG_MS)
    _service_watchdog = watchdog
    # Phew otherwise appends one line to flash after every HTTP response and
    # periodically rewrites that file. Telemetry polling must never create
    # hidden flash traffic or block the event loop that feeds the watchdog.
    _disable_http_flash_logging()
    watchdog.feed()
    _stop_motors()
    watchdog.feed()
    # MicroPython filesystem imports are not reliable when first performed on
    # the second core. Load the shared course packages once on the service core;
    # student threads then reuse the normal module cache.
    import ucsb_xrp
    import ucsb_xrp_reference
    _append_log("system", "Course API loaded")
    watchdog.feed()
    from XRPLib.board import Board
    from XRPLib.encoded_motor import EncodedMotor
    from XRPLib.imu import IMU
    from XRPLib.rangefinder import Rangefinder
    watchdog.feed()

    # Resolve the singleton drivers before the student thread begins. In
    # addition to avoiding second-core filesystem imports, this gives service
    # telemetry and course code the same XRPLib device instances.
    Board.get_default_board()
    watchdog.feed()
    EncodedMotor.get_default_encoded_motor(index=1)
    EncodedMotor.get_default_encoded_motor(index=2)
    watchdog.feed()
    IMU.get_default_imu()
    Rangefinder.get_default_rangefinder()
    _append_log("system", "XRP hardware interfaces ready")
    watchdog.feed()

    # Creating the mountpoint entries can touch internal flash on a new board.
    # Do it once before core 1 starts; project files themselves live only in
    # bytearrays. The worker then remains blocked on its wake lock between runs
    # for the service lifetime.
    _initialize_project_worker(watchdog)
    _append_log("system", "Program runner ready")
    watchdog.feed()

    address = _connect_wifi(
        watchdog=watchdog,
        activation=network_activation,
    )
    identity = _runtime_identity()
    _append_log(
        "system",
        "Course service {} at {} ({})".format(
            identity["serviceVersion"], address, _network_state["mode"]
        ),
    )
    print("UCSB XRP course service at http://{}".format(address))
    server.loop.create_task(_feed_service_watchdog(watchdog))
    server.loop.create_task(_watch_run_lease())
    server.loop.create_task(_confirm_runtime_after_server_start())
    server.run(host="0.0.0.0", port=80)
