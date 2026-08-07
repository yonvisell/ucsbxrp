#!/usr/bin/env python3
"""Build the public, read-verifiable browser commissioning payload."""

import argparse
import hashlib
import json
from pathlib import Path
import shutil

import install_xrp_service


ROOT = Path(__file__).resolve().parents[1]
RELEASE_PATH = ROOT / "vendor/current/release.json"
FIRMWARE_DIRECTORY = ROOT / "vendor/current/firmware"


def sha256_bytes(value):
    return hashlib.sha256(value).hexdigest()


def service_constant(name):
    candidates = (
        ROOT / "device_service/ucsb_xrp_service/protocol.py",
        ROOT / "device_service/ucsb_xrp_service/service.py",
    )
    prefix = name + " = "
    for path in candidates:
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.startswith(prefix):
                return json.loads(line.split("=", 1)[1].strip())
    raise ValueError("{} is missing from the device service".format(name))


def commissioning_manifest():
    release = json.loads(RELEASE_PATH.read_text(encoding="utf-8"))
    course_release = service_constant("COURSE_RELEASE")
    service_version = service_constant("SERVICE_VERSION")
    if course_release != release["release_id"]:
        raise ValueError("device service and course release identifiers differ")

    firmware = release["micropython"]
    firmware_path = FIRMWARE_DIRECTORY / firmware["asset"]
    if not firmware_path.is_file():
        raise ValueError("commissioning firmware is missing: {}".format(firmware_path))
    firmware_data = firmware_path.read_bytes()
    if len(firmware_data) != firmware["byte_size"]:
        raise ValueError("commissioning firmware byte count differs from release.json")
    if sha256_bytes(firmware_data) != firmware["sha256"]:
        raise ValueError("commissioning firmware hash differs from release.json")

    files = []
    for destination, source in install_xrp_service.installation_files().items():
        data = source.read_bytes()
        files.append(
            {
                "destination": destination,
                "url": "files/{}".format(destination.lstrip("/")),
                "bytes": len(data),
                "sha256": sha256_bytes(data),
                "source": str(source.relative_to(ROOT)).replace("\\", "/"),
            }
        )

    controller = release["controller"]
    return {
        "schemaVersion": 1,
        "releaseId": release["release_id"],
        "serviceVersion": service_version,
        "courseLibraryVersion": release["ucsb_xrp"]["version"],
        "controller": {
            "id": controller["id"],
            "usbVendorId": int(controller["usb_vid"], 16),
            "usbProductId": int(controller["usb_pid"], 16),
        },
        "micropython": {
            "version": firmware["version"],
            "board": firmware["board"],
            "firmware": {
                "asset": firmware["asset"],
                "url": "../current/firmware/{}".format(firmware["asset"]),
                "bytes": firmware["byte_size"],
                "sha256": firmware["sha256"],
            },
        },
        "xrplib": {
            "version": release["xrplib"]["version"],
            "requiredModules": [
                "XRPLib.board",
                "XRPLib.encoded_motor",
                "XRPLib.imu",
                "XRPLib.rangefinder",
            ],
        },
        "networkDefaults": {
            "mode": "access_point",
            "password": "ucsb-xrp",
            "address": "192.168.42.1",
        },
        "files": files,
    }


def write_bundle(output_directory):
    output = Path(output_directory)
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    manifest = commissioning_manifest()
    sources = install_xrp_service.installation_files()
    for entry in manifest["files"]:
        destination = output / entry["url"]
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(sources[entry["destination"]], destination)
    (output / "manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return manifest


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "output",
        nargs="?",
        type=Path,
        default=ROOT / "dist/course/commissioning",
    )
    args = parser.parse_args(argv)
    manifest = write_bundle(args.output)
    print(
        "Commissioning bundle {}: {} files".format(
            manifest["releaseId"], len(manifest["files"])
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
