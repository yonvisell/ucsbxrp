#!/usr/bin/env python3
"""Configure and inspect the XRP's Wi-Fi profile over USB.

Station credentials are read from a local file, sent directly over the serial
connection, and never printed. Access-point mode uses one fixed course password.
The resulting device configuration persists across reset.
"""

import argparse
import json
from pathlib import Path
import sys
import time


DEFAULT_CREDENTIAL_PATHS = (
    Path.home() / "Documents/Details.md",
    Path.home() / "Documents/TheDetails.md",
)
ROOT = Path(__file__).resolve().parents[1]
NETWORKING_SOURCE = (
    ROOT / "device_service" / "ucsb_xrp_service" / "networking.py"
)
DEVICE_CONFIG = "/xrp_wifi.json"
RESULT_PREFIX = "UCSB_XRP_WIFI="
EXPECTED_VID = 0x1B4F
EXPECTED_PID = 0x0046
WIFI_WATCHDOG_MS = 8388
USB_WIFI_ATTEMPTS = 3
MODE_STATION = "station"
MODE_ACCESS_POINT = "access_point"
DEFAULT_AP_PASSWORD = "ucsb-xrp"
DEFAULT_AP_ADDRESS = "192.168.42.1"


class WifiSetupError(RuntimeError):
    """The requested Wi-Fi setup could not be completed."""


def enter_raw_repl(transport, soft_reset):
    """Interrupt a running course service before mpremote enters raw REPL."""
    transport.serial.write(b"\r\x03\x03\x03")
    time.sleep(0.15)
    transport.enter_raw_repl(soft_reset=soft_reset)


def choose_port(explicit=None):
    if explicit:
        return explicit
    try:
        from serial.tools import list_ports
    except ImportError as exc:
        raise WifiSetupError("pyserial is unavailable in this Python environment") from exc
    matches = [
        port.device
        for port in list_ports.comports()
        if port.vid == EXPECTED_VID and port.pid == EXPECTED_PID
    ]
    if len(matches) == 1:
        return matches[0]
    if not matches:
        raise WifiSetupError("No USB-connected SparkFun XRP controller was found")
    raise WifiSetupError("More than one XRP is connected; specify --port")


def choose_credentials_path(explicit=None):
    if explicit is not None:
        path = Path(explicit).expanduser()
        if not path.is_file():
            raise WifiSetupError("Credential file not found: {}".format(path))
        return path
    for path in DEFAULT_CREDENTIAL_PATHS:
        if path.is_file():
            return path
    raise WifiSetupError(
        "No credential file found at {}".format(
            " or ".join(str(path) for path in DEFAULT_CREDENTIAL_PATHS)
        )
    )


def read_password(path, ssid):
    """Read a password-only file or a small ``SSID: password`` file."""
    lines = [
        line.strip()
        for line in Path(path).read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#")
    ]
    for line in lines:
        candidate = line.lstrip("-* ")
        for separator in (":", "="):
            if separator not in candidate:
                continue
            key, value = candidate.split(separator, 1)
            if key.strip().casefold() == ssid.casefold() and value.strip():
                return value.strip()
    if len(lines) == 1 and all(separator not in lines[0] for separator in (":", "=")):
        return lines[0]
    raise WifiSetupError(
        "Credential file must contain only the password or an '{}: password' line".format(
            ssid
        )
    )


def make_device_config(
    ssid=None,
    password=None,
    hostname="ucsb-xrp",
    static_address=None,
    netmask="255.255.255.0",
    gateway=None,
    dns=None,
    mode=MODE_STATION,
    ap_ssid=None,
    ap_password=DEFAULT_AP_PASSWORD,
    ap_channel=None,
):
    if mode not in (MODE_STATION, MODE_ACCESS_POINT):
        raise WifiSetupError("mode must be station or access_point")
    if not isinstance(ap_password, str) or not 8 <= len(ap_password) <= 63:
        raise WifiSetupError("access-point password must contain 8 to 63 characters")
    if ap_channel is not None and ap_channel not in (1, 6, 11):
        raise WifiSetupError("access-point channel must be 1, 6, or 11")

    access_point = {
        "password": ap_password,
        "ifconfig": [
            DEFAULT_AP_ADDRESS,
            "255.255.255.0",
            DEFAULT_AP_ADDRESS,
            DEFAULT_AP_ADDRESS,
        ],
    }
    if ap_ssid:
        access_point["ssid"] = ap_ssid
    if ap_channel is not None:
        access_point["channel"] = ap_channel

    config = {
        "version": 2,
        "mode": mode,
        "hostname": hostname,
        "access_point": access_point,
        "fallback_to_access_point": True,
    }
    if mode == MODE_ACCESS_POINT:
        return config
    if not ssid or not isinstance(password, str):
        raise WifiSetupError("station mode requires an SSID and password")
    station = {"ssid": ssid, "password": password}
    if static_address is not None:
        if not gateway:
            raise WifiSetupError("--gateway is required with --static-address")
        station["ifconfig"] = [static_address, netmask, gateway, dns or gateway]
    config["station"] = station
    return config


def parse_result(output):
    text = output.decode("utf-8", errors="replace") if isinstance(output, bytes) else output
    for line in text.splitlines():
        if line.startswith(RESULT_PREFIX):
            return json.loads(line[len(RESULT_PREFIX) :])
    raise WifiSetupError("The XRP did not return a structured Wi-Fi result")


def device_connect_code(timeout_ms):
    source = NETWORKING_SOURCE.read_text(encoding="utf-8")
    return source + """

import json, machine
watchdog = machine.WDT(timeout={watchdog_ms})
watchdog.feed()
config = json.load(open({config_path!r}))
result = activate_network(config, timeout_ms={timeout_ms}, watchdog=watchdog)
print({prefix!r} + json.dumps(result))
""".format(
        config_path=DEVICE_CONFIG,
        timeout_ms=int(timeout_ms),
        prefix=RESULT_PREFIX,
        watchdog_ms=WIFI_WATCHDOG_MS,
    )


def execute_device_connect(transport, timeout_s):
    output, error = transport.exec_raw(
        device_connect_code(timeout_s * 1000),
        timeout=timeout_s + 5,
    )
    if error:
        raise WifiSetupError(
            "XRP Wi-Fi setup failed: "
            + error.decode("utf-8", errors="replace").strip()
        )
    return parse_result(output)


def configure(
    port,
    ssid=None,
    password=None,
    hostname="ucsb-xrp",
    timeout_s=45.0,
    static_address=None,
    netmask="255.255.255.0",
    gateway=None,
    dns=None,
    mode=MODE_STATION,
    ap_ssid=None,
    ap_password=DEFAULT_AP_PASSWORD,
    ap_channel=None,
):
    try:
        from mpremote.transport_serial import SerialTransport
    except ImportError as exc:
        raise WifiSetupError(
            "mpremote is unavailable; run this with the repository .venv"
        ) from exc

    config_bytes = json.dumps(
        make_device_config(
            ssid,
            password,
            hostname,
            static_address=static_address,
            netmask=netmask,
            gateway=gateway,
            dns=dns,
            mode=mode,
            ap_ssid=ap_ssid,
            ap_password=ap_password,
            ap_channel=ap_channel,
        ),
        separators=(",", ":"),
    ).encode("utf-8")
    transport = None
    try:
        transport = SerialTransport(port, timeout=max(5, timeout_s + 5))
        enter_raw_repl(transport, soft_reset=True)
        transport.exec(
            "import machine\n"
            "machine.WDT(timeout={}).feed()".format(WIFI_WATCHDOG_MS)
        )
        transport.fs_writefile(DEVICE_CONFIG, config_bytes)
        transport.exec(
            "import machine\n"
            "machine.WDT(timeout={}).feed()".format(WIFI_WATCHDOG_MS)
        )
        return execute_device_connect(transport, timeout_s)
    except Exception as exc:
        if isinstance(exc, WifiSetupError):
            raise
        raise WifiSetupError("USB Wi-Fi setup failed: {}".format(exc)) from exc
    finally:
        if transport is not None:
            try:
                transport.exit_raw_repl()
            except Exception:
                pass
            try:
                transport.close()
            except OSError:
                pass


def configure_with_usb_retry(*args, attempts=USB_WIFI_ATTEMPTS, **kwargs):
    """Retry transient USB loss without hiding Wi-Fi configuration errors."""
    if attempts < 1:
        raise ValueError("attempts must be at least 1")
    last_error = None
    for attempt in range(attempts):
        try:
            return configure(*args, **kwargs)
        except WifiSetupError as exc:
            last_error = exc
            if not str(exc).startswith("USB Wi-Fi setup failed:"):
                raise
            if attempt + 1 < attempts:
                time.sleep(1.0)
    raise last_error


def make_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", help="XRP USB serial device; detected automatically")
    parser.add_argument(
        "--mode",
        choices=(MODE_ACCESS_POINT, MODE_STATION),
        default=MODE_ACCESS_POINT,
        help="robot hotspot (default) or an existing Wi-Fi network",
    )
    parser.add_argument("--ssid", default="Pink")
    parser.add_argument("--hostname", default="ucsb-xrp")
    parser.add_argument("--credentials", type=Path)
    parser.add_argument("--timeout", type=float, default=45.0)
    parser.add_argument("--static-address")
    parser.add_argument("--netmask", default="255.255.255.0")
    parser.add_argument("--gateway")
    parser.add_argument("--dns")
    parser.add_argument("--ap-name", help="optional hotspot name; default is device-specific")
    parser.add_argument("--ap-password", default=DEFAULT_AP_PASSWORD)
    parser.add_argument("--ap-channel", type=int, choices=(1, 6, 11))
    return parser


def main(argv=None):
    args = make_parser().parse_args(argv)
    credentials = None
    try:
        port = choose_port(args.port)
        password = None
        if args.mode == MODE_STATION:
            credentials = choose_credentials_path(args.credentials)
            password = read_password(credentials, args.ssid)
        result = configure_with_usb_retry(
            port,
            args.ssid,
            password,
            args.hostname,
            timeout_s=args.timeout,
            static_address=args.static_address,
            netmask=args.netmask,
            gateway=args.gateway,
            dns=args.dns,
            mode=args.mode,
            ap_ssid=args.ap_name,
            ap_password=args.ap_password,
            ap_channel=args.ap_channel,
        )
    except WifiSetupError as exc:
        print("Wi-Fi setup error: {}".format(exc), file=sys.stderr)
        return 2
    safe_result = dict(result)
    if credentials is not None:
        safe_result["credential_source"] = str(credentials)
    print(json.dumps(safe_result, indent=2, sort_keys=True))
    return 0 if result.get("ready") else 1


if __name__ == "__main__":
    sys.exit(main())
