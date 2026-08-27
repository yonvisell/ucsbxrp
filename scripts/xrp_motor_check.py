#!/usr/bin/env python3
"""Run one short raised-wheel motor and encoder check through the LAN service."""

import argparse
import hashlib
import json
from pathlib import Path
import sys
import time

from xrp_service_probe import ProbeError, command, request_json, wait_for_service


RESULT_PREFIX = "UCSB_XRP_MOTOR_CHECK="


def motor_project():
    main = """\
import json
import time
from XRPLib.board import Board
from XRPLib.encoded_motor import EncodedMotor

left = EncodedMotor.get_default_encoded_motor(index=1)
right = EncodedMotor.get_default_encoded_motor(index=2)

def zero():
    left.set_effort(0.0)
    right.set_effort(0.0)

def counts():
    return [int(left.get_position_counts()), int(right.get_position_counts())]

result = {
    "effort": 0.22,
    "single_wheel_duration_ms": 350,
    "paired_duration_ms": 400,
    "settle_duration_ms": 250,
}
try:
    zero()
    time.sleep_ms(150)
    result["initial_counts"] = counts()

    left.set_effort(result["effort"])
    time.sleep_ms(result["single_wheel_duration_ms"])
    zero()
    time.sleep_ms(result["settle_duration_ms"])
    result["after_left_counts"] = counts()

    right.set_effort(result["effort"])
    time.sleep_ms(result["single_wheel_duration_ms"])
    zero()
    time.sleep_ms(result["settle_duration_ms"])
    result["after_right_counts"] = counts()

    left.set_effort(result["effort"])
    right.set_effort(result["effort"])
    time.sleep_ms(result["paired_duration_ms"])
    zero()
    time.sleep_ms(result["settle_duration_ms"])
    result["final_counts"] = counts()
    result["battery_v"] = float(Board.get_default_board().get_battery_voltage())
finally:
    zero()

print("UCSB_XRP_MOTOR_CHECK=" + json.dumps(result))
"""
    return {
        "name": "Raised-wheel motor check",
        "entrypoint": "main.py",
        "files": {"main.py": main},
    }


def differences(later, earlier):
    return [later[index] - earlier[index] for index in range(2)]


def run_check(address):
    base_url = "http://{}".format(address)
    info = wait_for_service(base_url)
    command(base_url, "prepare", 1, project=motor_project())
    run = command(base_url, "run", 2)
    deadline = time.monotonic() + 12.0
    after_log_seq = 0
    result = None
    state = None
    counter = 3
    while time.monotonic() < deadline:
        state, _ = request_json(
            base_url,
            "/api/v1/telemetry?afterLogSeq={}".format(after_log_seq),
        )
        for entry in state.get("logs", []):
            after_log_seq = max(after_log_seq, entry["seq"])
            if entry.get("line", "").startswith(RESULT_PREFIX):
                result = json.loads(entry["line"][len(RESULT_PREFIX) :])
        # The service deliberately pages retained logs in small batches so
        # telemetry stays responsive. Drain those pages before interpreting a
        # ready state; otherwise an older boot history can hide this run's
        # result even though the motor program completed correctly.
        if state.get("moreLogs") is True:
            continue
        run_state = state.get("state")
        if run_state == "loading":
            # The worker accepted Run but has not entered student code yet.
            # This is a normal transient state, not a completed program.
            time.sleep(0.05)
            continue
        if run_state != "running":
            break
        command(base_url, "lease", counter, runId=run["runId"])
        counter += 1
        time.sleep(0.2)
    if state is None or state.get("state") != "ready":
        raise ProbeError("motor check did not complete: {}".format(state))
    if result is None:
        raise ProbeError("motor check result was not present in the program log")

    left_delta = differences(result["after_left_counts"], result["initial_counts"])
    right_delta = differences(
        result["after_right_counts"], result["after_left_counts"]
    )
    paired_delta = differences(result["final_counts"], result["after_right_counts"])
    checks = {
        "left_motor_and_encoder_responded": left_delta[0] != 0,
        "right_motor_and_encoder_responded": right_delta[1] != 0,
        "both_encoders_responded_together": paired_delta[0] != 0
        and paired_delta[1] != 0,
        "positive_effort_has_positive_encoder_sign": left_delta[0] > 0
        and right_delta[1] > 0,
    }
    if not all(checks.values()):
        raise ProbeError("motor or encoder response was unexpected: {}".format(checks))
    harness_path = Path(__file__).resolve()
    return {
        "result": "pass",
        "scope": "raised wheels; bounded motor and encoder response",
        "service": info,
        "harness": {
            "path": str(harness_path),
            "sha256": hashlib.sha256(harness_path.read_bytes()).hexdigest(),
        },
        "device": result,
        "deltas": {
            "left_pulse": left_delta,
            "right_pulse": right_delta,
            "paired_pulse": paired_delta,
        },
        "checks": checks,
        "finalTelemetry": state.get("sample"),
    }


def make_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--address", default="192.168.7.30")
    return parser


def main(argv=None):
    args = make_parser().parse_args(argv)
    try:
        evidence = run_check(args.address)
    except ProbeError as exc:
        print("Motor check error: {}".format(exc), file=sys.stderr)
        return 2
    print(json.dumps(evidence, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
