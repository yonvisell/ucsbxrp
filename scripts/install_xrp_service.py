#!/usr/bin/env python3
"""Install or repair the course library and LAN service on an attached XRP."""

import argparse
import hashlib
import json
from pathlib import Path
import sys
import time
from urllib.error import URLError
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parents[1]
SERVICE_SOURCE = ROOT / "device_service"
COURSE_SOURCE = ROOT / "vendor/current/ucsb_xrp"
REFERENCE_SOURCE = ROOT / "vendor/current/reference_mpy/ucsb_xrp_reference"
XRPLIB_SOURCE = ROOT / "vendor/current/xrplib"
RELEASE_PATH = ROOT / "vendor/current/release.json"
BOOTSTRAP_SOURCE = ROOT / "device_service"
EXPECTED_VID = 0x1B4F
EXPECTED_PID = 0x0046
ADDRESS_PREFIX = "UCSB_XRP_ADDRESS="
HASH_PREFIX = "UCSB_XRP_HASHES="
INSTALL_WATCHDOG_MS = 8388
USB_INSTALL_ATTEMPTS = 3
RUNTIME_ROOT = "/course_runtime"
SLOT_ROOT = RUNTIME_ROOT + "/slots"
ACTIVE_RECORDS = (
    RUNTIME_ROOT + "/active.0.json",
    RUNTIME_ROOT + "/active.1.json",
)
CONFIRMED_RECORD = RUNTIME_ROOT + "/confirmed.json"


class InstallError(RuntimeError):
    """The service installation did not complete."""


def enter_raw_repl(transport):
    """Interrupt the service and retire both RP2350 Python cores."""
    transport.serial.write(b"\r\x03\x03\x03")
    time.sleep(0.15)
    # MicroPython 1.28 includes the RP2 thread/flash-lockout repair. A soft
    # reset is therefore the cleanest commissioning boundary: it retires the
    # persistent project worker before any flash file is inspected or changed.
    transport.enter_raw_repl(soft_reset=True)


def reset_and_close(transport):
    """Best-effort return from raw REPL to normal boot before closing USB."""
    try:
        transport.exec_raw_no_follow("import machine; machine.reset()")
    except Exception:
        # A reset can re-enumerate USB before the command reports completion.
        pass
    try:
        transport.close()
    except OSError:
        pass


def feed_install_watchdog(transport):
    """Keep an already-running RP2350 watchdog alive during USB transfer."""
    transport.exec(
        "import machine\n"
        "machine.WDT(timeout={}).feed()".format(INSTALL_WATCHDOG_MS)
    )


def choose_port(explicit=None):
    if explicit:
        return explicit
    try:
        from serial.tools import list_ports
    except ImportError as exc:
        raise InstallError("pyserial is unavailable in this Python environment") from exc
    matches = [
        port.device
        for port in list_ports.comports()
        if port.vid == EXPECTED_VID and port.pid == EXPECTED_PID
    ]
    if len(matches) == 1:
        return matches[0]
    if not matches:
        raise InstallError("No USB-connected SparkFun XRP controller was found")
    raise InstallError("More than one XRP is connected; specify --port")


def release_metadata():
    """Return the release authority shared by both installers."""
    release = json.loads(RELEASE_PATH.read_text(encoding="utf-8"))
    required = (
        "release_id",
        "release_sequence",
        "course_api_revision",
        "service",
        "compatibility",
        "ucsb_xrp",
    )
    missing = [key for key in required if key not in release]
    if missing:
        raise InstallError(
            "release.json is missing {}".format(", ".join(sorted(missing)))
        )
    if not isinstance(release["release_sequence"], int):
        raise InstallError("release_sequence must be an integer")
    return release


def compatibility_identity(release=None):
    """Return the explicit compatibility identity published to every client."""
    release = release or release_metadata()
    service = release["service"]
    return {
        "courseApiRevision": release["course_api_revision"],
        "courseLibraryVersion": release["ucsb_xrp"]["version"],
        "serviceVersion": service["version"],
        "protocolVersion": service["protocol_version"],
        "protocolRevision": service["protocol_revision"],
        "bootstrapVersion": service["bootstrap_version"],
        "minimumRobotReleaseSequence": release["compatibility"][
            "minimum_robot_release_sequence"
        ],
    }


def canonical_json_bytes(value):
    """Encode one device record deterministically; the trailing LF is part of it."""
    return (
        json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)
        + "\n"
    ).encode("utf-8")


def bootstrap_files():
    """Stable boot files installed outside the replaceable runtime slots."""
    return {
        "/course_boot.py": BOOTSTRAP_SOURCE / "course_boot.py",
        # main.py is the only boot entry point. Publish it after its loader.
        "/main.py": BOOTSTRAP_SOURCE / "main.py",
    }


def runtime_files():
    """Return runtime paths relative to a slot, never absolute device paths."""
    files = {}
    for package in ("XRPLib", "phew"):
        for path in sorted((XRPLIB_SOURCE / package).glob("*.py")):
            files["lib/{}/{}".format(package, path.name)] = path
    for path in sorted((SERVICE_SOURCE / "ucsb_xrp_service").glob("*.py")):
        files["lib/ucsb_xrp_service/" + path.name] = path
    for path in sorted(COURSE_SOURCE.glob("*.py")):
        files["lib/ucsb_xrp/" + path.name] = path
    for path in sorted(REFERENCE_SOURCE.glob("*.mpy")):
        files["lib/ucsb_xrp_reference/" + path.name] = path
    return files


def installation_files(slot="a"):
    """Return final device paths for one complete slot plus stable boot files."""
    if slot not in ("a", "b"):
        raise ValueError("slot must be 'a' or 'b'")
    files = dict(bootstrap_files())
    root = "{}/{}/".format(SLOT_ROOT, slot)
    files.update((root + path, source) for path, source in runtime_files().items())
    return files


def file_sha256(data):
    return hashlib.sha256(data).hexdigest()


def runtime_manifest(release=None):
    """Describe the exact immutable bytes staged in either runtime slot."""
    release = release or release_metadata()
    entries = []
    for path, source in runtime_files().items():
        data = source.read_bytes()
        entries.append(
            {
                "path": path,
                "bytes": len(data),
                "sha256": file_sha256(data),
            }
        )
    return {
        "schemaVersion": 1,
        "releaseId": release["release_id"],
        "releaseSequence": release["release_sequence"],
        "compatibility": compatibility_identity(release),
        "files": entries,
    }


def parse_device_address(output):
    text = (
        output.decode("utf-8", errors="replace")
        if isinstance(output, bytes)
        else str(output)
    )
    address = None
    for line in text.splitlines():
        if line.startswith(ADDRESS_PREFIX):
            address = line[len(ADDRESS_PREFIX) :].strip()
            break
    if address is None and len(text.splitlines()) <= 1:
        address = text.strip()
    return address if address and address != "0.0.0.0" else None


def device_address_code(timeout_ms):
    return """
import json, machine
import course_boot
course_boot.prepare_runtime_imports()
from ucsb_xrp_service.networking import activate_network
watchdog = machine.WDT(timeout={watchdog_ms})
watchdog.feed()
config = json.load(open('/xrp_wifi.json'))
result = activate_network(config, timeout_ms={timeout_ms}, watchdog=watchdog)
watchdog.feed()
print({prefix!r} + (result.get('address') or ''))
""".format(
        timeout_ms=int(timeout_ms),
        prefix=ADDRESS_PREFIX,
        watchdog_ms=INSTALL_WATCHDOG_MS,
    )


def _slot_root(slot):
    if slot not in ("a", "b"):
        raise ValueError("slot must be 'a' or 'b'")
    return "{}/{}".format(SLOT_ROOT, slot)


def _ensure_remote_dirs(transport, slot=None):
    directories = [RUNTIME_ROOT, SLOT_ROOT]
    if slot is not None:
        root = _slot_root(slot)
        directories.append(root)
        for relative in runtime_files():
            parts = relative.split("/")[:-1]
            for index in range(1, len(parts) + 1):
                directories.append(root + "/" + "/".join(parts[:index]))
    ordered = list(dict.fromkeys(directories))
    transport.exec(
        "import os\n"
        "for p in {!r}:\n"
        " try: os.mkdir(p)\n"
        " except OSError: pass".format(ordered)
    )


def _remote_file_matches(transport, destination, expected):
    """Return whether one installed file already has the release bytes."""
    try:
        return transport.fs_readfile(destination) == expected
    except OSError:
        return False


def _remote_hashes(transport, paths):
    """Hash installed files on the XRP and return only compact digests."""
    code = (
        "import binascii, hashlib, json, machine\n"
        "wd=machine.WDT(timeout={watchdog})\n"
        "out={{}}\n"
        "for p in {paths!r}:\n"
        " try:\n"
        "  h=hashlib.sha256(); f=open(p,'rb')\n"
        "  while True:\n"
        "   b=f.read(1024)\n"
        "   if not b: break\n"
        "   h.update(b); wd.feed()\n"
        "  f.close(); out[p]=binascii.hexlify(h.digest()).decode()\n"
        " except OSError: out[p]=None\n"
        "print({prefix!r}+json.dumps(out))"
    ).format(
        watchdog=INSTALL_WATCHDOG_MS,
        paths=list(paths),
        prefix=HASH_PREFIX,
    )
    output = transport.exec(code)
    text = (
        output.decode("utf-8", errors="replace")
        if isinstance(output, bytes)
        else str(output)
    )
    for line in text.splitlines():
        if line.startswith(HASH_PREFIX):
            return json.loads(line[len(HASH_PREFIX) :])
    raise InstallError("XRP did not return file hashes")


def _replace_remote_file(transport, destination, data):
    """Write, verify, and then activate one replacement file."""
    temporary = destination + ".commissioning"
    expected_hash = file_sha256(data)
    transport.fs_writefile(temporary, data)
    if _remote_hashes(transport, [temporary]).get(temporary) != expected_hash:
        raise InstallError("readback mismatch for " + destination)
    transport.exec(
        "import os\n"
        "os.rename({temporary!r}, {destination!r})".format(
            temporary=temporary,
            destination=destination,
        )
    )
    if _remote_hashes(transport, [destination]).get(destination) != expected_hash:
        raise InstallError("readback mismatch for " + destination)


def _remove_remote_file(transport, path):
    """Remove one known device file if present."""
    transport.exec(
        "import os\n"
        "try: os.remove({!r})\n"
        "except OSError: pass".format(path)
    )


def _read_remote_json(transport, path):
    try:
        value = json.loads(transport.fs_readfile(path).decode("utf-8"))
    except (OSError, UnicodeError, ValueError, AttributeError):
        return None
    return value if isinstance(value, dict) else None


def _activation_record_is_well_formed(record):
    return (
        isinstance(record, dict)
        and isinstance(record.get("generation"), int)
        and record.get("generation", 0) > 0
        and record.get("slot") in ("a", "b")
        and isinstance(record.get("releaseId"), str)
        and isinstance(record.get("releaseSequence"), int)
        and isinstance(record.get("runtimeManifestSha256"), str)
        and len(record["runtimeManifestSha256"]) == 64
    )


def _activation_records(transport):
    """Read both journals and identify records whose slot manifest still matches."""
    records = []
    for path in ACTIVE_RECORDS:
        record = _read_remote_json(transport, path)
        if not _activation_record_is_well_formed(record):
            continue
        record = dict(record)
        record["recordPath"] = path
        manifest_path = _slot_root(record["slot"]) + "/runtime-manifest.json"
        try:
            manifest_data = transport.fs_readfile(manifest_path)
        except OSError:
            manifest_data = None
        record["valid"] = bool(
            manifest_data is not None
            and file_sha256(manifest_data) == record["runtimeManifestSha256"]
        )
        records.append(record)
    return sorted(records, key=lambda item: item["generation"])


def _confirmation_matches(record, confirmation):
    return bool(
        record
        and isinstance(confirmation, dict)
        and confirmation.get("generation") == record["generation"]
        and confirmation.get("runtimeManifestSha256")
        == record["runtimeManifestSha256"]
    )


def _slot_files_match(transport, slot, manifest):
    root = _slot_root(slot)
    expected = {
        root + "/" + entry["path"]: entry["sha256"]
        for entry in manifest["files"]
    }
    remote = _remote_hashes(transport, list(expected))
    return all(remote.get(path) == digest for path, digest in expected.items())


def _verify_staged_runtime(transport, slot):
    """Import the staged package roots before making the slot bootable."""
    marker = "UCSB_XRP_STAGED_RUNTIME_OK"
    slot_lib = _slot_root(slot) + "/lib"
    code = (
        "import gc, machine, sys\n"
        "wd=machine.WDT(timeout={watchdog})\n"
        "managed=('ucsb_xrp','ucsb_xrp_reference','ucsb_xrp_service')\n"
        "for name in list(sys.modules):\n"
        " if name.split('.')[0] in managed: del sys.modules[name]\n"
        "sys.path.insert(0,{slot_lib!r})\n"
        "try:\n"
        " for name in managed:\n"
        "  __import__(name); wd.feed()\n"
        " print({marker!r})\n"
        "finally:\n"
        " try: sys.path.remove({slot_lib!r})\n"
        " except ValueError: pass\n"
        " for name in list(sys.modules):\n"
        "  if name.split('.')[0] in managed: del sys.modules[name]\n"
        " gc.collect(); wd.feed()"
    ).format(
        watchdog=INSTALL_WATCHDOG_MS,
        slot_lib=slot_lib,
        marker=marker,
    )
    output = transport.exec(code)
    text = (
        output.decode("utf-8", errors="replace")
        if isinstance(output, bytes)
        else str(output)
    )
    if marker not in text:
        raise InstallError("staged XRP runtime did not pass its import check")


def _remove_obsolete_slot_files(transport, slot, old_manifest, new_manifest):
    if not isinstance(old_manifest, dict):
        return
    current = {entry["path"] for entry in new_manifest["files"]}
    root = _slot_root(slot)
    for entry in old_manifest.get("files", []):
        path = entry.get("path") if isinstance(entry, dict) else None
        if (
            isinstance(path, str)
            and path not in current
            and path.startswith("lib/")
            and ".." not in path.split("/")
        ):
            _remove_remote_file(transport, root + "/" + path)


def _install_bootstrap(transport, installed, unchanged):
    for destination, source in bootstrap_files().items():
        data = source.read_bytes()
        record = {
            "kind": "bootstrap",
            "path": destination,
            "bytes": len(data),
            "sha256": file_sha256(data),
        }
        if _remote_hashes(transport, [destination]).get(destination) == record["sha256"]:
            unchanged.append(record)
            continue
        _replace_remote_file(transport, destination, data)
        installed.append(record)


def _stage_runtime(transport, slot, manifest, installed, unchanged):
    """Replace an inactive slot and publish its manifest only after verification."""
    root = _slot_root(slot)
    manifest_path = root + "/runtime-manifest.json"
    old_manifest = _read_remote_json(transport, manifest_path)

    # Without its manifest the inactive slot cannot satisfy any old activation
    # record if the controller resets during this transaction.
    _remove_remote_file(transport, manifest_path)
    _ensure_remote_dirs(transport, slot)
    expected = {entry["path"]: entry for entry in manifest["files"]}
    remote_paths = [root + "/" + path for path in expected]
    remote_hashes = _remote_hashes(transport, remote_paths)
    sources = runtime_files()
    for relative, entry in expected.items():
        destination = root + "/" + relative
        record = {
            "kind": "runtime",
            "path": destination,
            "bytes": entry["bytes"],
            "sha256": entry["sha256"],
        }
        if remote_hashes.get(destination) == entry["sha256"]:
            unchanged.append(record)
            continue
        _replace_remote_file(transport, destination, sources[relative].read_bytes())
        installed.append(record)

    _remove_obsolete_slot_files(transport, slot, old_manifest, manifest)
    if not _slot_files_match(transport, slot, manifest):
        raise InstallError("staged XRP runtime files did not match the release manifest")
    _verify_staged_runtime(transport, slot)

    manifest_data = canonical_json_bytes(manifest)
    _replace_remote_file(transport, manifest_path, manifest_data)
    installed.append(
        {
            "kind": "runtime-manifest",
            "path": manifest_path,
            "bytes": len(manifest_data),
            "sha256": file_sha256(manifest_data),
        }
    )
    return manifest_data


def install(port, discover_address=True):
    try:
        from mpremote.transport_serial import SerialTransport
    except ImportError as exc:
        raise InstallError(
            "mpremote is unavailable; run this with the repository .venv"
        ) from exc

    release = release_metadata()
    manifest = runtime_manifest(release)
    sources = list(runtime_files().values()) + list(bootstrap_files().values())
    if not sources or any(not path.is_file() for path in sources):
        raise InstallError("service or course release files are incomplete")

    transport = None
    raw_repl_entered = False
    reset_started = False
    installed = []
    unchanged = []
    activation = None
    address = None
    try:
        transport = SerialTransport(port, timeout=12)
        enter_raw_repl(transport)
        raw_repl_entered = True
        feed_install_watchdog(transport)
        _ensure_remote_dirs(transport)
        feed_install_watchdog(transport)

        expected_manifest_data = canonical_json_bytes(manifest)
        expected_manifest_hash = file_sha256(expected_manifest_data)
        records = _activation_records(transport)
        newer = next(
            (
                record
                for record in reversed(records)
                if record["valid"]
                and record["releaseSequence"] > release["release_sequence"]
            ),
            None,
        )
        if newer:
            raise InstallError(
                "XRP runtime {} is newer than this installer; reload the current course release".format(
                    newer["releaseId"]
                )
            )
        confirmation = _read_remote_json(transport, CONFIRMED_RECORD)
        confirmed = next(
            (
                record
                for record in reversed(records)
                if record["valid"] and _confirmation_matches(record, confirmation)
            ),
            None,
        )
        latest_valid = next(
            (record for record in reversed(records) if record["valid"]), None
        )
        effective = confirmed or latest_valid
        installed_release = next(
            (
                record
                for record in reversed(records)
                if record["valid"]
                and record["releaseId"] == release["release_id"]
                and record["releaseSequence"] == release["release_sequence"]
                and record["runtimeManifestSha256"] == expected_manifest_hash
                and _confirmation_matches(record, confirmation)
            ),
            None,
        )

        if installed_release and _slot_files_match(
            transport, installed_release["slot"], manifest
        ):
            # Stable boot files may be repaired independently because they
            # contain no release payload.
            _install_bootstrap(transport, installed, unchanged)
            activation = {
                key: installed_release[key]
                for key in (
                    "generation",
                    "slot",
                    "releaseId",
                    "releaseSequence",
                    "runtimeManifestSha256",
                )
            }
        else:
            base_slot = effective["slot"] if effective else (
                records[-1]["slot"] if records else "b"
            )
            target_slot = "b" if base_slot == "a" else "a"
            generation = max(
                [record["generation"] for record in records] or [0]
            ) + 1

            _stage_runtime(
                transport,
                target_slot,
                manifest,
                installed,
                unchanged,
            )
            feed_install_watchdog(transport)
            # The verified slot exists before main.py begins using the stable
            # loader. course_boot.py is itself published before main.py, so an
            # interrupted first migration continues through the legacy boot.
            _install_bootstrap(transport, installed, unchanged)
            feed_install_watchdog(transport)
            activation = {
                "schemaVersion": 1,
                "generation": generation,
                "slot": target_slot,
                "releaseId": release["release_id"],
                "releaseSequence": release["release_sequence"],
                "runtimeManifestSha256": expected_manifest_hash,
            }
            activation_data = canonical_json_bytes(activation)
            activation_path = ACTIVE_RECORDS[(generation - 1) % len(ACTIVE_RECORDS)]
            _replace_remote_file(transport, activation_path, activation_data)
            installed.append(
                {
                    "kind": "activation",
                    "path": activation_path,
                    "bytes": len(activation_data),
                    "sha256": file_sha256(activation_data),
                }
            )

        if discover_address:
            # Determine the selected network before reset while repair still
            # owns the quiet raw REPL. Reopening USB immediately after reset
            # can interrupt the trial runtime before it confirms, causing a
            # correct installation to roll back on its next boot.
            address = parse_device_address(
                transport.exec(device_address_code(timeout_ms=12_000))
            )
            if not address:
                raise InstallError("XRP did not obtain a usable Wi-Fi address")

        reset_started = True
        transport.exec_raw_no_follow(
            "import machine; "
            "machine.WDT(timeout={}).feed(); "
            "machine.reset()".format(INSTALL_WATCHDOG_MS)
        )
    except InstallError:
        raise
    except Exception as exc:
        raise InstallError("USB service installation failed: {}".format(exc)) from exc
    finally:
        if transport is not None:
            if raw_repl_entered and not reset_started:
                reset_and_close(transport)
            else:
                try:
                    transport.close()
                except OSError:
                    # A hard reset can re-enumerate USB before pyserial lowers DTR.
                    # Readback has already completed and the LAN check below confirms
                    # that the new service booted.
                    pass
    return {
        "address": address,
        "release_id": release["release_id"],
        "release_sequence": release["release_sequence"],
        "activation": activation,
        "files": installed + unchanged,
        "installed_files": installed,
        "unchanged_files": unchanged,
        "installed_count": len(installed),
        "unchanged_count": len(unchanged),
    }


def install_with_usb_retry(
    port, attempts=USB_INSTALL_ATTEMPTS, discover_address=True
):
    """Retry only transient USB transport loss; logical failures stay immediate."""
    if attempts < 1:
        raise ValueError("attempts must be at least 1")
    last_error = None
    for attempt in range(attempts):
        try:
            return install(port, discover_address=discover_address)
        except InstallError as exc:
            last_error = exc
            if not str(exc).startswith("USB service installation failed:"):
                raise
            if attempt + 1 < attempts:
                time.sleep(1.0)
    raise last_error


def wait_for_service(address, timeout_s=12.0, expected_activation=None):
    if not address:
        raise InstallError("XRP had no Wi-Fi address before service restart")
    url = "http://{}/api/v1/info".format(address)
    deadline = time.monotonic() + timeout_s
    last_error = None
    while time.monotonic() < deadline:
        try:
            with urlopen(url, timeout=2.0) as response:
                value = json.loads(response.read().decode("utf-8"))
            identity_matches = not expected_activation or (
                value.get("runtimeRelease") == expected_activation.get("releaseId")
                and value.get("runtimeReleaseSequence")
                == expected_activation.get("releaseSequence")
                and value.get("runtimeManifestSha256")
                == expected_activation.get("runtimeManifestSha256")
            )
            if (
                value.get("protocol") == 1
                and value.get("address") == address
                and identity_matches
            ):
                return value
            last_error = "unexpected service or runtime identity"
        except (OSError, URLError, ValueError) as exc:
            last_error = str(exc)
        time.sleep(0.2)
    raise InstallError(
        "course service did not answer at {}: {}".format(url, last_error)
    )


def make_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", help="XRP USB serial device; detected automatically")
    parser.add_argument(
        "--skip-network-check",
        action="store_true",
        help="install over USB without waiting for the LAN discovery reply",
    )
    return parser


def main(argv=None):
    args = make_parser().parse_args(argv)
    try:
        result = install_with_usb_retry(
            choose_port(args.port),
            discover_address=not args.skip_network_check,
        )
        if not args.skip_network_check:
            result["service"] = wait_for_service(
                result["address"], expected_activation=result["activation"]
            )
    except InstallError as exc:
        print("Install error: {}".format(exc), file=sys.stderr)
        return 2
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
