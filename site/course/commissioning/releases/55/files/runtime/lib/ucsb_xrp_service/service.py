"""HTTP target service for the current RP2350 XRP.

The service is deliberately private infrastructure. Student code sees only
``ucsb_xrp`` and XRPLib. Browser clients use a small JSON API over either the
XRP access point or an ordinary local network; polling keeps the implementation
dependable on stock MicroPython.
"""

import gc
import hashlib
import builtins
import io
import json
import math
import os
import struct
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
    STATION_CONNECT_TIMEOUT_MS,
    begin_network_activation,
    current_network_state,
    finish_network_activation,
    poll_network_activation,
    public_network_state,
)
from .diagnostics import record_fault, flush_pending


COURSE_RELEASE = "2026.09-dev.50"
REQUIRED_MICROPYTHON_VERSION = "1.29.0"
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
TELEMETRY_LOG_BATCH_LIMIT = LOG_LIMIT
# Keep the temporary JSON allocation near the previous eight-record worst case.
# Short student output can fill the larger page, while escaped or maximum-length
# records continue on a later cursor page before whole-response serialization.
TELEMETRY_LOG_PAGE_BYTES = 48 * 1024
# One response can drain nearly half of the 50 Hz course-loop ring. This keeps
# local Wi-Fi request overhead from accumulating a backlog during short runs.
TELEMETRY_SAMPLE_BATCH_LIMIT = 24
COMPACT_TELEMETRY_ENCODING = "row-v1"
PACKED_TELEMETRY_ENCODING = "packed-v1"
PACKED_TELEMETRY_SAMPLE_BATCH_LIMIT = 16
SAMPLE_PLOT_PAGE_BYTES = 16384
MAX_WORLD_BYTES = 16384
REPLY_CACHE_BYTES = 32768
PACKED_TELEMETRY_MAGIC = b"UXT1"
PACKED_TELEMETRY_ROW_FORMAT = "<IIBB13fiifB"
PACKED_TELEMETRY_SHARED_FORMAT = "<H8fH"
IDLE_TELEMETRY_CADENCE_MS = 250
TELEMETRY_POLL_OWNER_LEASE_MS = IDLE_TELEMETRY_CADENCE_MS * 3
TELEMETRY_POLL_OWNER_MAX_CHARS = 64
STOP_GRACE_MS = 2500
PROJECT_WORKER_IDLE_MS = 5
PROJECT_WORKER_START_TIMEOUT_MS = 500
DEBUG_DIAGNOSTICS = True

_boot_ms = time.ticks_ms()
try:
    # RP2 reports deliberate machine.reset() through the watchdog cause too.
    # Retain the raw boot observation without inferring why it restarted.
    _boot_reset_cause = machine.reset_cause()
except Exception:
    _boot_reset_cause = None
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
_log_lock = _thread.allocate_lock()
_sample_seq = 0
_sample_epoch_start_ms = 0
_last_sample = None
_last_hardware = None
_idle_hardware = None
_idle_hardware_ticks_ms = None
_idle_sample = None
_telemetry_poll_generation = None
_telemetry_poll_owner = None
_telemetry_poll_lease_deadline = None
_active_ram_slot = None
_active_ram_manifest = None
_ram_project_volumes = {"a": None, "b": None}
_last_project_module_names = []
_last_reply_by_id = {}
_reply_order = []
_reply_cache_bytes = 0
_control_session = None
_control_generation = 0
_control_deadline = None
_network_state = None
_network_activation = None
_reset_pending = False
_reset_task_scheduled = False
_motor_stop_failure = None
_motor_recovery_requested = False
_command_phase = None
_command_source_path = None
_reported_imu_error = None


def _execution_active():
    return _thread_active or _launch_pending or _project_job is not None


def _firmware_identity():
    """Report the running interpreter independently of the installed course files."""
    implementation = sys.implementation
    version = implementation.version
    return {
        "implementation": implementation.name,
        "version": "{}.{}.{}".format(version[0], version[1], version[2]),
        "board": os.uname().machine,
        "mpy": getattr(implementation, "_mpy", None),
    }


def _require_supported_firmware():
    identity = _firmware_identity()
    board = identity["board"].lower()
    if (
        identity["implementation"] != "micropython"
        or identity["version"] != REQUIRED_MICROPYTHON_VERSION
        or "sparkfun xrp controller" not in board
        or "rp2350" not in board
    ):
        raise ProtocolError(
            "firmware_required",
            "This XRP needs the course MicroPython {} firmware. "
            "Open Setup and repair the XRP over USB before running a project.".format(
                REQUIRED_MICROPYTHON_VERSION
            ),
        )


def _control_state():
    remaining = (
        max(0, time.ticks_diff(_control_deadline, time.ticks_ms()))
        if _control_deadline is not None else 0
    )
    return {
        "sessionId": _control_session if remaining or _execution_active() else None,
        "generation": _control_generation,
        "leaseRemainingMs": remaining,
        "runId": _run_id,
    }


def _validate_epoch(body):
    if body.get("bootId") != _boot_id:
        raise ProtocolError("boot_changed", "The XRP restarted; reconnect before this operation")
    if "runId" in body and (type(body["runId"]) is not int or body["runId"] != _run_id):
        raise ProtocolError("stale_run", "This request belongs to an earlier run")


def _authorize_control(body):
    _validate_epoch(body)
    if "runId" not in body:
        raise ProtocolError("stale_run", "An explicit run identity is required")
    if _reset_pending:
        raise ProtocolError("target_restarting", "The XRP is restarting; wait for reconnection")
    control = _control_state()
    if (
        not control["sessionId"]
        or body.get("sessionId") != control["sessionId"]
        or type(body.get("controlGeneration")) is not int
        or body.get("controlGeneration") != _control_generation
        or control["leaseRemainingMs"] <= 0
    ):
        raise ProtocolError("control_required", "Another session controls this XRP; claim control while stopped")


def _renew_control(duration_ms=LEASE_MS):
    global _control_deadline
    candidate = time.ticks_add(time.ticks_ms(), duration_ms)
    if _control_deadline is None or time.ticks_diff(candidate, _control_deadline) > 0:
        _control_deadline = candidate


def _query_controls_run(query):
    try:
        return (
            query.get("bootId") == _boot_id
            and query.get("sessionId") == _control_session
            and int(query.get("controlGeneration", "0")) == _control_generation
            and int(query.get("runId", "-1")) == _run_id
            and _control_state()["leaseRemainingMs"] > 0
        )
    except (TypeError, ValueError):
        return False


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


def _packed_telemetry_response(
    value, packed_shared, packed_rows, status=200
):
    """Frame state metadata, shared diagnostics, then fixed-width rows."""
    metadata = json.dumps(value, separators=(",", ":")).encode("utf-8")
    # A page with long Unicode live descriptors may leave less space for log
    # lines. Retain those lines for the next cursor page instead of exceeding
    # the browser's 64 KiB metadata decoder boundary.
    while len(metadata) > 60000 and value.get("logs"):
        value["logs"].pop()
        value["moreLogs"] = True
        metadata = json.dumps(value, separators=(",", ":")).encode("utf-8")
    body = (
        PACKED_TELEMETRY_MAGIC
        + struct.pack("<I", len(metadata))
        + metadata
        + packed_shared
        + packed_rows
    )
    headers = _cors_headers()
    headers["Content-Type"] = "application/octet-stream"
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
    record = {
        "seq": None,
        "tMs": time.ticks_diff(time.ticks_ms(), _boot_ms),
        "runId": _run_id,
        "stream": stream,
        "line": line,
    }
    # RP2 runs both Python cores without a GIL. Sequence assignment, list
    # growth and compaction must therefore share one explicit boundary.
    _log_lock.acquire()
    try:
        _log_seq += 1
        record["seq"] = _log_seq
        _logs.append(record)
        if len(_logs) > LOG_LIMIT:
            del _logs[: len(_logs) - LOG_LIMIT]
    finally:
        _log_lock.release()


def _set_state(state, detail):
    global _state, _detail
    _log_lock.acquire()
    try:
        _state = state
        _detail = detail
    finally:
        _log_lock.release()
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


def _clear_telemetry_poll_owner():
    global _telemetry_poll_generation, _telemetry_poll_owner
    global _telemetry_poll_lease_deadline
    _telemetry_poll_generation = None
    _telemetry_poll_owner = None
    _telemetry_poll_lease_deadline = None


def _telemetry_poll_identity(query):
    """Return one valid generated-poller identity or the legacy identity."""
    raw_generation = query.get("pollGeneration")
    try:
        generation = int(raw_generation)
    except (TypeError, ValueError):
        return None, None
    if generation <= 0:
        return None, None

    owner = query.get("pollOwner")
    if (
        not isinstance(owner, str)
        or not owner
        or len(owner) > TELEMETRY_POLL_OWNER_MAX_CHARS
    ):
        return None, None
    return generation, owner


def _begin_telemetry_poll(query):
    """Claim or verify the short lease protecting telemetry response work."""
    global _telemetry_poll_generation, _telemetry_poll_owner
    global _telemetry_poll_lease_deadline
    generation, owner = _telemetry_poll_identity(query)
    now = time.ticks_ms()
    if (
        _telemetry_poll_lease_deadline is not None
        and time.ticks_diff(_telemetry_poll_lease_deadline, now) <= 0
    ):
        _clear_telemetry_poll_owner()

    active = (
        _telemetry_poll_generation is not None
        and _telemetry_poll_lease_deadline is not None
    )
    accepted = not active
    if active:
        accepted = (
            generation is not None
            and (
                generation > _telemetry_poll_generation
                or (
                    generation == _telemetry_poll_generation
                    and owner == _telemetry_poll_owner
                )
            )
        )

    if not accepted:
        remaining_ms = max(
            0, time.ticks_diff(_telemetry_poll_lease_deadline, now)
        )
        return (
            False,
            generation,
            owner,
            {
                "accepted": False,
                "ownerGeneration": _telemetry_poll_generation,
                "leaseRemainingMs": remaining_ms,
            },
        )

    if generation is None:
        return True, None, None, None

    _telemetry_poll_generation = generation
    _telemetry_poll_owner = owner
    # Establish ownership during the synchronous handler. The deadline is
    # renewed after response serialization so slow hardware work cannot consume
    # the useful lease seen by the next request.
    _telemetry_poll_lease_deadline = time.ticks_add(
        now, TELEMETRY_POLL_OWNER_LEASE_MS
    )
    return (
        True,
        generation,
        owner,
        {"accepted": True, "ownerGeneration": generation},
    )


def _renew_telemetry_poll_owner(generation, owner):
    global _telemetry_poll_lease_deadline
    if (
        generation is None
        or generation != _telemetry_poll_generation
        or owner != _telemetry_poll_owner
    ):
        return
    _telemetry_poll_lease_deadline = time.ticks_add(
        time.ticks_ms(), TELEMETRY_POLL_OWNER_LEASE_MS
    )


def _invalidate_idle_telemetry():
    global _idle_hardware, _idle_hardware_ticks_ms, _idle_sample
    _idle_hardware = None
    _idle_hardware_ticks_ms = None
    _idle_sample = None


def _feed_watchdog_now():
    """Feed the service watchdog during synchronous project work."""
    if _service_watchdog is not None:
        _service_watchdog.feed()


def _disable_http_flash_logging():
    """Keep Phew request accounting out of the controller filesystem."""
    phew_logging.disable_logging_types(phew_logging.LOG_ALL)


def _stop_motors():
    global _motor_stop_failure, _motor_recovery_requested, _reset_pending
    first_error = None
    try:
        from XRPLib.encoded_motor import EncodedMotor

        for index in (1, 2):
            try:
                EncodedMotor.get_default_encoded_motor(index=index).set_effort(0.0)
            except Exception as exc:
                if first_error is None:
                    first_error = exc
    except Exception as exc:
        first_error = exc
    if first_error is not None and _motor_stop_failure is None:
        _motor_stop_failure = first_error
        # This function also runs on core 1. Publish a recovery request here;
        # only the service core may schedule an asyncio reset task.
        _motor_recovery_requested = True
        _reset_pending = True
        _set_state("error", "Motor stop could not be confirmed; restarting the XRP")
        _record_runtime_fault("hardware.motor_stop_failed", first_error, _diagnostic_context("stop_motors", phase="motor_zero"))
    return _motor_stop_failure is None


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
    global _command_phase, _command_source_path
    _command_phase = "prepare_volume"
    _command_source_path = None
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


MAX_COMPILER_TRACEBACK_BYTES = 4096


class _CompilerTraceback(io.IOBase):
    """Keep the recent source frames without retaining an unbounded traceback."""

    def __init__(self):
        self.data = bytearray()
        self.truncated = False

    def write(self, data):
        size = len(data)
        self.truncated = self.truncated or len(self.data) + size > MAX_COMPILER_TRACEBACK_BYTES
        self.data.extend(data[-MAX_COMPILER_TRACEBACK_BYTES:])
        self.data = self.data[-MAX_COMPILER_TRACEBACK_BYTES:]
        return size

    def getvalue(self):
        # A retained UTF-8 tail may begin inside a multibyte character.
        start = 0
        while start < len(self.data) and self.data[start] & 0xC0 == 0x80:
            start += 1
        text = self.data[start:].decode()
        return ("[Earlier traceback text omitted]\n" if self.truncated else "") + text


def _syntax_error_detail(exception, source_path=None):
    # MicroPython stores the compiler location in its traceback, not the
    # filename/lineno attributes provided by CPython's SyntaxError.
    try:
        output = _CompilerTraceback()
        sys.print_exception(exception, output)
        text = output.getvalue().strip()
        if text:
            if source_path and 'File "{}"'.format(source_path) not in text:
                # Retain a known compile input even when no source frame exists.
                text = '  File "{}"\n'.format(str(source_path)[:160]) + text
            return text
    except Exception:
        pass

    # Host tests and a runtime without traceback printing can still report
    # an explicitly supplied location. Missing positions remain missing.
    path = getattr(exception, "filename", None) or source_path
    line = getattr(exception, "lineno", None)
    frame = '  File "{}"'.format(str(path)[:160]) if path else ""
    if frame and type(line) is int and line > 0:
        frame += ", line {}".format(line)
    message = getattr(exception, "msg", None) or str(exception)
    summary = type(exception).__name__ + ": " + str(message)[:MAX_COMPILER_TRACEBACK_BYTES]
    return (frame + "\n" if frame else "") + summary


def _compile_project(project):
    global _command_phase, _command_source_path
    checked = 0
    for path, source in project["files"].items():
        if path.endswith(".py"):
            _command_phase = "compile"
            _command_source_path = path
            _feed_watchdog_now()
            compile(source, path, "exec")
            checked += 1
            _feed_watchdog_now()
    return checked


def _diagnostic_context(operation=None, request_id=None, phase=None):
    return {
        "operation": operation,
        "requestId": request_id,
        "bootId": _boot_id,
        "runId": _run_id,
        "controlGeneration": _control_generation,
        "phase": phase if phase is not None else _command_phase,
        "sourcePath": _command_source_path,
        # RP2350 PSRAM heap scans take about 160 ms on the course controller.
        # Fault persistence may measure memory while idle; command diagnostics
        # must not delay Stop or block the program core's allocator.
        "freeBytes": None,
        "runtimeRelease": _runtime_identity().get("runtimeRelease", COURSE_RELEASE),
    }


def _record_runtime_fault(event, exc, context):
    """Preserve the failing operation and traceback before the next reset."""
    fault_id = record_fault(event, exc, context)
    try:
        prefix = "XRP runtime fault" + (" " + fault_id if fault_id else "")
        _append_log("stderr", prefix + " " + json.dumps(context))
        trace = io.StringIO()
        sys.print_exception(exc, trace)
        _append_log("stderr", trace.getvalue()[-8192:].strip())
    except Exception:
        try:
            _append_log("stderr", type(exc).__name__ + ": " + str(exc))
        except Exception:
            pass  # Fault reporting must not replace the original exception.
    return fault_id


def _http_runtime_fault(exc, request, phase):
    """Correlate route failures without collecting queries, headers or bodies."""
    operation = "http"
    request_id = None
    if request is not None:
        operation = "{} {}".format(request.method, request.path)
        body = getattr(request, "data", None)
        if isinstance(body, dict):
            try:
                request_id = validate_request_id(body.get("requestId"))
            except ProtocolError:
                pass
    context = _diagnostic_context(operation, request_id, phase)
    context["sourcePath"] = None
    return _record_runtime_fault("http.exception", exc, context)


def _initialize_optional_imu(retry=False):
    global _reported_imu_error
    from ucsb_xrp._hardware import get_course_imu, course_imu_error

    imu = get_course_imu(retry=retry)
    error = course_imu_error()
    if error is not None and error is not _reported_imu_error:
        _reported_imu_error = error
        _record_runtime_fault("hardware.imu_unavailable", error, _diagnostic_context("initialize_imu", phase="hardware"))
        _append_log("system", "IMU measurements are unavailable; other robot functions remain available. Reset retries the IMU.")
    elif error is None:
        _reported_imu_error = None
    return imu


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
        record_fault("program.exception", exc, _diagnostic_context("run", phase="program"))
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
        motors_stopped = _stop_motors()
        stdout.flush()
        if inserted_path:
            try:
                sys.path.remove(slot_path)
            except ValueError:
                pass
        os.chdir(previous_cwd)
        _lease_deadline = None
        _thread_active = False
        if run_id == _run_id and motors_stopped is not False and not _reset_pending:
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
                    _thread_active = True
                    try:
                        motors_stopped = _stop_motors()
                        detail = "Project worker recovered from {}: {}".format(
                            type(exc).__name__, str(exc)
                        )
                        _record_runtime_fault("worker.exception", exc, _diagnostic_context("run", phase="worker_cleanup"))
                        if motors_stopped is not False and not _reset_pending:
                            _set_state("error", detail)
                    finally:
                        _lease_deadline = None
                        _thread_active = False
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
    _renew_control(STARTUP_LEASE_MS)
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
    # Retain fault evidence only after the program core has retired. Never
    # delay recovery waiting for the execution lock of an unresponsive core.
    execution_lock = _project_execution_lock
    if not _project_worker_ready and not _execution_active():
        acquired = execution_lock is None or execution_lock.acquire(False)
        if acquired:
            try:
                flush_pending()
            finally:
                if execution_lock is not None:
                    execution_lock.release()
    machine.reset()


def _schedule_reset(delay_ms=220):
    # Hardware Timer callbacks run in interrupt context, where importing and
    # reset setup are unreliable. An event-loop task lets the HTTP response
    # leave first, then resets in ordinary MicroPython execution context.
    global _reset_pending, _reset_task_scheduled, _motor_recovery_requested
    _reset_pending = True
    _motor_recovery_requested = False
    if _reset_task_scheduled:
        return
    _reset_task_scheduled = True
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
        record_fault("program.stop_timeout", RuntimeError("Program did not acknowledge Stop"), _diagnostic_context("stop", phase="cooperative_stop"))
        _set_state("error", "Program did not stop; restarting target service")
        _schedule_reset()


def _clear_course_run_state(detail="Program state reset"):
    """Return the course runtime to its idle state without rebooting Wi-Fi."""
    global _sample_seq, _sample_epoch_start_ms, _last_sample
    global _stop_acknowledged_run_id
    if _stop_motors() is False:
        _schedule_reset(0)
        return False
    _initialize_optional_imu(retry=True)
    from ucsb_xrp._telemetry import clear_state
    from ucsb_xrp._run_control import clear_stop
    from ucsb_xrp.live import clear as clear_runtime

    clear_state()
    clear_stop()
    clear_runtime()
    _sample_seq = 0
    _sample_epoch_start_ms = time.ticks_diff(time.ticks_ms(), _boot_ms)
    _last_sample = None
    _invalidate_idle_telemetry()
    _stop_acknowledged_run_id = None
    _set_state("ready", detail)
    return True


async def _reset_course_run_after_response(run_id):
    """Stop the current program, then reset only its course-visible state."""
    import uasyncio

    await uasyncio.sleep_ms(LAUNCH_AFTER_RESPONSE_MS)
    if run_id != _run_id or _reset_pending:
        return
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
    if run_id != _run_id or _reset_pending:
        return
    execution_lock = _project_execution_lock
    if execution_lock is not None:
        execution_lock.acquire()
    try:
        if run_id == _run_id and not _execution_active() and not _reset_pending:
            _clear_course_run_state()
    finally:
        if execution_lock is not None:
            execution_lock.release()


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
        from ucsb_xrp._hardware import get_course_imu, get_course_rangefinder, read_imu_diagnostics

        values["leftEncoderCount"] = int(
            EncodedMotor.get_default_encoded_motor(index=1).get_position_counts()
        )
        values["rightEncoderCount"] = int(
            EncodedMotor.get_default_encoded_motor(index=2).get_position_counts()
        )
        values["rangeMm"] = get_course_rangefinder().read()[2]
        board = Board.get_default_board()
        values["buttonPressed"] = bool(board.is_button_pressed())
        values["batteryV"] = float(board.get_battery_voltage())
        imu = get_course_imu()
        if imu is not None:
            acceleration, angular_rate, temperature = read_imu_diagnostics(imu)
            values["accelerationMg"] = acceleration
            values["angularRateMdps"] = angular_rate
            values["temperatureC"] = temperature
        else:
            values["sensorError"] = "IMU unavailable; Reset retries initialization"
    except Exception as exc:
        values["sensorError"] = type(exc).__name__ + ": " + str(exc)
    _last_hardware = values
    return values


def _normalize_range_mm(raw_range_cm):
    """Convert one XRPLib range reading, rejecting its timeout sentinel."""
    if isinstance(raw_range_cm, bool) or not isinstance(raw_range_cm, (int, float)):
        return None
    range_cm = float(raw_range_cm)
    if not math.isfinite(range_cm) or range_cm <= 0 or range_cm > 400:
        return None
    return range_cm * 10.0


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


def _sample_plot_values(pose):
    values = None if pose is None else pose.get("plotValues")
    if values is None:
        return None
    return [
        {"name": name, "label": label, "unit": unit, "value": value}
        for name, label, unit, value in values
    ]


def _sample_value(pose, hardware, sequence, time_ms, left_speed, right_speed):
    """Build one wire sample without reading any device."""
    pose_available = pose is not None and pose.get("poseAvailable", True)
    diagnostics = None if pose is None else pose.get("diagnostics")
    if diagnostics is None:
        diagnostics = _compact_telemetry_shared(hardware)
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
        "poseAvailable": pose_available,
        "xMm": 0.0 if pose is None else pose["xMm"],
        "yMm": 0.0 if pose is None else pose["yMm"],
        "headingRad": 0.0 if pose is None else pose["headingRad"],
        "estimatedPoseAvailable": pose_available,
        "estimatedXmm": pose["xMm"] if pose_available else None,
        "estimatedYmm": pose["yMm"] if pose_available else None,
        "estimatedHeadingRad": pose["headingRad"] if pose_available else None,
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
            if pose is None
            else pose["rangeMm"]
        ),
        "buttonPressed": (
            hardware["buttonPressed"]
            if pose is None
            else pose["buttonPressed"]
        ),
        "accelerationMg": diagnostics[0],
        "angularRateMdps": diagnostics[1],
        "temperatureC": diagnostics[2],
        "batteryV": diagnostics[3],
        "sensorError": diagnostics[4],
        "plotValues": _sample_plot_values(pose),
        "timingValues": None if pose is None else pose.get("timing"),
    }


def _course_sample_identity(pose):
    """Resolve one retained publication's stable wire sequence and time."""
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
    return sequence, time_ms


def _course_sample(pose, hardware):
    """Translate one retained Robot.step publication without device I/O."""
    sequence, time_ms = _course_sample_identity(pose)
    return _sample_value(
        pose,
        hardware,
        sequence,
        time_ms,
        pose["leftWheelSpeedMmS"],
        pose["rightWheelSpeedMmS"],
    )


def _idle_hardware_snapshot():
    """Return one stationary peripheral read for the whole idle cadence."""
    global _idle_hardware, _idle_hardware_ticks_ms, _idle_sample
    now = time.ticks_ms()
    if _idle_hardware is not None and _idle_hardware_ticks_ms is not None:
        age_ms = time.ticks_diff(now, _idle_hardware_ticks_ms)
        if 0 <= age_ms < IDLE_TELEMETRY_CADENCE_MS:
            return _idle_hardware, _idle_hardware_ticks_ms

    hardware = _read_hardware()
    sampled_at_ms = time.ticks_ms()
    _idle_hardware = hardware
    _idle_hardware_ticks_ms = sampled_at_ms
    _idle_sample = None
    return hardware, sampled_at_ms


def _hardware_sample():
    global _sample_seq, _last_sample, _idle_sample
    if not _thread_active:
        hardware, sampled_at_ms = _idle_hardware_snapshot()
        if _idle_sample is not None:
            return _idle_sample
        try:
            from ucsb_xrp._telemetry import state_snapshot

            pose = state_snapshot()
        except Exception:
            pose = None

        left_count = hardware["leftEncoderCount"]
        right_count = hardware["rightEncoderCount"]
        left_speed = 0.0
        right_speed = 0.0
        if _last_sample is not None:
            dt_ms = time.ticks_diff(sampled_at_ms, _last_sample[0])
            if dt_ms > 0:
                millimeters_per_count = math.pi * 60.0 / 585.0
                left_speed = (
                    (left_count - _last_sample[1])
                    * millimeters_per_count
                    * 1000.0
                    / dt_ms
                )
                right_speed = (
                    (right_count - _last_sample[2])
                    * millimeters_per_count
                    * 1000.0
                    / dt_ms
                )
        _last_sample = (sampled_at_ms, left_count, right_count)
        _sample_seq += 1
        _idle_sample = _sample_value(
            pose,
            hardware,
            _sample_seq,
            time.ticks_diff(sampled_at_ms, _boot_ms),
            left_speed,
            right_speed,
        )
        # Idle rows combine a fresh hardware view with the final odometry pose;
        # they are not another acquisition of the completed course state.
        _idle_sample["timingValues"] = None
        for key in (
            "leftEncoderCount", "rightEncoderCount", "rangeMm", "buttonPressed",
            "accelerationMg", "angularRateMdps", "temperatureC", "batteryV", "sensorError",
        ):
            _idle_sample[key] = hardware.get(key)
        _idle_sample["leftEffort"] = hardware.get("leftEffort", 0.0)
        _idle_sample["rightEffort"] = hardware.get("rightEffort", 0.0)
        for key in (
            "requestedForwardSpeedMmS", "requestedTurnRateRadS",
            "targetLeftWheelSpeedMmS", "targetRightWheelSpeedMmS",
        ):
            _idle_sample[key] = None
        return _idle_sample

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
    # course state and the latest stationary peripheral sample.
    hardware = mirrored_hardware or _last_hardware or _empty_hardware()
    if pose is not None:
        return _course_sample(pose, hardware)
    return _sample_value(None, hardware, 0, 0, 0.0, 0.0)


def _buffered_course_page(after_sample_seq, maximum=None):
    """Read retained publications and their shared hardware snapshot."""
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
    descriptors = set()
    plot_bytes = 0
    for index, snapshot in enumerate(snapshots):
        plots = snapshot.get("plotValues") or ()
        new_descriptors = set((item[0], item[1], item[2]) for item in plots) - descriptors
        # Count the actual encoded descriptor bytes once per page. Numeric
        # pairs have a conservative fixed allowance; values are finite.
        added = len(plots) * 40 + sum(
            len(json.dumps({"name": item[0], "label": item[1], "unit": item[2]}).encode("utf-8"))
            for item in new_descriptors
        )
        if index and plot_bytes + added > SAMPLE_PLOT_PAGE_BYTES:
            snapshots = snapshots[:index]
            more = True
            break
        descriptors.update(new_descriptors)
        plot_bytes += added
    try:
        from ucsb_xrp._telemetry import hardware_snapshot

        mirrored_hardware = hardware_snapshot()
    except (ImportError, AttributeError):
        mirrored_hardware = None
    if not snapshots:
        return (), None, more
    hardware = (
        mirrored_hardware or _last_hardware or _empty_hardware()
        if _thread_active
        else _idle_hardware_snapshot()[0]
    )
    return snapshots, hardware, more


def _buffered_course_samples(after_sample_seq, maximum=None):
    """Expand one ordered page for the legacy object wire format."""
    snapshots, hardware, more = _buffered_course_page(after_sample_seq, maximum)
    return [_course_sample(snapshot, hardware) for snapshot in snapshots], more


def _compact_telemetry_row(sample):
    """Encode one physical sample without repeating JSON field names."""
    return [
        sample["tMs"],
        sample["seq"],
        sample["poseAvailable"],
        sample["xMm"],
        sample["yMm"],
        sample["headingRad"],
        sample.get("requestedForwardSpeedMmS"),
        sample.get("requestedTurnRateRadS"),
        sample.get("targetLeftWheelSpeedMmS"),
        sample.get("targetRightWheelSpeedMmS"),
        sample["leftEffort"],
        sample["rightEffort"],
        sample["leftWheelSpeedMmS"],
        sample["rightWheelSpeedMmS"],
        sample.get("leftWheelDistanceMm"),
        sample.get("rightWheelDistanceMm"),
        sample["leftEncoderCount"],
        sample["rightEncoderCount"],
        sample["rangeMm"],
        sample["buttonPressed"],
    ]


def _compact_course_telemetry_row(pose, hardware):
    """Encode one retained publication without allocating a wire dictionary."""
    sequence, time_ms = _course_sample_identity(pose)
    left_count = (
        hardware["leftEncoderCount"]
        if pose.get("leftEncoderCount") is None
        else pose["leftEncoderCount"]
    )
    right_count = (
        hardware["rightEncoderCount"]
        if pose.get("rightEncoderCount") is None
        else pose["rightEncoderCount"]
    )
    return [
        time_ms,
        sequence,
        pose.get("poseAvailable", True),
        pose["xMm"],
        pose["yMm"],
        pose["headingRad"],
        pose.get("requestedForwardSpeedMmS"),
        pose.get("requestedTurnRateRadS"),
        pose.get("targetLeftWheelSpeedMmS"),
        pose.get("targetRightWheelSpeedMmS"),
        pose["leftEffort"],
        pose["rightEffort"],
        pose["leftWheelSpeedMmS"],
        pose["rightWheelSpeedMmS"],
        pose.get("leftWheelDistanceMm"),
        pose.get("rightWheelDistanceMm"),
        left_count,
        right_count,
        pose["rangeMm"],
        pose["buttonPressed"],
    ]


def _compact_telemetry_shared(sample):
    """Return hardware diagnostics shared by every row in one sample page."""
    return [
        sample["accelerationMg"],
        sample["angularRateMdps"],
        sample["temperatureC"],
        sample["batteryV"],
        sample["sensorError"],
    ]


def _pack_telemetry_rows(rows):
    """Pack compact rows without repeating JSON punctuation or number text."""
    packed = bytearray()
    for row in rows:
        null_mask = 0
        for bit, index in enumerate((6, 7, 8, 9, 14, 15, 18)):
            if row[index] is None:
                null_mask |= 1 << bit
        packed.extend(
            struct.pack(
                PACKED_TELEMETRY_ROW_FORMAT,
                int(row[0]),
                int(row[1]),
                1 if row[2] else 0,
                null_mask,
                *[0.0 if value is None else float(value) for value in row[3:16]],
                int(row[16]),
                int(row[17]),
                0.0 if row[18] is None else float(row[18]),
                1 if row[19] else 0,
            )
        )
    return bytes(packed)


def _pack_telemetry_shared(shared):
    """Pack page-wide diagnostics once, with exact nullable-value markers."""
    acceleration, angular_rate, temperature, battery, sensor_error = shared
    values = []
    null_mask = 0
    for vector in (acceleration, angular_rate):
        if vector is None:
            for _ in range(3):
                null_mask |= 1 << len(values)
                values.append(0.0)
        else:
            values.extend(float(value) for value in vector)
    for value in (temperature, battery):
        if value is None:
            null_mask |= 1 << len(values)
            values.append(0.0)
        else:
            values.append(float(value))
    if sensor_error is None:
        null_mask |= 1 << 8
        error_bytes = b""
    else:
        # Sensor errors are status text, not an unbounded transport channel.
        # Slice characters before encoding so UTF-8 remains complete.
        error_bytes = str(sensor_error)[:512].encode("utf-8")
    return struct.pack(
        PACKED_TELEMETRY_SHARED_FORMAT,
        null_mask,
        *values,
        len(error_bytes),
    ) + error_bytes


def _runtime_snapshot_json():
    try:
        from ucsb_xrp.live import runtime_snapshot_json

        value = runtime_snapshot_json()
        if not isinstance(value, str) or len(value.encode("utf-8")) > 32768:
            raise ValueError("runtime snapshot is invalid")
        return value
    except Exception:
        return '{"revision":0,"parameters":[],"watches":[],"plots":[]}'


def _state_result(after_log_seq=0, maximum_logs=None):
    _log_lock.acquire()
    try:
        retained_logs = tuple(_logs)
        state, detail = _state, _detail
    finally:
        _log_lock.release()
    pending_logs = [item for item in retained_logs if item["seq"] > after_log_seq]
    logs = pending_logs
    more_logs = False
    if maximum_logs is not None:
        logs = []
        page_bytes = 2  # JSON array brackets.
        for item in pending_logs[:maximum_logs]:
            # Use the response serializer itself so escaping and UTF-8 expansion
            # are included without retaining a second serialized page in memory.
            item_bytes = len(
                json.dumps(item, separators=(",", ":")).encode("utf-8")
            )
            next_bytes = page_bytes + (1 if logs else 0) + item_bytes
            if logs and next_bytes > TELEMETRY_LOG_PAGE_BYTES:
                break
            logs.append(item)
            page_bytes = next_bytes
        more_logs = len(logs) < len(pending_logs)
    value = {
        "bootId": _boot_id,
        "state": state,
        "detail": detail,
        "runId": _run_id,
        "project": _read_manifest(),
        "runtimeJson": _runtime_snapshot_json(),
        "control": _control_state(),
        "logs": logs,
    }
    if maximum_logs is not None:
        value["moreLogs"] = more_logs
    return value


def _encode_sample_plots(rows):
    descriptors = []
    by_identity = {}
    encoded = []
    for row in rows:
        if row is None:
            encoded.append(None)
            continue
        values = []
        for item in row:
            key = (item["name"], item["label"], item.get("unit", ""))
            index = by_identity.get(key)
            if index is None:
                index = len(descriptors)
                by_identity[key] = index
                descriptors.append({"name": key[0], "label": key[1], "unit": key[2]})
            values.append([index, item["value"]])
        encoded.append(values)
    return descriptors, encoded


def _remember_reply(request_id, value, fingerprint=None):
    global _reply_cache_bytes
    if request_id in _last_reply_by_id:
        return
    size = len(json.dumps(value).encode("utf-8"))
    _last_reply_by_id[request_id] = (fingerprint, value, size)
    _reply_order.append(request_id)
    _reply_cache_bytes += size
    while len(_reply_order) > 20 or (len(_reply_order) > 1 and _reply_cache_bytes > REPLY_CACHE_BYTES):
        old = _reply_order.pop(0)
        _reply_cache_bytes -= _last_reply_by_id[old][2]
        del _last_reply_by_id[old]


def _validate_network_project(value):
    # Worlds are repeated in reconnect/telemetry project identity. Bound them
    # before compile or staging so a valid upload remains a decodable run.
    if isinstance(value, dict) and isinstance(value.get("files"), dict):
        world = value["files"].get("world.json")
        if isinstance(world, str) and len(world.encode("utf-8")) > MAX_WORLD_BYTES:
            raise ProtocolError("project_too_large", "world.json exceeds the XRP's 16 KiB limit; simplify the world before running")
    return validate_project(value)


def _request_fingerprint(name, body):
    digest = hashlib.sha256()

    def visit(value, root=False):
        if isinstance(value, dict):
            digest.update(b"{")
            for key in sorted(value):
                if root and key == "requestId":
                    continue
                visit(key)
                visit(value[key])
            digest.update(b"}")
        elif isinstance(value, list):
            digest.update(b"[")
            for item in value:
                visit(item)
            digest.update(b"]")
        else:
            data = json.dumps(value).encode()
            digest.update(str(len(data)).encode())
            digest.update(b":")
            digest.update(data)

    visit(name)
    visit(body, root=True)
    return digest.digest()


def _command(request, operation, name=None):
    global _command_phase, _command_source_path
    request_id = None
    command_name = name or getattr(request, "path", "command")
    started_ms = time.ticks_ms()
    outcome = "ok"
    _command_phase = "decode"
    _command_source_path = None
    try:
        body = request.data if isinstance(request.data, dict) else {}
        request_id = validate_request_id(body.get("requestId"))
        _command_phase = "fingerprint"
        fingerprint = _request_fingerprint(command_name, body)
        previous = _last_reply_by_id.get(request_id)
        if previous is not None:
            if previous[0] != fingerprint:
                raise ProtocolError("request_id_reused", "A request ID was reused for a different operation")
            # Exact retries replay acknowledgement only; they never execute work.
            if "bootId" in body:
                if body["bootId"] != _boot_id:
                    raise ProtocolError("boot_changed", "The XRP restarted; reconnect before retrying")
            return _json_response(previous[1])
        _command_phase = "execute"
        result = operation(body)
        _command_phase = "reply"
        _command_source_path = None
        value = protocol_reply(request_id, result=result)
        _remember_reply(request_id, value, fingerprint)
        return _json_response(value)
    except ProtocolError as exc:
        outcome = exc.code
        return _error_response(request_id, exc.code, exc.detail)
    except SyntaxError as exc:
        outcome = "syntax_error"
        detail = _syntax_error_detail(exc, _command_source_path)
        return _error_response(request_id, "syntax_error", detail, status=422)
    except Exception as exc:
        outcome = "internal_error"
        _record_runtime_fault("command.exception", exc, _diagnostic_context(command_name, request_id))
        return _error_response(
            request_id,
            "internal_error",
            type(exc).__name__ + ": " + str(exc),
            status=500,
        )
    finally:
        if DEBUG_DIAGNOSTICS:
            try:
                context = _diagnostic_context(command_name, request_id)
                context["elapsedMs"] = time.ticks_diff(time.ticks_ms(), started_ms)
                context["outcome"] = outcome
                _append_log("system", "XRP command " + json.dumps(context))
            except Exception:
                pass
        _command_phase = None
        _command_source_path = None


@server.route("/api/v1/info")
def info(request):
    identity = _runtime_identity()
    station_profile = None
    if isinstance(_network_activation, dict):
        station_profile = _network_activation.get("config", {}).get("station")
    network_state = current_network_state(_network_state or {}, network, station_profile)
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
            "firmware": _firmware_identity(),
            "robotId": _robot_id(),
            "recoveryWatchdogMs": SERVICE_WATCHDOG_MS,
            "bootId": _boot_id,
            "resetCause": _boot_reset_cause,
            "serviceUptimeMs": time.ticks_diff(time.ticks_ms(), _boot_ms),
            "runId": _run_id,
            "robotName": network.hostname(),
            "address": network_state.get("address"),
            "network": public_network_state(network_state),
            "project": _read_manifest(),
            "runtimeJson": _runtime_snapshot_json(),
            "control": _control_state(),
            "limits": {"maxRequestBodyBytes": 131072, "maxWorldBytes": MAX_WORLD_BYTES},
            "capabilities": [
                "control.session-v1",
                "project.check",
                "project.prepare",
                "project.run",
                "project.current",
                "program.run",
                "program.stop",
                "target.reset",
                "telemetry.poll",
                "telemetry.compact-v1",
                "telemetry.packed-v1",
                "telemetry.timing-v1",
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
    return _json_response(_state_result(after, TELEMETRY_LOG_BATCH_LIMIT))


@server.route("/api/v1/control", methods=["POST"])
def claim_control(request):
    def operation(body):
        global _control_session, _control_generation
        _validate_epoch(body)
        if _reset_pending:
            raise ProtocolError("target_restarting", "The XRP is restarting")
        session = body.get("sessionId")
        if not isinstance(session, str) or not 8 <= len(session) <= 96:
            raise ProtocolError("invalid_session", "A bounded browser session identity is required")
        control = _control_state()
        if control["sessionId"] != session:
            if _execution_active() or (control["sessionId"] and body.get("takeover") is not True):
                raise ProtocolError("control_owned", "Another browser controls this XRP; stop it before taking control")
            _control_generation += 1
            _control_session = session
            _clear_telemetry_poll_owner()
        _renew_control()
        return {"control": _control_state(), "bootId": _boot_id, "runId": _run_id}

    return _command(request, operation, "control")


@server.route("/api/v1/telemetry")
def telemetry(request):
    # Admission precedes poll-owner arbitration and any sensor/ring access.
    if not _query_controls_run(request.query):
        return _error_response(None, "control_required", "Claim control for this boot and run before requesting telemetry", status=409)
    requested_encoding = request.query.get("sampleEncoding")
    compact_requested = requested_encoding == COMPACT_TELEMETRY_ENCODING
    packed_requested = requested_encoding == PACKED_TELEMETRY_ENCODING
    packed_updates_requested = (
        not packed_requested or request.query.get("includeUpdates") != "0"
    )
    accepted, poll_generation, poll_owner, poll_ownership = (
        _begin_telemetry_poll(request.query)
    )
    if not accepted:
        if packed_requested:
            return _packed_telemetry_response(
                {
                    "sampleCount": 0,
                    "pollOwnership": poll_ownership,
                },
                b"",
                b"",
            )
        return _json_response({"pollOwnership": poll_ownership})
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
    controlling = _query_controls_run(request.query)
    if controlling:
        _renew_control()
    if _thread_active and requested_run == _run_id and controlling:
        # A successful telemetry request is already proof that the controlling
        # browser is present. Renew the run here instead of requiring a second
        # serialized HTTP request before the next poll or a Stop command.
        _extend_run_lease(LEASE_MS)
    packed_fast_response = (
        packed_requested
        and not packed_updates_requested
        and _state == "running"
    )
    if packed_fast_response:
        value = {
            # Short private wire keys leave the active response budget to its
            # ordered sample page. The browser expands them before the state
            # reaches any application consumer.
            "s": 2,
            "r": _run_id,
        }
    else:
        value = _state_result(after, TELEMETRY_LOG_BATCH_LIMIT)
    row_encoding_requested = compact_requested or packed_requested
    sample_limit = (
        PACKED_TELEMETRY_SAMPLE_BATCH_LIMIT
        if packed_requested
        else TELEMETRY_SAMPLE_BATCH_LIMIT
    )
    compact_rows = None
    compact_shared = None
    sample_plots = None
    sample_timing = None
    sample_diagnostics = None
    if row_encoding_requested and _thread_active:
        snapshots, hardware, more_samples = _buffered_course_page(
            after_sample, sample_limit
        )
        # If the program ended concurrently, use the established terminal-tail
        # path below. During a running page, build wire rows directly from
        # immutable course snapshots instead of temporary 35-key dictionaries.
        if _thread_active:
            compact_rows = [
                _compact_course_telemetry_row(item, hardware)
                for item in snapshots
            ]
            sample_plots = [_sample_plot_values(item) for item in snapshots]
            sample_timing = [item.get("timing") for item in snapshots]
            sample_diagnostics = [item.get("diagnostics") for item in snapshots]
            if compact_rows:
                compact_shared = _compact_telemetry_shared(hardware)
            samples = []
        else:
            samples = [
                _course_sample(item, hardware) for item in snapshots
            ]
    else:
        samples, more_samples = _buffered_course_samples(
            after_sample, sample_limit
        )
    if packed_fast_response and _state != "running":
        # A program can finish while its retained page is being copied. Send
        # the complete terminal state immediately instead of one stale compact
        # running envelope followed by a delayed status refresh.
        value = _state_result(after, TELEMETRY_LOG_BATCH_LIMIT)
        packed_fast_response = False
    if packed_fast_response:
        value["m"] = 1 if more_samples else 0
    else:
        value["moreSamples"] = more_samples
    if compact_rows is not None:
        sample = None
    elif _thread_active and samples:
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
    elif samples:
        # A run can finish after the retained page is read but before this
        # response is assembled. Return only course-loop samples and force one
        # more poll; that poll drains any tail samples before it appends the
        # newer stationary sample.
        sample = samples[-1]
        value["moreSamples"] = True
    else:
        # Preserve any final course-loop samples not yet collected, then end
        # the batch with a fresh stopped sample. A newly opened Monitor must
        # never present the last moving wheel speed as the current ready state.
        sample = _hardware_sample()
        if sample["seq"] > after_sample:
            samples.append(sample)
    if row_encoding_requested:
        if not packed_requested:
            value["sampleEncoding"] = COMPACT_TELEMETRY_ENCODING
        if compact_rows is None:
            compact_rows = [_compact_telemetry_row(item) for item in samples]
            sample_plots = [item.get("plotValues") for item in samples]
            sample_timing = [item.get("timingValues") for item in samples]
            sample_diagnostics = [_compact_telemetry_shared(item) for item in samples]
            if compact_rows:
                compact_shared = _compact_telemetry_shared(samples[-1])
        if (
            sample_diagnostics
            and sample_diagnostics[0] is not None
            and all(item == sample_diagnostics[0] for item in sample_diagnostics)
        ):
            # Reuse the recorded values, not a newer hardware read. Mixed or
            # legacy missing records still need their aligned per-row values.
            compact_shared = sample_diagnostics[0]
            sample_diagnostics = None
        if compact_shared is not None and not packed_requested:
            value["sampleShared"] = compact_shared
        if packed_requested:
            if packed_fast_response:
                value["n"] = len(compact_rows)
            else:
                value["sampleCount"] = len(compact_rows)
        else:
            value["sampleRows"] = compact_rows
        descriptors, plot_rows = _encode_sample_plots(sample_plots)
        value["samplePlotDescriptors"] = descriptors
        value["samplePlots"] = plot_rows
        value["sampleTiming"] = sample_timing
        if sample_diagnostics is not None:
            value["sampleDiagnostics"] = sample_diagnostics
    else:
        value["samples"] = samples
        value["sample"] = sample
    if poll_ownership is not None and not packed_requested:
        value["pollOwnership"] = poll_ownership
    response = (
        _packed_telemetry_response(
            value,
            (
                _pack_telemetry_shared(compact_shared)
                if compact_rows and compact_shared is not None
                else b""
            ),
            _pack_telemetry_rows(compact_rows),
        )
        if packed_requested
        else _json_response(value)
    )
    _renew_telemetry_poll_owner(poll_generation, poll_owner)
    return response


@server.route("/api/v1/check", methods=["POST"])
def check(request):
    def operation(body):
        _authorize_control(body)
        if _execution_active():
            raise ProtocolError("target_busy", "Stop the program before checking another project")
        execution_lock = _project_execution_lock
        if execution_lock is not None:
            execution_lock.acquire()
        try:
            if _execution_active():
                raise ProtocolError("target_busy", "Stop the program before checking another project")
            project = _validate_network_project(body.get("project"))
            checked = _compile_project(project)
            _renew_control()
            return {"detail": "{} Python files compiled".format(checked)}
        finally:
            if execution_lock is not None:
                execution_lock.release()

    return _command(request, operation, "check")


@server.route("/api/v1/sync", methods=["POST"])
def sync(request):
    def operation(body):
        raise ProtocolError(
            "persistent_project_requires_usb",
            "persistent project installation requires USB setup/repair",
        )

    return _command(request, operation, "sync")


@server.route("/api/v1/prepare", methods=["POST"])
def prepare_project(request):
    def operation(body):
        _authorize_control(body)
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
            project = _validate_network_project(body.get("project"))
            checked = _compile_project(project)
            manifest = _prepare_ram_project(project)
            _set_state("ready", "Project prepared in RAM")
            _renew_control()
            return {
                "detail": "Project prepared in RAM",
                "checked": checked,
                "project": manifest,
            }
        finally:
            if execution_lock is not None:
                execution_lock.release()

    return _command(request, operation, "prepare_project")


@server.route("/api/v1/run", methods=["POST"])
def run_project(request):
    def operation(body):
        _authorize_control(body)
        _require_supported_firmware()
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
            checked = None
            requested_project = body.get("project")
            if requested_project is not None:
                # A changed browser project is compiled, staged, and started
                # under one execution lock. This avoids a second HTTP request
                # between Prepare and Run on the single-request XRP service.
                project = _validate_network_project(requested_project)
                checked = _compile_project(project)
                manifest = _prepare_ram_project(project)
            else:
                manifest = _read_manifest()
                if manifest and body.get("expectedProjectRevision") != manifest["revision"]:
                    raise ProtocolError("project_revision_mismatch", "The prepared project changed; send the current project again")
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
            if _stop_motors() is False:
                _schedule_reset(0)
                raise ProtocolError("target_restarting", _detail)
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
            _invalidate_idle_telemetry()
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
            result = {"detail": _detail, "runId": _run_id}
            if checked is not None:
                result["detail"] = "{} Python files compiled; starting {}".format(
                    checked, entrypoint
                )
                result["checked"] = checked
                result["project"] = manifest
            return result
        finally:
            if execution_lock is not None:
                execution_lock.release()

    return _command(request, operation, "run_project")


@server.route("/api/v1/parameter", methods=["POST"])
def set_runtime_parameter(request):
    def operation(body):
        _authorize_control(body)
        if not _thread_active:
            raise ProtocolError("target_idle", "start a program before changing parameters")
        from ucsb_xrp.live import queue_update, runtime_snapshot_json

        try:
            queue_update(body.get("name"), body.get("value"))
        except (TypeError, ValueError) as exc:
            raise ProtocolError("invalid_parameter", str(exc))
        return {"runtimeJson": runtime_snapshot_json()}

    return _command(request, operation, "set_runtime_parameter")


@server.route("/api/v1/lease", methods=["POST"])
def renew_lease(request):
    def operation(body):
        _authorize_control(body)
        requested_run = body.get("runId")
        if _thread_active and requested_run == _run_id:
            _extend_run_lease(LEASE_MS)
        _renew_control()
        return {"state": _state, "runId": _run_id}

    return _command(request, operation, "renew_lease")


@server.route("/api/v1/stop", methods=["POST"])
def stop(request):
    def operation(body):
        _validate_epoch(body)
        global _launch_pending, _lease_deadline
        _launch_pending = False
        _lease_deadline = None
        if _reset_pending:
            return {"detail": _detail, "reconnecting": True}
        if _thread_active:
            _set_state("loading", "Stopping program")
            server.loop.create_task(_request_stop_after_response(_run_id))
            return {"detail": "Stopping program", "reconnecting": False}
        if _stop_motors() is False:
            _schedule_reset(0)
            return {"detail": _detail, "reconnecting": True}
        _set_state("ready", "Program already stopped")
        return {"detail": "Program already stopped", "reconnecting": False}

    return _command(request, operation, "stop")


@server.route("/api/v1/reset", methods=["POST"])
def reset(request):
    def operation(body):
        _authorize_control(body)
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
        if _clear_course_run_state() is False:
            return {"detail": _detail, "reconnecting": True}
        return {"detail": "Program state reset", "reconnecting": False}

    return _command(request, operation, "reset")


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
            record_fault(
                "program.lease_expired",
                RuntimeError("The controlling browser stopped renewing the run connection"),
                _diagnostic_context("run", phase="connection_lease"),
            )
            _set_state("error", "Run connection expired; restarting target service")
            _schedule_reset()
        await uasyncio.sleep_ms(200)


async def _feed_service_watchdog(watchdog):
    """Keep a hardware recovery path independent of the Python VM locks."""
    import uasyncio

    while True:
        if _motor_recovery_requested:
            _schedule_reset(0)
        if not _reset_pending:
            watchdog.feed()
            _maintain_wifi(watchdog)
            if not _execution_active():
                execution_lock = _project_execution_lock
                acquired = execution_lock is None or execution_lock.acquire(False)
                if acquired:
                    try:
                        if not _execution_active():
                            watchdog.feed()
                            flush_pending()
                            watchdog.feed()
                    finally:
                        if execution_lock is not None:
                            execution_lock.release()
        await uasyncio.sleep_ms(500)


async def _start_server_and_confirm_runtime():
    """Bind the single HTTP listener before confirming a trial runtime."""
    import uasyncio

    try:
        # Phew's run() schedules this independently and discards its result.
        # Await the actual bind so a failed listener cannot confirm a trial.
        await uasyncio.start_server(server._handle_request, "0.0.0.0", 80)
    except Exception as exc:
        _record_runtime_fault("http.startup_failed", exc, _diagnostic_context("http_startup", phase="listener_bind"))
        _set_state("error", "XRP web service could not start; restarting target service")
        _schedule_reset()
        return
    # Imports, hardware, the worker, network recovery, recurring tasks, and the
    # listener are ready. An unavailable router is not a failed runtime.
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


def _connect_wifi(timeout_ms=STATION_CONNECT_TIMEOUT_MS, watchdog=None, activation=None):
    global _network_state, _network_activation
    if activation is None:
        config = json.load(open(CONFIG_PATH))
        activation = begin_network_activation(
            config,
            watchdog=watchdog,
            network_module=network,
        )
    _network_activation = activation
    _network_state = finish_network_activation(
        activation,
        timeout_ms=timeout_ms,
        watchdog=watchdog,
        time_module=time,
    )
    _log_wifi_change(None, _network_state)
    power_management = _network_state.get("power_management")
    if (
        _network_state.get("mode") == "station"
        and isinstance(power_management, dict)
        and not power_management.get("verified")
    ):
        _append_log(
            "system",
            "Station Wi-Fi power management: {}".format(
                power_management.get("status", "unknown")
            ),
        )
    return _network_state.get("address")


def _log_wifi_change(previous, current):
    keys = ("ready", "status", "address", "connection_attempts", "last_failure")
    if previous is None or any(previous.get(key) != current.get(key) for key in keys):
        _append_log("system", "Wi-Fi state " + json.dumps(public_network_state(current)))


def _maintain_wifi(watchdog):
    """Advance association in the existing service loop, without new workers."""
    global _network_state
    activation = _network_activation
    if not isinstance(activation, dict) or activation["config"]["mode"] != "station":
        return
    if _execution_active():
        # Even nominally nonblocking WLAN operations enter the native driver.
        # Let Stop and the run lease finish the worker before touching its radio.
        return
    execution_lock = _project_execution_lock
    acquired = execution_lock is None or execution_lock.acquire(False)
    if not acquired:
        return
    try:
        # The worker clears its active flag shortly before releasing this lock.
        # Native radio work must wait for that final cleanup to finish as well.
        if _execution_active() or _reset_pending:
            return
        current = poll_network_activation(
            activation, watchdog=watchdog, time_module=time, background=True,
        )
        _log_wifi_change(_network_state, current)
        _network_state = current
    finally:
        if execution_lock is not None:
            execution_lock.release()


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
    if DEBUG_DIAGNOSTICS:
        try:
            identity = _runtime_identity()
            _append_log("system", "XRP startup " + json.dumps({
                "bootId": _boot_id,
                "resetCause": _boot_reset_cause,
                "firmware": _firmware_identity(),
                "runtimeRelease": identity["runtimeRelease"],
                "runtimeReleaseSequence": identity["runtimeReleaseSequence"],
                "runtimeGeneration": identity["runtimeGeneration"],
                "runtimeManifestSha256": identity["runtimeManifestSha256"],
            }))
        except Exception:
            pass  # Diagnostic allocation must not prevent service startup.
    watchdog.feed()
    if _stop_motors() is False:
        raise RuntimeError(_detail)
    watchdog.feed()
    # MicroPython filesystem imports are not reliable when first performed on
    # the second core. Load the shared course packages once on the service core;
    # student threads then reuse the normal module cache.
    import ucsb_xrp
    import ucsb_xrp_reference
    _append_log("system", "Course API loaded")
    watchdog.feed()
    from XRPLib.board import Board
    from XRPLib.rangefinder import Rangefinder
    from ucsb_xrp._hardware import get_course_motor
    watchdog.feed()

    # Resolve the singleton drivers before the student thread begins. In
    # addition to avoiding second-core filesystem imports, this gives service
    # telemetry and course code the same XRPLib device instances.
    Board.get_default_board()
    watchdog.feed()
    get_course_motor(1)
    get_course_motor(2)
    watchdog.feed()
    _initialize_optional_imu()
    Rangefinder.get_default_rangefinder()
    _append_log("system", "XRP hardware interfaces ready")
    watchdog.feed()

    # Creating the mountpoint entries can touch internal flash on a new board.
    # Do it once before core 1 starts; project files themselves live only in
    # bytearrays. The worker then remains blocked on its wake lock between runs
    # for the service lifetime.
    try:
        _require_supported_firmware()
    except ProtocolError as exc:
        # Keep repair, identity, and Stop available without starting core 1 on
        # a native runtime that has not passed the physical qualification.
        _set_state("error", exc.detail)
    else:
        _initialize_project_worker(watchdog)
        _append_log("system", "Program runner ready")
    watchdog.feed()

    address = _connect_wifi(
        watchdog=watchdog,
        activation=network_activation,
    )
    identity = _runtime_identity()
    if address:
        _append_log("system", "Course service {} at {} ({})".format(identity["serviceVersion"], address, _network_state["mode"]))
        print("UCSB XRP course service at http://{}".format(address))
    else:
        _append_log("system", "Course service {} ready; waiting for configured Wi-Fi ({})".format(identity["serviceVersion"], _network_state.get("status", "unknown")))
        print("UCSB XRP course service ready; waiting for configured Wi-Fi ({}). USB remains available.".format(_network_state.get("status", "unknown")))
    server.loop.create_task(_feed_service_watchdog(watchdog))
    server.loop.create_task(_watch_run_lease())
    server.loop.create_task(_start_server_and_confirm_runtime())
    from .http_admission import install as install_http_admission

    install_http_admission(server, on_error=_http_runtime_fault)
    server.loop.run_forever()
