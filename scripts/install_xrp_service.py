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
ADDRESS_PREFIX = "UCSB_XRP_ADDRESS="
INSTALL_WATCHDOG_MS = 8388
USB_INSTALL_ATTEMPTS = 3


class InstallError(RuntimeError):
    """The service installation did not complete."""


def enter_raw_repl(transport):
    """Interrupt a running course service before mpremote enters raw REPL."""
    transport.serial.write(b"\r\x03\x03\x03")
    time.sleep(0.15)
    transport.enter_raw_repl(soft_reset=False)


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


def read_address_after_restart(port, timeout_s=25.0):
    """Read the post-reboot DHCP address, then restart the course service."""
    try:
        from mpremote.transport_serial import SerialTransport
    except ImportError as exc:
        raise InstallError(
            "mpremote is unavailable; run this with the repository .venv"
        ) from exc

    deadline = time.monotonic() + timeout_s
    last_error = None
    time.sleep(1.5)
    while time.monotonic() < deadline:
        transport = None
        try:
            remaining = max(1.0, deadline - time.monotonic())
            transport = SerialTransport(port, timeout=remaining + 5)
            enter_raw_repl(transport)
            output = transport.exec(device_address_code(remaining * 1000))
            address = parse_device_address(output)
            transport.exec_raw_no_follow("import machine; machine.reset()")
            if address:
                return address
            last_error = "XRP has not received a Wi-Fi address"
        except Exception as exc:
            last_error = str(exc)
        finally:
            if transport is not None:
                try:
                    transport.close()
                except OSError:
                    pass
        time.sleep(0.4)
    raise InstallError(
        "could not read the XRP Wi-Fi address after restart: {}".format(last_error)
    )


def _ensure_remote_dirs(transport):
    transport.exec(
        "import os\n"
        "for p in ('/lib','/lib/ucsb_xrp','/lib/ucsb_xrp_reference','/lib/ucsb_xrp_service'):\n"
        " try: os.mkdir(p)\n"
        " except OSError: pass"
    )


def _remote_file_matches(transport, destination, expected):
    """Return whether one installed file already has the release bytes."""
    try:
        return transport.fs_readfile(destination) == expected
    except OSError:
        return False


def _replace_remote_file(transport, destination, data):
    """Write, verify, and then activate one replacement file."""
    temporary = destination + ".commissioning"
    transport.fs_writefile(temporary, data)
    if transport.fs_readfile(temporary) != data:
        raise InstallError("readback mismatch for " + destination)
    transport.exec(
        "import os\n"
        "os.rename({temporary!r}, {destination!r})".format(
            temporary=temporary,
            destination=destination,
        )
    )
    if transport.fs_readfile(destination) != data:
        raise InstallError("readback mismatch for " + destination)


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

    transport = None
    files = []
    installed = []
    unchanged = []
    try:
        transport = SerialTransport(port, timeout=12)
        enter_raw_repl(transport)
        feed_install_watchdog(transport)
        _ensure_remote_dirs(transport)
        feed_install_watchdog(transport)
        for destination, source in sources.items():
            data = source.read_bytes()
            record = {
                "path": destination,
                "bytes": len(data),
                "sha256": file_sha256(data),
            }
            files.append(record)
            feed_install_watchdog(transport)
            if _remote_file_matches(transport, destination, data):
                unchanged.append(record)
                continue
            _replace_remote_file(transport, destination, data)
            feed_install_watchdog(transport)
            installed.append(record)
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
            try:
                transport.close()
            except OSError:
                # A hard reset can re-enumerate USB before pyserial lowers DTR.
                # Readback has already completed and the LAN check below confirms
                # that the new service booted.
                pass
    return {
        "address": read_address_after_restart(port),
        "files": files,
        "installed_files": installed,
        "unchanged_files": unchanged,
        "installed_count": len(installed),
        "unchanged_count": len(unchanged),
    }


def install_with_usb_retry(port, attempts=USB_INSTALL_ATTEMPTS):
    """Retry only transient USB transport loss; logical failures stay immediate."""
    if attempts < 1:
        raise ValueError("attempts must be at least 1")
    last_error = None
    for attempt in range(attempts):
        try:
            return install(port)
        except InstallError as exc:
            last_error = exc
            if not str(exc).startswith("USB service installation failed:"):
                raise
            if attempt + 1 < attempts:
                time.sleep(1.0)
    raise last_error


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
        result = install_with_usb_retry(choose_port(args.port))
        if not args.skip_network_check:
            result["service"] = wait_for_service(result["address"])
    except InstallError as exc:
        print("Install error: {}".format(exc), file=sys.stderr)
        return 2
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
