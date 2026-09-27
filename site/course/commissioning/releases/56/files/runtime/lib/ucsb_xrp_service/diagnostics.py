"""Bounded development fault evidence, persisted only while execution is idle.

Recording a fault never writes flash. The service owns the idle/execution-lock
boundary around flush_pending(), keeping flash I/O outside the program loop.
"""

import gc
import io
import json
import os
import sys
import time

try:
    import _thread
    _pending_lock = _thread.allocate_lock()
except (ImportError, AttributeError):
    _pending_lock = None


DEBUG_DIAGNOSTICS = True
FAULT_DIRECTORY = "/course_runtime"
MAX_PENDING_FAULTS = 4
MAX_TRACEBACK_CHARS = 6000
MAX_CONTEXT_CHARS = 256
MAX_PERSISTED_BYTES = 32 * 1024
_pending = []
_next_id = 0


def _acquire():
    if _pending_lock is not None:
        _pending_lock.acquire()


def _release():
    if _pending_lock is not None:
        _pending_lock.release()

# Deliberately exclude request bodies, source text and Wi-Fi configuration.
_CONTEXT_FIELDS = (
    "operation", "requestId", "bootId", "runId", "phase", "freeBytes",
    "controlGeneration", "runtimeRelease", "sourcePath", "elapsedMs",
)


def _ticks_ms():
    ticks = getattr(time, "ticks_ms", None)
    return ticks() if ticks else int(time.monotonic() * 1000)


def _traceback(exception):
    output = io.StringIO()
    try:
        sys.print_exception(exception, output)
        text = output.getvalue()
    except (AttributeError, TypeError):
        text = type(exception).__name__ + ": " + str(exception)
    if len(text) > MAX_TRACEBACK_CHARS:
        text = text[:MAX_TRACEBACK_CHARS] + "\n[traceback truncated]"
    return text


def record_fault(event, exception, context=None):
    """Queue one credential-free fault; diagnostic failure never masks a fault."""
    global _next_id
    if not DEBUG_DIAGNOSTICS:
        return None
    try:
        _acquire()
        try:
            _next_id += 1
            sequence = _next_id
        finally:
            _release()
        ticks = _ticks_ms()
        fault_id = "{}-{}".format(ticks, sequence)
        safe_context = {}
        if isinstance(context, dict):
            for key in _CONTEXT_FIELDS:
                value = context.get(key)
                if isinstance(value, str):
                    safe_context[key] = value[:MAX_CONTEXT_CHARS]
                elif value is None or type(value) in (int, float, bool):
                    safe_context[key] = value
        fault = {
            "schemaVersion": 1,
            "faultId": fault_id,
            "event": str(event)[:80],
            "deviceTicksMs": ticks,
            "firmware": sys.version,
            "resetCause": None,
            "context": safe_context,
            "traceback": _traceback(exception),
        }
        try:
            import machine
            fault["resetCause"] = machine.reset_cause()
        except (ImportError, AttributeError):
            pass
        # Scanning the XRP's external heap costs about 160 ms on the measured
        # board. Never put that scan in a control command or fault handler.
        _acquire()
        try:
            _pending.append(fault)
            if len(_pending) > MAX_PENDING_FAULTS:
                del _pending[0]
        finally:
            _release()
        return fault_id
    except Exception:
        return None


def pending_faults():
    """Return a copy for USB inspection without acknowledging persistence."""
    _acquire()
    try:
        return list(_pending)
    finally:
        _release()


def flush_pending():
    """Atomically retain the latest fault batch and one preceding batch.

    Call only with the service's project-execution lock held and no active or
    pending program. Failed writes leave the RAM evidence available to retry.
    """
    try:
        return _flush_pending()
    except Exception:
        # In particular, a low-memory fault can prevent JSON serialization.
        # Diagnostic failure must never terminate the watchdog's feeding task.
        return False


def _flush_pending():
    if not DEBUG_DIAGNOSTICS:
        return False
    batch = pending_faults()
    if not batch:
        return False
    captured_ids = [fault["faultId"] for fault in batch]
    value = {"schemaVersion": 1, "faults": batch}
    free = getattr(gc, "mem_free", None)
    if free:
        value["freeBytesAtIdleSave"] = free()
    serialized = json.dumps(value)
    while len(serialized.encode("utf-8")) > MAX_PERSISTED_BYTES:
        if len(batch) > 1:
            batch.pop(0)
            value["omittedOlderFaults"] = len(captured_ids) - len(batch)
        else:
            batch[0] = dict(batch[0])
            trace = batch[0]["traceback"]
            batch[0]["traceback"] = trace[:len(trace) // 2] + "\n[traceback truncated]"
        value["faults"] = batch
        serialized = json.dumps(value)
    latest = FAULT_DIRECTORY + "/last-fault.json"
    previous = FAULT_DIRECTORY + "/previous-fault.json"
    temporary = latest + ".tmp"
    try:
        try:
            os.mkdir(FAULT_DIRECTORY)
        except OSError:
            pass
        with open(temporary, "w") as handle:
            handle.write(serialized)
        try:
            os.stat(latest)
        except OSError:
            pass
        else:
            os.rename(latest, previous)
        os.rename(temporary, latest)
    except OSError:
        return False
    # Preserve any newly queued fault rather than clearing the whole buffer.
    _acquire()
    try:
        _pending[:] = [fault for fault in _pending if fault["faultId"] not in captured_ids]
    finally:
        _release()
    return True
