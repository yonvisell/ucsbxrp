#!/usr/bin/env python3
"""Safety-tiered host utility for the current SparkFun RP2350 XRP.

The default `probe` and `verify-firmware` commands are H0/read-only. The
`enter-bootloader` command changes controller state and therefore requires the
literal `--allow-state-change` gate. No command in this utility can issue a
motor effort.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import sys
import time


EXPECTED_VID = 0x1B4F
EXPECTED_PID = 0x0046
DEFAULT_RELEASE = Path(__file__).resolve().parents[1] / "vendor/current/release.json"
DEFAULT_STATUS_FILES = (
    Path("/Volumes/PICODISK/XRP-Status.txt"),
    Path("/Volumes/PICODISK/xrp-status.txt"),
)
BOOT_VOLUME_NAMES = ("RP2350", "RPI-RP2")


class HardwareError(RuntimeError):
    """A bounded hardware operation could not be completed safely."""


def _sha256_bytes(value):
    return hashlib.sha256(value).hexdigest()


def identity_hash(serial_number):
    """Return a stable controller identity without exposing its USB serial."""
    if not serial_number:
        return None
    return _sha256_bytes(serial_number.encode("utf-8"))


def parse_status_text(text):
    """Parse the simple `Key: value` XRP status format."""
    result = {}
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or ":" not in line:
            continue
        key, value = line.split(":", 1)
        result[key.strip()] = value.strip()
    return result


def classify_status(status):
    """Classify only evidence strong enough to distinguish known runtimes."""
    password = status.get("AP PASS", "")
    if password == "xrp-wpilib" and status.get("Version"):
        return "xrp-wpilib"
    return "unknown"


def redact_status(status):
    safe = {}
    for key, value in status.items():
        if key in {"AP PASS", "STA PASS", "PASSWORD", "Password"}:
            safe[key] = "<redacted>"
        elif key in {"AP SSID", "STA SSID", "SSID"}:
            safe[key] = "<unique-name-redacted>"
        elif key == "Chip ID":
            safe["Chip ID SHA-256"] = _sha256_bytes(value.encode("utf-8"))
        else:
            safe[key] = value
    return safe


def load_release(path):
    with Path(path).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def file_sha256(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        while True:
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def verify_firmware(path, release):
    firmware = release["micropython"]
    candidate = Path(path)
    if not candidate.is_file():
        raise HardwareError("Firmware file does not exist: {}".format(candidate))
    actual_size = candidate.stat().st_size
    actual_sha256 = file_sha256(candidate)
    expected_size = int(firmware["byte_size"])
    expected_sha256 = str(firmware["sha256"]).lower()
    if actual_size != expected_size:
        raise HardwareError(
            "Firmware size mismatch: expected {}, observed {}".format(
                expected_size, actual_size
            )
        )
    if actual_sha256 != expected_sha256:
        raise HardwareError(
            "Firmware SHA-256 mismatch: expected {}, observed {}".format(
                expected_sha256, actual_sha256
            )
        )
    return {
        "asset": firmware["asset"],
        "path": str(candidate.resolve()),
        "byte_size": actual_size,
        "sha256": actual_sha256,
        "verified": True,
    }


def _serial_ports():
    try:
        from serial.tools import list_ports
    except ImportError as exc:
        raise HardwareError(
            "pyserial is unavailable; run .venv/bin/python with requirements-dev.txt"
        ) from exc
    return list(list_ports.comports())


def find_controller_ports():
    matches = []
    for port in _serial_ports():
        if port.vid == EXPECTED_VID and port.pid == EXPECTED_PID:
            matches.append(port)
    return matches


def find_boot_volumes():
    volumes = []
    volume_root = Path("/Volumes")
    for name in BOOT_VOLUME_NAMES:
        candidate = volume_root / name
        if candidate.is_dir():
            volumes.append(str(candidate))
    return volumes


def read_status_file():
    for path in DEFAULT_STATUS_FILES:
        if path.is_file():
            text = path.read_text(encoding="utf-8", errors="replace")
            status = parse_status_text(text)
            return path, status
    return None, {}


def probe():
    ports = []
    for port in find_controller_ports():
        ports.append(
            {
                "device": port.device,
                "manufacturer": port.manufacturer,
                "product": port.product,
                "usb_vid": "0x{:04X}".format(port.vid),
                "usb_pid": "0x{:04X}".format(port.pid),
                "identity_sha256": identity_hash(port.serial_number),
            }
        )
    status_path, status = read_status_file()
    runtime_classification = classify_status(status)
    if runtime_classification == "unknown" and any(
        port["manufacturer"] == "MicroPython" for port in ports
    ):
        runtime_classification = "micropython-usb-device"
    return {
        "safety_tier": "H0",
        "controller_ports": ports,
        "boot_volumes": find_boot_volumes(),
        "status_path": str(status_path) if status_path else None,
        "runtime_classification": runtime_classification,
        "status": redact_status(status),
    }


def enter_bootloader(port_name, allow_state_change, timeout_s=8.0):
    """Use the exact firmware platform's 1200-baud touch reset.

    XRP-WPILib 2.1.0 pins an Arduino-Pico board manifest with
    `use_1200bps_touch: true` for USB VID/PID 1B4F:0046. This operation only
    requests ROM bootloader entry; it does not flash bytes.
    """
    if not allow_state_change:
        raise HardwareError(
            "Bootloader entry requires the literal --allow-state-change gate"
        )
    matches = find_controller_ports()
    selected = [port for port in matches if port.device == port_name]
    if len(selected) != 1:
        raise HardwareError(
            "Expected exactly one matching XRP at {}, observed {}".format(
                port_name, len(selected)
            )
        )
    try:
        import serial
    except ImportError as exc:
        raise HardwareError("pyserial is required for bootloader entry") from exc
    connection = serial.Serial(port_name, baudrate=1200, timeout=0.25)
    try:
        connection.dtr = False
    finally:
        connection.close()

    deadline = time.monotonic() + timeout_s
    while time.monotonic() < deadline:
        volumes = find_boot_volumes()
        if volumes:
            return {"entered": True, "boot_volumes": volumes}
        time.sleep(0.1)
    raise HardwareError(
        "The serial touch completed, but no RP2350/RPI-RP2 boot volume appeared"
    )


def _json_print(value):
    print(json.dumps(value, indent=2, sort_keys=True))


def make_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("probe", help="read-only USB/runtime classification")

    verify = subparsers.add_parser(
        "verify-firmware", help="verify size and SHA-256 against release.json"
    )
    verify.add_argument("firmware", type=Path)
    verify.add_argument("--release", type=Path, default=DEFAULT_RELEASE)

    boot = subparsers.add_parser(
        "enter-bootloader", help="request RP2350 ROM bootloader via 1200-baud touch"
    )
    boot.add_argument("--port", required=True)
    boot.add_argument("--allow-state-change", action="store_true")
    return parser


def main(argv=None):
    args = make_parser().parse_args(argv)
    try:
        if args.command == "probe":
            result = probe()
        elif args.command == "verify-firmware":
            result = verify_firmware(args.firmware, load_release(args.release))
        elif args.command == "enter-bootloader":
            result = enter_bootloader(args.port, args.allow_state_change)
        else:
            raise HardwareError("Unsupported command: {}".format(args.command))
    except HardwareError as exc:
        print("hardware error: {}".format(exc), file=sys.stderr)
        return 2
    _json_print(result)
    return 0


if __name__ == "__main__":
    sys.exit(main())
