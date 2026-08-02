#!/usr/bin/env python3
"""Configure one USB-connected XRP for the UCSB browser course tools."""

import argparse
import json
import sys

import install_xrp_service
import xrp_wifi


def provision(
    port=None,
    ssid="Pink",
    credentials=None,
    hostname="ucsb-xrp",
    wifi_timeout_s=45.0,
    static_address=None,
    netmask="255.255.255.0",
    gateway=None,
    dns=None,
):
    selected_port = xrp_wifi.choose_port(port)
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
    )
    if not wifi.get("connected") or not wifi.get("address"):
        raise xrp_wifi.WifiSetupError(
            "XRP did not join {} ({})".format(ssid, wifi.get("status", "unknown"))
        )
    installed = install_xrp_service.install_with_usb_retry(selected_port)
    address = installed["address"]
    service = install_xrp_service.wait_for_service(address)
    return {
        "robot": service["robotName"],
        "address": address,
        "network": ssid,
        "addressMode": wifi["address_mode"],
        "courseRelease": service["courseRelease"],
        "serviceVersion": service["serviceVersion"],
        "installedFiles": len(installed["files"]),
    }


def make_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", help="USB serial device; detected automatically")
    parser.add_argument("--ssid", default="Pink")
    parser.add_argument("--credentials")
    parser.add_argument("--hostname", default="ucsb-xrp")
    parser.add_argument("--wifi-timeout", type=float, default=45.0)
    parser.add_argument("--static-address")
    parser.add_argument("--netmask", default="255.255.255.0")
    parser.add_argument("--gateway")
    parser.add_argument("--dns")
    return parser


def main(argv=None):
    args = make_parser().parse_args(argv)
    try:
        result = provision(
            port=args.port,
            ssid=args.ssid,
            credentials=args.credentials,
            hostname=args.hostname,
            wifi_timeout_s=args.wifi_timeout,
            static_address=args.static_address,
            netmask=args.netmask,
            gateway=args.gateway,
            dns=args.dns,
        )
    except (xrp_wifi.WifiSetupError, install_xrp_service.InstallError) as exc:
        print("Provisioning error: {}".format(exc), file=sys.stderr)
        return 2
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
