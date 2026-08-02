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
EXPECTED_VID = 0x1B4F
EXPECTED_PID = 0x0046


class InstallError(RuntimeError):
    """The service installation did not complete."""


def enter_raw_repl(transport):
    """Interrupt a running course service before mpremote enters raw REPL."""
    transport.serial.write(b"\r\x03\x03\x03")
    time.sleep(0.15)
    transport.enter_raw_repl(soft_reset=False)


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


def installation_files():
    files = {}
    for path in sorted((SERVICE_SOURCE / "ucsb_xrp_service").glob("*.py")):
        files["/lib/ucsb_xrp_service/" + path.name] = path
    for path in sorted(COURSE_SOURCE.glob("*.py")):
        files["/lib/ucsb_xrp/" + path.name] = path
    for path in sorted(REFERENCE_SOURCE.glob("*.mpy")):
        files["/lib/ucsb_xrp_reference/" + path.name] = path
    files["/main.py"] = SERVICE_SOURCE / "main.py"
    return files


def file_sha256(data):
    return hashlib.sha256(data).hexdigest()


def _ensure_remote_dirs(transport):
    transport.exec(
        "import os\n"
        "for p in ('/lib','/lib/ucsb_xrp','/lib/ucsb_xrp_reference','/lib/ucsb_xrp_service'):\n"
        " try: os.mkdir(p)\n"
        " except OSError: pass"
    )


def install(port):
    try:
        from mpremote.transport_serial import SerialTransport
    except ImportError as exc:
        raise InstallError(
            "mpremote is unavailable; run this with the repository .venv"
        ) from exc

    sources = installation_files()
    if not sources or any(not path.is_file() for path in sources.values()):
        raise InstallError("service or course release files are incomplete")

    transport = SerialTransport(port, timeout=12)
    address = None
    installed = []
    try:
        enter_raw_repl(transport)
        address_output = transport.exec(
            "import network\n"
            "w=network.WLAN(network.STA_IF)\n"
            "print(w.ifconfig()[0] if w.isconnected() else '')"
        )
        address = address_output.decode("utf-8", errors="replace").strip() or None
        _ensure_remote_dirs(transport)
        for destination, source in sources.items():
            data = source.read_bytes()
            transport.fs_writefile(destination, data)
            actual = transport.fs_readfile(destination)
            if actual != data:
                raise InstallError("readback mismatch for " + destination)
            installed.append(
                {
                    "path": destination,
                    "bytes": len(data),
                    "sha256": file_sha256(data),
                }
            )
        transport.exec_raw_no_follow("import machine; machine.reset()")
    except InstallError:
        raise
    except Exception as exc:
        raise InstallError("USB service installation failed: {}".format(exc)) from exc
    finally:
        try:
            transport.close()
        except OSError:
            # A hard reset can re-enumerate USB before pyserial lowers DTR.
            # Readback has already completed and the LAN check below confirms
            # that the new service booted.
            pass
    return {"address": address, "files": installed}


def wait_for_service(address, timeout_s=45.0):
    if not address:
        raise InstallError("XRP had no Wi-Fi address before service restart")
    url = "http://{}/api/v1/info".format(address)
    deadline = time.monotonic() + timeout_s
    last_error = None
    while time.monotonic() < deadline:
        try:
            with urlopen(url, timeout=2.0) as response:
                value = json.loads(response.read().decode("utf-8"))
            if value.get("protocol") == 1 and value.get("address") == address:
                return value
            last_error = "unexpected discovery reply"
        except (OSError, URLError, ValueError) as exc:
            last_error = str(exc)
        time.sleep(0.4)
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
        result = install(choose_port(args.port))
        if not args.skip_network_check:
            result["service"] = wait_for_service(result["address"])
    except InstallError as exc:
        print("Install error: {}".format(exc), file=sys.stderr)
        return 2
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
