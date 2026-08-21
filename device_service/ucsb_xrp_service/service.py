"""HTTP target service for the current RP2350 XRP.

The service is deliberately private infrastructure. Student code sees only
``ucsb_xrp`` and XRPLib. Browser clients use a small JSON API over either the
XRP access point or an ordinary local network; polling keeps the implementation
dependable on stock MicroPython.
"""

import gc
import io
import json
import math
import os
import sys
import time

import _thread
import machine
import network
from phew import server

from .protocol import LineLogWriter, PROTOCOL_VERSION, SERVICE_VERSION, ProtocolError
from .protocol import reply as protocol_reply
from .protocol import project_revision, validate_project, validate_request_id
from .networking import activate_network, public_network_state


COURSE_RELEASE = "2026.08-dev.7"
CONFIG_PATH = "/xrp_wifi.json"
PROJECT_ROOT = "/course_projects"
ACTIVE_POINTER = PROJECT_ROOT + "/active.txt"
SLOTS = ("a", "b")
LEASE_MS = 2600
LAUNCH_AFTER_RESPONSE_MS = 80
SERVICE_WATCHDOG_MS = 7000
LOG_LIMIT = 160

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
_lease_deadline = None
_logs = []
_log_seq = 0
_sample_seq = 0
_last_sample = None
_last_hardware = None
_active_manifest = None
_last_project_module_names = []
_last_reply_by_id = {}
_reply_order = []
_network_state = None


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
    _log_seq += 1
    _logs.append(
        {
            "seq": _log_seq,
            "tMs": time.ticks_diff(time.ticks_ms(), _boot_ms),
            "stream": stream,
            "line": str(line),
        }
    )
    if len(_logs) > LOG_LIMIT:
        del _logs[: len(_logs) - LOG_LIMIT]


def _set_state(state, detail):
    global _state, _detail
    _state = state
    _detail = detail
    _append_log("system", detail)


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


def _remove_tree(path):
    try:
        entries = list(os.ilistdir(path))
    except OSError:
        return
    for entry in entries:
        child = path + "/" + entry[0]
        if entry[1] == 0x4000:
            _remove_tree(child)
        else:
            os.remove(child)
    os.rmdir(path)


def _make_parent_dirs(root, relative_path):
    parts = relative_path.split("/")[:-1]
    current = root
    for part in parts:
        current += "/" + part
        _ensure_dir(current)


def _active_slot_name():
    try:
        value = open(ACTIVE_POINTER).read().strip()
        if value in SLOTS:
            return value
    except OSError:
        pass
    return "a"


def _active_slot_path():
    return PROJECT_ROOT + "/" + _active_slot_name()


def _read_manifest():
    global _active_manifest
    if _active_manifest is not None:
        return _active_manifest
    try:
        _active_manifest = json.load(open(_active_slot_path() + "/.project.json"))
        if "revision" not in _active_manifest:
            files = {}
            for path in _active_manifest["files"]:
                files[path] = open(_active_slot_path() + "/" + path).read()
            _active_manifest["revision"] = project_revision(
                {
                    "entrypoint": _active_manifest["entrypoint"],
                    "files": files,
                }
            )
        return _active_manifest
    except Exception:
        return None


def _write_project(project):
    global _active_manifest
    _ensure_dir(PROJECT_ROOT)
    active = _active_slot_name()
    inactive = "b" if active == "a" else "a"
    slot_path = PROJECT_ROOT + "/" + inactive
    _remove_tree(slot_path)
    _ensure_dir(slot_path)

    try:
        for path, content in project["files"].items():
            _make_parent_dirs(slot_path, path)
            with open(slot_path + "/" + path, "w") as handle:
                handle.write(content)
        manifest = {
            "name": project["name"],
            "entrypoint": project["entrypoint"],
            "files": sorted(project["files"].keys()),
            "bytes": project["bytes"],
            "revision": project_revision(project),
        }
        with open(slot_path + "/.project.json", "w") as handle:
            json.dump(manifest, handle)
        pointer_tmp = ACTIVE_POINTER + ".tmp"
        with open(pointer_tmp, "w") as handle:
            handle.write(inactive)
        try:
            os.remove(ACTIVE_POINTER)
        except OSError:
            pass
        os.rename(pointer_tmp, ACTIVE_POINTER)
        _active_manifest = manifest
        return manifest
    except Exception:
        _remove_tree(slot_path)
        raise


def _compile_project(project):
    checked = 0
    for path, source in project["files"].items():
        if path.endswith(".py"):
            compile(source, path, "exec")
            checked += 1
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
    global _thread_active, _lease_deadline
    previous_cwd = os.getcwd()
    stdout = LineLogWriter("stdout", _append_log)
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

        managed_start = _set_managed_start
        managed_start(True)
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
        if managed_start is not None:
            managed_start(False)
        _stop_motors()
        stdout.flush()
        if inserted_path:
            try:
                sys.path.remove(slot_path)
            except ValueError:
                pass
        os.chdir(previous_cwd)
        _lease_deadline = None
        if run_id == _run_id:
            _set_state(outcome_state, outcome_detail)
        # This is deliberately the final shared-state write. Once the service
        # core sees False, the student core will do no more cleanup or XRPLib
        # work.
        _thread_active = False


async def _launch_project_after_response(
    slot_path, entrypoint, entry_code, startup_modules, run_id
):
    """Start core 1 only after the small run response has left core 0.

    RP2350 MicroPython shares one VM and heap across both cores. Starting a
    project while the HTTP handler is still allocating its response can make a
    rare allocator/flash lockup unrecoverable. The browser treats ``loading``
    as an active run state, so this short deferred launch is visible without
    adding another student-facing step.
    """
    global _launch_pending, _thread_active, _lease_deadline
    import uasyncio

    await uasyncio.sleep_ms(LAUNCH_AFTER_RESPONSE_MS)
    if not _launch_pending or run_id != _run_id:
        return
    _launch_pending = False
    _thread_active = True
    _lease_deadline = time.ticks_add(time.ticks_ms(), LEASE_MS)
    _set_state("running", "Running " + entrypoint)
    try:
        _thread.start_new_thread(
            _project_runner,
            (slot_path, entrypoint, entry_code, startup_modules, run_id),
        )
    except Exception as exc:
        _thread_active = False
        _lease_deadline = None
        detail = "Could not start project: {}: {}".format(
            type(exc).__name__, str(exc)
        )
        _append_log("stderr", detail)
        _set_state("error", detail)


async def _reset_after_response(delay_ms):
    import uasyncio

    await uasyncio.sleep_ms(delay_ms)
    machine.reset()


def _schedule_reset(delay_ms=220):
    # Hardware Timer callbacks run in interrupt context, where importing and
    # reset setup are unreliable. An event-loop task lets the HTTP response
    # leave first, then resets in ordinary MicroPython execution context.
    server.loop.create_task(_reset_after_response(delay_ms))


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


def _hardware_sample():
    global _sample_seq, _last_sample
    now = time.ticks_ms()
    try:
        from ucsb_xrp._telemetry import state_snapshot

        pose = state_snapshot()
    except Exception:
        pose = None

    # XRPLib's I2C and encoder drivers are not safe for concurrent access from
    # both RP2350 cores. While a student program is active, use its published
    # course state and the latest stationary peripheral sample. Direct device
    # reads resume as soon as the program thread finishes.
    if _thread_active:
        hardware = _last_hardware or {
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
    else:
        hardware = _read_hardware()

    left_count = hardware["leftEncoderCount"]
    right_count = hardware["rightEncoderCount"]

    left_speed = 0.0
    right_speed = 0.0
    if _thread_active and pose is not None:
        left_speed = pose["leftWheelSpeedMmS"]
        right_speed = pose["rightWheelSpeedMmS"]
    elif not _thread_active and _last_sample is not None:
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
    return {
        "tMs": time.ticks_diff(now, _boot_ms),
        "seq": _sample_seq,
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
        "leftEffort": 0.0 if pose is None else pose["leftEffort"],
        "rightEffort": 0.0 if pose is None else pose["rightEffort"],
        "leftWheelSpeedMmS": left_speed,
        "rightWheelSpeedMmS": right_speed,
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


def _runtime_snapshot_json():
    try:
        from ucsb_xrp.live import runtime_snapshot_json

        value = runtime_snapshot_json()
        if not isinstance(value, str) or len(value) > 32768:
            raise ValueError("runtime snapshot is invalid")
        return value
    except Exception:
        return '{"revision":0,"parameters":[],"watches":[]}'


def _state_result(after_log_seq=0):
    return {
        "bootId": _boot_id,
        "state": _state,
        "detail": _detail,
        "runId": _run_id,
        "project": _read_manifest(),
        "runtimeJson": _runtime_snapshot_json(),
        "logs": [item for item in _logs if item["seq"] > after_log_seq],
    }


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
    return _json_response(
        {
            "protocol": PROTOCOL_VERSION,
            "serviceVersion": SERVICE_VERSION,
            "courseRelease": COURSE_RELEASE,
            "recoveryWatchdogMs": SERVICE_WATCHDOG_MS,
            "bootId": _boot_id,
            "robotName": network.hostname(),
            "address": _network_state["address"] if _network_state else None,
            "network": public_network_state(_network_state or {}),
            "project": _read_manifest(),
            "runtimeJson": _runtime_snapshot_json(),
            "capabilities": [
                "project.check",
                "project.sync",
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
    value = _state_result(after)
    value["sample"] = _hardware_sample()
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
        if _thread_active or _launch_pending:
            raise ProtocolError("target_busy", "stop the program before flashing")
        project = validate_project(body.get("project"))
        checked = _compile_project(project)
        manifest = _write_project(project)
        _set_state("ready", "Project flashed")
        return {"detail": "Project flashed", "checked": checked, "project": manifest}

    return _command(request, operation)


@server.route("/api/v1/run", methods=["POST"])
def run_project(request):
    def operation(body):
        global _run_id, _launch_pending, _lease_deadline
        if _thread_active or _launch_pending:
            raise ProtocolError("target_busy", "a program is already running")
        manifest = _read_manifest()
        if manifest is None:
            raise ProtocolError("no_project", "flash a project before running")
        slot_path = _active_slot_path()
        entrypoint = manifest["entrypoint"]
        with open(slot_path + "/" + entrypoint) as handle:
            source = handle.read()
        # Compile before core 1 starts. This catches entrypoint syntax errors in
        # the correlated run reply and avoids compiling while the service core
        # allocates network objects.
        entry_code = compile(source, entrypoint, "exec")
        startup_modules = _entrypoint_project_imports(manifest, source)
        _clear_project_modules(manifest)
        _stop_motors()
        from ucsb_xrp._telemetry import clear_state
        from ucsb_xrp.live import clear as clear_runtime

        clear_state()
        clear_runtime()
        # Collect on the service core before the student core starts. Running
        # global collection from the student core while the HTTP loop allocates
        # request objects can stall RP2350 MicroPython.
        gc.collect()
        _run_id += 1
        _launch_pending = True
        _lease_deadline = None
        _set_state("loading", "Starting " + entrypoint)
        server.loop.create_task(
            _launch_project_after_response(
                slot_path, entrypoint, entry_code, startup_modules, _run_id
            )
        )
        return {"detail": _detail, "runId": _run_id}

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
        global _lease_deadline
        requested_run = body.get("runId")
        if _thread_active and requested_run == _run_id:
            _lease_deadline = time.ticks_add(time.ticks_ms(), LEASE_MS)
        return {"state": _state, "runId": _run_id}

    return _command(request, operation)


@server.route("/api/v1/stop", methods=["POST"])
def stop(request):
    def operation(body):
        global _launch_pending, _lease_deadline
        _launch_pending = False
        _lease_deadline = None
        if not _thread_active:
            _stop_motors()
        _set_state("ready", "Program stopped; restarting target service")
        _schedule_reset()
        return {"detail": "Program stopped", "reconnecting": True}

    return _command(request, operation)


@server.route("/api/v1/reset", methods=["POST"])
def reset(request):
    def operation(body):
        global _launch_pending, _lease_deadline
        _launch_pending = False
        _lease_deadline = None
        if not _thread_active:
            _stop_motors()
        _set_state("ready", "Resetting physical XRP")
        _schedule_reset()
        return {"detail": "Physical XRP resetting", "reconnecting": True}

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
        watchdog.feed()
        await uasyncio.sleep_ms(500)


def _connect_wifi(timeout_ms=20000, watchdog=None):
    global _network_state
    config = json.load(open(CONFIG_PATH))
    _network_state = activate_network(
        config,
        timeout_ms=timeout_ms,
        watchdog=watchdog,
        network_module=network,
        time_module=time,
    )
    if not _network_state.get("ready") or not _network_state.get("address"):
        raise RuntimeError(
            "Wi-Fi setup failed with status {}".format(
                _network_state.get("status", "unknown")
            )
        )
    return _network_state["address"]


def run(watchdog=None):
    if watchdog is None:
        watchdog = machine.WDT(timeout=SERVICE_WATCHDOG_MS)
    watchdog.feed()
    _stop_motors()
    watchdog.feed()
    # MicroPython filesystem imports are not reliable when first performed on
    # the second core. Load the shared course packages once on the service core;
    # student threads then reuse the normal module cache.
    import ucsb_xrp
    import ucsb_xrp_reference
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
    watchdog.feed()

    address = _connect_wifi(watchdog=watchdog)
    _append_log(
        "system",
        "Course service {} at {} ({})".format(
            SERVICE_VERSION, address, _network_state["mode"]
        ),
    )
    print("UCSB XRP course service at http://{}".format(address))
    server.loop.create_task(_feed_service_watchdog(watchdog))
    server.loop.create_task(_watch_run_lease())
    server.run(host="0.0.0.0", port=80)
