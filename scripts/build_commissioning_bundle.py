#!/usr/bin/env python3
"""Build the public, read-verifiable browser commissioning payload."""

import argparse
import json
from pathlib import Path
import shutil

import install_xrp_service


ROOT = Path(__file__).resolve().parents[1]
FIRMWARE_DIRECTORY = ROOT / "vendor/current/firmware"


def firmware_bundle_url(firmware):
    """Return a URL whose identity changes whenever the UF2 bytes change."""
    return "firmware/sha256/{}/{}".format(
        firmware["sha256"],
        firmware["asset"],
    )


def commissioning_manifest():
    release = install_xrp_service.release_metadata()
    firmware = release["micropython"]
    firmware_path = FIRMWARE_DIRECTORY / firmware["asset"]
    if not firmware_path.is_file():
        raise ValueError("commissioning firmware is missing: {}".format(firmware_path))
    firmware_data = firmware_path.read_bytes()
    if len(firmware_data) != firmware["byte_size"]:
        raise ValueError("commissioning firmware byte count differs from release.json")
    if install_xrp_service.file_sha256(firmware_data) != firmware["sha256"]:
        raise ValueError("commissioning firmware hash differs from release.json")

    runtime_manifest = install_xrp_service.runtime_manifest(release)
    runtime_manifest_data = install_xrp_service.canonical_json_bytes(runtime_manifest)
    runtime_files = []
    for path, source in install_xrp_service.runtime_files().items():
        data = source.read_bytes()
        runtime_files.append(
            {
                "path": path,
                "url": "files/runtime/{}".format(path),
                "bytes": len(data),
                "sha256": install_xrp_service.file_sha256(data),
                "source": str(source.relative_to(ROOT)).replace("\\", "/"),
            }
        )

    bootstrap_files = []
    for destination, source in install_xrp_service.bootstrap_files().items():
        data = source.read_bytes()
        bootstrap_files.append(
            {
                "destination": destination,
                "url": "files/bootstrap/{}".format(destination.lstrip("/")),
                "bytes": len(data),
                "sha256": install_xrp_service.file_sha256(data),
                "source": str(source.relative_to(ROOT)).replace("\\", "/"),
            }
        )

    controller = release["controller"]
    return {
        "schemaVersion": 2,
        "releaseId": release["release_id"],
        "releaseSequence": release["release_sequence"],
        "compatibility": install_xrp_service.compatibility_identity(release),
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
                "url": firmware_bundle_url(firmware),
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
            "address": "192.168.4.1",
        },
        "bootstrapFiles": bootstrap_files,
        "runtime": {
            "manifest": {
                "url": "files/runtime/runtime-manifest.json",
                "bytes": len(runtime_manifest_data),
                "sha256": install_xrp_service.file_sha256(runtime_manifest_data),
            },
            "files": runtime_files,
        },
    }


def write_bundle(output_directory):
    output = Path(output_directory)
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)
    manifest = commissioning_manifest()

    bootstrap_sources = install_xrp_service.bootstrap_files()
    for entry in manifest["bootstrapFiles"]:
        destination = output / entry["url"]
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(bootstrap_sources[entry["destination"]], destination)

    firmware = manifest["micropython"]["firmware"]
    firmware_destination = output / firmware["url"]
    firmware_destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(FIRMWARE_DIRECTORY / firmware["asset"], firmware_destination)

    runtime_sources = install_xrp_service.runtime_files()
    for entry in manifest["runtime"]["files"]:
        destination = output / entry["url"]
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(runtime_sources[entry["path"]], destination)

    runtime_manifest = install_xrp_service.runtime_manifest()
    runtime_manifest_path = output / manifest["runtime"]["manifest"]["url"]
    runtime_manifest_path.parent.mkdir(parents=True, exist_ok=True)
    runtime_manifest_path.write_bytes(
        install_xrp_service.canonical_json_bytes(runtime_manifest)
    )
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
    release_sequence = install_xrp_service.release_metadata()["release_sequence"]
    if args.output.exists():
        shutil.rmtree(args.output)
    manifest = write_bundle(args.output / "releases" / str(release_sequence))
    print(
        "Commissioning bundle {}: {} runtime and {} bootstrap files".format(
            manifest["releaseId"],
            len(manifest["runtime"]["files"]),
            len(manifest["bootstrapFiles"]),
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
