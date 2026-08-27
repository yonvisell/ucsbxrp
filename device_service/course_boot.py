"""Select and start one verified UCSBXRP runtime.

This file and ``main.py`` form the small, stable boot boundary. Course software
is installed into one of two independent runtime slots. An activation record is
published only after the inactive slot has been written and verified, so a
power loss during installation cannot damage the runtime that was already
working.

The newest valid activation is tried once. The service confirms it only after
its imports, hardware setup, program worker, network, and event-loop tasks are
ready. If startup fails synchronously, or a reset occurs before confirmation,
the next boot returns to the last confirmed runtime.
"""

import json
import os
import sys

try:
    import hashlib
except ImportError:  # MicroPython exposes the same sha256 API as ``uhashlib``.
    import uhashlib as hashlib


BOOTSTRAP_VERSION = 1
BOOT_WATCHDOG_MS = 7000
RUNTIME_ROOT = "/course_runtime"
SLOTS = ("a", "b")
ACTIVATION_NAMES = ("active.0.json", "active.1.json")
ATTEMPTED_NAME = "attempted.json"
CONFIRMED_NAME = "confirmed.json"
MANIFEST_NAME = "runtime-manifest.json"
MANAGED_MODULE_PREFIXES = (
    "ucsb_xrp_service",
    "ucsb_xrp",
    "ucsb_xrp_reference",
)
_active_context = None


def _join(*parts):
    return "/".join(part.strip("/") for part in parts if part != "")


def _root_path(name):
    return "/" + _join(RUNTIME_ROOT, name)


def _slot_path(slot):
    return _root_path("slots/" + slot)


def _manifest_path(slot):
    return _slot_path(slot) + "/" + MANIFEST_NAME


def _hex_digest(data):
    digest = hashlib.sha256(data).digest()
    return "".join("{:02x}".format(value) for value in digest)


def _read_json(path):
    try:
        with open(path, "r") as handle:
            value = json.load(handle)
        return value if isinstance(value, dict) else None
    except (OSError, ValueError, TypeError):
        return None


def _read_manifest(slot):
    path = _manifest_path(slot)
    try:
        with open(path, "rb") as handle:
            body = handle.read()
        value = json.loads(body.decode("utf-8"))
    except (OSError, ValueError, TypeError, UnicodeError):
        return None, None
    if not isinstance(value, dict):
        return None, None
    return value, _hex_digest(body)


def _is_sha256(value):
    if not isinstance(value, str) or len(value) != 64:
        return False
    for character in value.lower():
        if character not in "0123456789abcdef":
            return False
    return True


def _record_identity(value):
    if not isinstance(value, dict):
        return None
    generation = value.get("generation")
    slot = value.get("slot")
    digest = value.get("runtimeManifestSha256")
    if (
        value.get("schemaVersion") != 1
        or not isinstance(generation, int)
        or isinstance(generation, bool)
        or generation <= 0
        or slot not in SLOTS
        or not _is_sha256(digest)
    ):
        return None
    return generation, slot, digest.lower()


def _manifest_identity(manifest):
    identity = manifest.get("identity")
    if isinstance(identity, dict):
        return identity
    compatibility = manifest.get("compatibility")
    if not isinstance(compatibility, dict):
        return manifest
    identity = dict(compatibility)
    identity["releaseId"] = manifest.get("releaseId")
    identity["releaseSequence"] = manifest.get("releaseSequence")
    return identity


def _valid_activation(value):
    key = _record_identity(value)
    if key is None:
        return None
    generation, slot, expected_digest = key
    manifest, actual_digest = _read_manifest(slot)
    if (
        manifest is None
        or manifest.get("schemaVersion") != 1
        or actual_digest != expected_digest
    ):
        return None

    identity = _manifest_identity(manifest)
    release_id = value.get("releaseId")
    if not isinstance(release_id, str) or not release_id:
        release_id = identity.get("releaseId")
    if not isinstance(release_id, str) or not release_id:
        return None
    manifest_release = identity.get("releaseId")
    if manifest_release is not None and manifest_release != release_id:
        return None

    release_sequence = value.get("releaseSequence")
    manifest_sequence = identity.get("releaseSequence")
    if release_sequence is None:
        release_sequence = manifest_sequence
    if (
        release_sequence is None
        or (
            not isinstance(release_sequence, int)
            or isinstance(release_sequence, bool)
            or release_sequence <= 0
        )
    ):
        return None
    if (
        manifest_sequence is not None
        and release_sequence is not None
        and manifest_sequence != release_sequence
    ):
        return None

    required_strings = (
        "courseApiRevision",
        "courseLibraryVersion",
        "serviceVersion",
    )
    if any(
        not isinstance(identity.get(name), str) or not identity.get(name)
        for name in required_strings
    ):
        return None
    required_integers = (
        "protocolVersion",
        "protocolRevision",
        "bootstrapVersion",
    )
    if any(
        not isinstance(identity.get(name), int)
        or isinstance(identity.get(name), bool)
        or identity.get(name) <= 0
        for name in required_integers
    ):
        return None
    if identity["bootstrapVersion"] > BOOTSTRAP_VERSION:
        return None

    record = dict(value)
    record["generation"] = generation
    record["slot"] = slot
    record["releaseId"] = release_id
    record["releaseSequence"] = release_sequence
    record["runtimeManifestSha256"] = actual_digest
    record["manifest"] = manifest
    return record


def _activation_records():
    records = []
    seen = set()
    for name in ACTIVATION_NAMES:
        record = _valid_activation(_read_json(_root_path(name)))
        if record is None:
            continue
        key = _record_identity(record)
        if key in seen:
            continue
        seen.add(key)
        records.append(record)
    records.sort(key=lambda item: item["generation"], reverse=True)
    return records


def _marker_matches(marker, record):
    return _record_identity(marker) == _record_identity(record)


def _confirmed_record(records):
    marker = _read_json(_root_path(CONFIRMED_NAME))
    for record in records:
        if _marker_matches(marker, record):
            return record
    return None


def _select_runtime():
    """Return ``(record, is_trial, confirmed_record)`` for the next import."""
    records = _activation_records()
    if not records:
        return None, False, None

    newest = records[0]
    confirmed = _confirmed_record(records)
    if confirmed is not None and _marker_matches(confirmed, newest):
        return newest, False, confirmed

    attempted = _read_json(_root_path(ATTEMPTED_NAME))
    if _marker_matches(attempted, newest):
        return confirmed, False, confirmed
    return newest, True, confirmed


def _marker_value(record):
    return {
        "schemaVersion": 1,
        "generation": record["generation"],
        "slot": record["slot"],
        "releaseId": record["releaseId"],
        "releaseSequence": record.get("releaseSequence"),
        "runtimeManifestSha256": record["runtimeManifestSha256"],
    }


def _ensure_runtime_root():
    try:
        os.mkdir(RUNTIME_ROOT)
    except OSError:
        pass


def _atomic_json(path, value):
    _ensure_runtime_root()
    temporary = path + ".tmp"
    with open(temporary, "w") as handle:
        json.dump(value, handle)
    try:
        os.rename(temporary, path)
    except OSError:
        # RP2's LittleFS normally replaces the destination atomically. Retain
        # compatibility with VFS implementations that require its removal.
        try:
            os.remove(path)
        except OSError:
            pass
        os.rename(temporary, path)


def _clear_managed_modules():
    names = []
    for name in sys.modules:
        for prefix in MANAGED_MODULE_PREFIXES:
            if name == prefix or name.startswith(prefix + "."):
                names.append(name)
                break
    names.sort(key=lambda value: value.count("."), reverse=True)
    for name in names:
        try:
            del sys.modules[name]
        except KeyError:
            pass


def _remove_slot_paths():
    for slot in SLOTS:
        path = _slot_path(slot) + "/lib"
        while path in sys.path:
            sys.path.remove(path)


def _integer(value, fallback=None):
    if isinstance(value, bool):
        return fallback
    if isinstance(value, int):
        return value
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def _context_for(record, trial=False):
    if record is None:
        return {
            "managed": False,
            "legacy": True,
            "trial": False,
            "confirmed": False,
            "bootstrapVersion": BOOTSTRAP_VERSION,
        }
    identity = _manifest_identity(record["manifest"])
    protocol_version = _integer(identity.get("protocolVersion"), 1)
    protocol_revision = _integer(
        identity.get("protocolRevision"), protocol_version
    )
    bootstrap_version = _integer(
        identity.get("bootstrapVersion"), BOOTSTRAP_VERSION
    )
    return {
        "managed": True,
        "legacy": False,
        "trial": bool(trial),
        "confirmed": not trial,
        "generation": record["generation"],
        "slot": record["slot"],
        "releaseId": record["releaseId"],
        "releaseSequence": record.get("releaseSequence"),
        "runtimeManifestSha256": record["runtimeManifestSha256"],
        "courseApiRevision": identity.get("courseApiRevision"),
        "courseLibraryVersion": identity.get("courseLibraryVersion"),
        "serviceVersion": identity.get("serviceVersion") or record["releaseId"],
        "protocolVersion": protocol_version,
        "protocolRevision": protocol_revision,
        "bootstrapVersion": bootstrap_version,
    }


def _prepare_record(record, trial=False):
    global _active_context
    _clear_managed_modules()
    _remove_slot_paths()
    if record is not None:
        sys.path.insert(0, _slot_path(record["slot"]) + "/lib")
    context = _context_for(record, trial=trial)
    _active_context = context
    return context


def prepare_runtime_imports():
    """Select the effective runtime for raw-REPL inspection or repair.

    This uses the same verified activation records as normal boot, but it does
    not start the service or mark a new candidate as attempted. The selected
    runtime's ``lib`` directory is placed first on ``sys.path`` and the runtime
    identity is returned.
    """
    record, trial, _confirmed = _select_runtime()
    return _prepare_record(record, trial=trial)


def runtime_identity():
    """Return the identity selected by ``boot`` or repair tooling."""
    return _active_context


def confirm_active_runtime():
    """Confirm the managed runtime after the service has fully prepared."""
    context = _active_context
    if not isinstance(context, dict) or not context.get("managed"):
        return False
    if context.get("confirmed"):
        return True
    marker = {
        "schemaVersion": 1,
        "generation": context["generation"],
        "slot": context["slot"],
        "releaseId": context["releaseId"],
        "releaseSequence": context.get("releaseSequence"),
        "runtimeManifestSha256": context["runtimeManifestSha256"],
    }
    _atomic_json(_root_path(CONFIRMED_NAME), marker)
    context["trial"] = False
    context["confirmed"] = True
    return True


def _run_service(watchdog):
    import network

    from ucsb_xrp_service.networking import begin_network_activation

    with open("/xrp_wifi.json", "r") as handle:
        config = json.load(handle)
    activation = begin_network_activation(
        config,
        watchdog=watchdog,
        network_module=network,
    )
    from ucsb_xrp_service.service import prepare_for_repl, run

    try:
        run(watchdog, network_activation=activation)
    finally:
        # A USB Ctrl-C is intentionally not caught by ``boot``. The service
        # still retires its second-core worker before returning to the REPL.
        prepare_for_repl()


def boot():
    """Boot the newest verified runtime, with confirmed-runtime fallback."""
    import machine

    watchdog = machine.WDT(timeout=BOOT_WATCHDOG_MS)
    watchdog.feed()
    selected, trial, confirmed = _select_runtime()
    if trial:
        try:
            _atomic_json(_root_path(ATTEMPTED_NAME), _marker_value(selected))
        except Exception:
            # Never start an untracked candidate: a reset could otherwise retry
            # the same broken runtime indefinitely.
            selected = confirmed
            trial = False

    try:
        _prepare_record(selected, trial=trial)
        return _run_service(watchdog)
    except Exception as first_error:
        # Do not catch KeyboardInterrupt. Ctrl-C must return to the MicroPython
        # REPL instead of being mistaken for a failed runtime.
        if trial and confirmed is not None and not _marker_matches(selected, confirmed):
            _prepare_record(confirmed, trial=False)
            try:
                return _run_service(watchdog)
            except Exception:
                pass
        if selected is not None:
            _prepare_record(None, trial=False)
            try:
                return _run_service(watchdog)
            except Exception:
                raise first_error
        raise
