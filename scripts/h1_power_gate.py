#!/usr/bin/env python3
"""Record the RP2350 XRP's switch-off motor-rail isolation gate.

This host wrapper requires fresh physical confirmations, runs only the existing
zero-effort H1 probe, and writes a new evidence file without overwriting prior
records. It cannot issue nonzero motor effort.
"""

import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import subprocess
import sys


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEVICE_PROBE = REPOSITORY_ROOT / "scripts" / "device_h1_probe.py"
PROBE_PREFIX = "UCSB_XRP_H1="
MAXIMUM_ALLOWED_GATE_V = 1.0


class PowerGateError(RuntimeError):
    """The isolation gate could not be measured or did not pass."""


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def validate_limit(value):
    value = float(value)
    if not 0.0 < value <= MAXIMUM_ALLOWED_GATE_V:
        raise argparse.ArgumentTypeError(
            "the reviewed near-zero limit must be greater than 0 and no more "
            "than {:.1f} V".format(MAXIMUM_ALLOWED_GATE_V)
        )
    return value


def parse_probe_output(stdout):
    for line in stdout.splitlines():
        if line.startswith(PROBE_PREFIX):
            return json.loads(line[len(PROBE_PREFIX) :])
    raise PowerGateError("The device did not return a structured H1 probe result")


def classify_gate(probe, maximum_vin_v):
    board = probe.get("board", {})
    if board.get("state") != "pass" or not isinstance(board.get("value"), dict):
        return "fail", "The board voltage measurement did not complete."
    value = board["value"]
    vin = value.get("vin_nominal_corrected_v")
    supply_detected = value.get("motor_supply_detected")
    if not isinstance(vin, (int, float)) or isinstance(vin, bool):
        return "fail", "The board did not return a numerical VIN measurement."
    if supply_detected is not False:
        return "fail", "XRPLib still reports that the motor supply is available."
    if vin > maximum_vin_v:
        return (
            "fail",
            "Corrected VIN {:.6g} V exceeds the reviewed {:.6g} V limit.".format(
                vin, maximum_vin_v
            ),
        )
    zero_checks = (
        probe.get("encoders_and_zero_effort", {}),
        probe.get("final_zero_effort", {}),
    )
    if any(check.get("state") != "pass" for check in zero_checks):
        return "fail", "The required zero-effort checks did not both pass."
    return (
        "pass",
        "Switch-off, indicator, VIN, and zero-effort evidence agree.",
    )


def run_gate(args):
    if args.output.exists():
        raise PowerGateError(
            "Evidence files are append-only; choose a new output path: {}".format(
                args.output
            )
        )
    command = [
        str(args.mpremote),
        "connect",
        args.port,
        "run",
        str(DEVICE_PROBE),
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise PowerGateError(
            "The zero-only device probe failed: {}".format(
                result.stderr.strip() or "no diagnostic output"
            )
        )
    probe = parse_probe_output(result.stdout)
    state, detail = classify_gate(probe, args.maximum_vin_v)
    record = {
        "schema_version": 1,
        "observed_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "evidence_type": "rp2350-switch-off-motor-rail-gate",
        "safety_tier": "H1-non-motion",
        "result": state,
        "detail": detail,
        "physical_confirmations": {
            "battery_disconnected": args.confirm_battery_disconnected,
            "board_switch_off": args.confirm_switch_off,
            "mot_led_off": args.confirm_mot_led_off,
            "mot_led_circuit_intact": args.confirm_mot_led_circuit_intact,
            "source": "fresh human confirmation at command invocation",
        },
        "acceptance_limit": {
            "corrected_vin_maximum_v": args.maximum_vin_v,
            "tool_hard_ceiling_v": MAXIMUM_ALLOWED_GATE_V,
            "xrplib_motor_supply_detected_required": False,
        },
        "controller": {
            "serial_path_at_observation": args.port,
            "raw_serial_committed": False,
        },
        "harness": {
            "mpremote": str(args.mpremote),
            "device_probe_sha256": sha256(DEVICE_PROBE),
            "host_wrapper_sha256": sha256(Path(__file__)),
            "nonzero_effort_capability": False,
        },
        "probe": probe,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(record, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    return state, detail


def make_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", required=True, help="exact XRP serial device path")
    parser.add_argument(
        "--mpremote",
        type=Path,
        default=REPOSITORY_ROOT / ".venv" / "bin" / "mpremote",
    )
    parser.add_argument(
        "--maximum-vin-v",
        required=True,
        type=validate_limit,
        help="reviewed near-zero corrected-VIN threshold, at most 1.0 V",
    )
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--confirm-battery-disconnected", action="store_true", required=True
    )
    parser.add_argument("--confirm-switch-off", action="store_true", required=True)
    parser.add_argument("--confirm-mot-led-off", action="store_true", required=True)
    parser.add_argument(
        "--confirm-mot-led-circuit-intact", action="store_true", required=True
    )
    return parser


def main(argv=None):
    args = make_parser().parse_args(argv)
    try:
        state, detail = run_gate(args)
    except (OSError, ValueError, PowerGateError) as exc:
        print("H1 power-gate error: {}".format(exc), file=sys.stderr)
        return 2
    print("H1 power gate {}: {}".format(state, detail))
    print("Evidence: {}".format(args.output))
    return 0 if state == "pass" else 2


if __name__ == "__main__":
    sys.exit(main())
