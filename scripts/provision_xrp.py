#!/usr/bin/env python3
"""Configure one USB-connected XRP for the UCSB browser course tools."""

import argparse
import json
import sys

import install_xrp_service
import xrp_wifi


def local_service_version():
    """Read the installed service version without importing MicroPython code."""
    protocol_path = (
        install_xrp_service.ROOT
        / "device_service/ucsb_xrp_service/protocol.py"
    )
    for line in protocol_path.read_text(encoding="utf-8").splitlines():
        if line.startswith("SERVICE_VERSION = "):
            return json.loads(line.split("=", 1)[1].strip())
    raise install_xrp_service.InstallError(
        "SERVICE_VERSION is missing from the device protocol"
    )


def provision(
    port=None,
    mode=xrp_wifi.MODE_ACCESS_POINT,
    ssid="Pink",
    credentials=None,
    hostname="ucsb-xrp",
    wifi_timeout_s=45.0,
    static_address=None,
    netmask="255.255.255.0",
    gateway=None,
    dns=None,
    ap_name=None,
    ap_password=xrp_wifi.DEFAULT_AP_PASSWORD,
    ap_channel=None,
):
    selected_port = xrp_wifi.choose_port(port)
    password = None
    if mode == xrp_wifi.MODE_STATION:
        credentials_path = xrp_wifi.choose_credentials_path(credentials)
        password = xrp_wifi.read_password(credentials_path, ssid)
    wifi = xrp_wifi.configure_with_usb_retry(
        selected_port,
        ssid,
        password,
        hostname,
        timeout_s=wifi_timeout_s,
        static_address=static_address,
        netmask=netmask,
        gateway=gateway,
        dns=dns,
        mode=mode,
        ap_ssid=ap_name,
        ap_password=ap_password,
        ap_channel=ap_channel,
    )
    if not wifi.get("ready") or not wifi.get("address"):
        raise xrp_wifi.WifiSetupError(
            "XRP network did not start ({})".format(wifi.get("status", "unknown"))
        )
    installed = install_xrp_service.install_with_usb_retry(selected_port)
    address = installed["address"]
    service = None
    if wifi["mode"] == xrp_wifi.MODE_STATION:
        service = install_xrp_service.wait_for_service(address)
    release = json.loads(
        (install_xrp_service.ROOT / "vendor/current/release.json").read_text(
            encoding="utf-8"
        )
    )
    return {
        "robot": service["robotName"] if service else wifi["hostname"],
        "address": address,
        "mode": wifi["mode"],
        "requestedMode": wifi["requested_mode"],
        "fallback": wifi["fallback"],
        "network": wifi["ssid"],
        "addressMode": wifi["address_mode"],
        "courseRelease": service["courseRelease"] if service else release["release_id"],
        "serviceVersion": service["serviceVersion"] if service else local_service_version(),
        "installedFiles": len(installed["files"]),
    }


def make_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", help="USB serial device; detected automatically")
    parser.add_argument(
        "--mode",
        choices=(xrp_wifi.MODE_ACCESS_POINT, xrp_wifi.MODE_STATION),
        default=xrp_wifi.MODE_ACCESS_POINT,
        help="robot hotspot (default) or an existing Wi-Fi network",
    )
    parser.add_argument("--ssid", default="Pink")
    parser.add_argument("--credentials")
    parser.add_argument("--hostname", default="ucsb-xrp")
    parser.add_argument("--wifi-timeout", type=float, default=45.0)
    parser.add_argument("--static-address")
    parser.add_argument("--netmask", default="255.255.255.0")
    parser.add_argument("--gateway")
    parser.add_argument("--dns")
    parser.add_argument("--ap-name", help="optional hotspot name; default is device-specific")
    parser.add_argument("--ap-password", default=xrp_wifi.DEFAULT_AP_PASSWORD)
    parser.add_argument("--ap-channel", type=int, choices=(1, 6, 11))
    return parser


def main(argv=None):
    args = make_parser().parse_args(argv)
    try:
        result = provision(
            port=args.port,
            mode=args.mode,
            ssid=args.ssid,
            credentials=args.credentials,
            hostname=args.hostname,
            wifi_timeout_s=args.wifi_timeout,
            static_address=args.static_address,
            netmask=args.netmask,
            gateway=args.gateway,
            dns=args.dns,
            ap_name=args.ap_name,
            ap_password=args.ap_password,
            ap_channel=args.ap_channel,
        )
    except (xrp_wifi.WifiSetupError, install_xrp_service.InstallError) as exc:
        print("Provisioning error: {}".format(exc), file=sys.stderr)
        return 2
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
