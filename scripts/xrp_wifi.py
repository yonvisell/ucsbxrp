#!/usr/bin/env python3
"""Configure and inspect the XRP's ordinary Wi-Fi connection over USB.

The password is read from a local file, sent directly over the serial REPL, and
never printed. The resulting device configuration is intentionally persistent
so the course service can reconnect after reset.
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
DEVICE_CONFIG = "/xrp_wifi.json"
RESULT_PREFIX = "UCSB_XRP_WIFI="
EXPECTED_VID = 0x1B4F
EXPECTED_PID = 0x0046


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
    ssid,
    password,
    hostname,
    static_address=None,
    netmask="255.255.255.0",
    gateway=None,
    dns=None,
):
    config = {"ssid": ssid, "password": password, "hostname": hostname}
    if static_address is None:
        return config
    if not gateway:
        raise WifiSetupError("--gateway is required with --static-address")
    config["ifconfig"] = [static_address, netmask, gateway, dns or gateway]
    return config


def parse_result(output):
    text = output.decode("utf-8", errors="replace") if isinstance(output, bytes) else output
    for line in text.splitlines():
        if line.startswith(RESULT_PREFIX):
            return json.loads(line[len(RESULT_PREFIX) :])
    raise WifiSetupError("The XRP did not return a structured Wi-Fi result")


def device_connect_code(timeout_ms):
    return """
import json, network, time
config = json.load(open({config_path!r}))
network.hostname(config['hostname'])
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
if config.get('ifconfig'):
    wlan.ifconfig(tuple(config['ifconfig']))
if not wlan.isconnected() and wlan.status() not in (network.STAT_CONNECTING, 2):
    wlan.connect(config['ssid'], config['password'])
deadline = time.ticks_add(time.ticks_ms(), {timeout_ms})
while not wlan.isconnected() and time.ticks_diff(deadline, time.ticks_ms()) > 0:
    time.sleep_ms(100)
status_names = {{
    network.STAT_IDLE: 'idle',
    network.STAT_CONNECTING: 'connecting',
    network.STAT_WRONG_PASSWORD: 'wrong_password',
    network.STAT_NO_AP_FOUND: 'network_not_found',
    network.STAT_CONNECT_FAIL: 'connect_failed',
    network.STAT_GOT_IP: 'connected',
    2: 'waiting_for_ip',
}}
status = wlan.status()
result = {{
    'connected': wlan.isconnected(),
    'status': status_names.get(status, str(status)),
    'hostname': network.hostname(),
    'address': wlan.ifconfig()[0] if wlan.isconnected() else None,
    'address_mode': 'static' if config.get('ifconfig') else 'dhcp',
}}
print({prefix!r} + json.dumps(result))
""".format(
        config_path=DEVICE_CONFIG,
        timeout_ms=int(timeout_ms),
        prefix=RESULT_PREFIX,
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
    ssid,
    password,
    hostname,
    timeout_s=45.0,
    static_address=None,
    netmask="255.255.255.0",
    gateway=None,
    dns=None,
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
        ),
        separators=(",", ":"),
    ).encode("utf-8")
    transport = SerialTransport(port, timeout=max(5, timeout_s + 5))
    try:
        enter_raw_repl(transport, soft_reset=True)
        transport.fs_writefile(DEVICE_CONFIG, config_bytes)
        return execute_device_connect(transport, timeout_s)
    except Exception as exc:
        if isinstance(exc, WifiSetupError):
            raise
        raise WifiSetupError("USB Wi-Fi setup failed: {}".format(exc)) from exc
    finally:
        try:
            transport.exit_raw_repl()
        except Exception:
            pass
        transport.close()


def make_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", help="XRP USB serial device; detected automatically")
    parser.add_argument("--ssid", default="Pink")
    parser.add_argument("--hostname", default="ucsb-xrp")
    parser.add_argument("--credentials", type=Path)
    parser.add_argument("--timeout", type=float, default=45.0)
    parser.add_argument("--static-address")
    parser.add_argument("--netmask", default="255.255.255.0")
    parser.add_argument("--gateway")
    parser.add_argument("--dns")
    return parser


def main(argv=None):
    args = make_parser().parse_args(argv)
    try:
        port = choose_port(args.port)
        credentials = choose_credentials_path(args.credentials)
        password = read_password(credentials, args.ssid)
        result = configure(
            port,
            args.ssid,
            password,
            args.hostname,
            timeout_s=args.timeout,
            static_address=args.static_address,
            netmask=args.netmask,
            gateway=args.gateway,
            dns=args.dns,
        )
    except WifiSetupError as exc:
        print("Wi-Fi setup error: {}".format(exc), file=sys.stderr)
        return 2
    safe_result = dict(result)
    safe_result["credential_source"] = str(credentials)
    print(json.dumps(safe_result, indent=2, sort_keys=True))
    return 0 if result.get("connected") else 1


if __name__ == "__main__":
    sys.exit(main())
