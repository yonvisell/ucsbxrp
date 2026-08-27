#!/usr/bin/env python3
"""Exercise the physical target service with projects that command zero output."""

import argparse
import hashlib
import json
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class ProbeError(RuntimeError):
    pass


def project_revision(project):
    digest = hashlib.sha256()

    def update_part(value):
        body = value.encode("utf-8")
        digest.update(str(len(body)).encode("ascii"))
        digest.update(b":")
        digest.update(body)
        digest.update(b";")

    update_part(project["entrypoint"])
    for path in sorted(project["files"]):
        update_part(path)
        update_part(project["files"][path])
    return digest.hexdigest()


def request_json(base_url, path, method="GET", body=None, timeout=2.0):
    data = None
    headers = {}
    if body is not None:
        data = json.dumps(body, separators=(",", ":")).encode("utf-8")
        headers["Content-Type"] = "application/json"
    request = Request(base_url + path, data=data, headers=headers, method=method)
    try:
        with urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8")), response.headers
    except HTTPError as exc:
        try:
            value = json.loads(exc.read().decode("utf-8"))
            detail = value.get("error", {}).get("detail", str(exc))
        except Exception:
            detail = str(exc)
        raise ProbeError(detail) from exc
    except (OSError, URLError, ValueError) as exc:
        raise ProbeError("{} {}: {}".format(method, path, exc)) from exc


def command(base_url, name, counter, **values):
    request_id = "probe-{}-{}".format(int(time.time()), counter)
    reply, _ = request_json(
        base_url,
        "/api/v1/" + name,
        method="POST",
        body=dict(values, requestId=request_id),
        timeout=3.0,
    )
    if reply.get("requestId") != request_id:
        raise ProbeError("uncorrelated {} reply".format(name))
    if not reply.get("ok"):
        error = reply.get("error", {})
        raise ProbeError(error.get("detail", "{} failed".format(name)))
    return reply.get("result", {})


def wait_for_service(base_url, timeout_s=8.0):
    deadline = time.monotonic() + timeout_s
    last_error = None
    while time.monotonic() < deadline:
        try:
            info, _ = request_json(base_url, "/api/v1/info", timeout=0.6)
            if info.get("protocol") == 1:
                return info
        except ProbeError as exc:
            last_error = str(exc)
        time.sleep(0.1)
    raise ProbeError("service did not return: {}".format(last_error))


def is_new_boot(previous, current):
    previous_id = previous.get("bootId")
    current_id = current.get("bootId")
    return bool(previous_id and current_id and current_id != previous_id)


def wait_for_new_boot(base_url, previous, timeout_s=8.0):
    deadline = time.monotonic() + timeout_s
    last_error = None
    while time.monotonic() < deadline:
        try:
            info, _ = request_json(base_url, "/api/v1/info", timeout=0.6)
            if is_new_boot(previous, info):
                return info
            last_error = "service still reports boot {}".format(info.get("bootId"))
        except ProbeError as exc:
            last_error = str(exc)
        time.sleep(0.1)
    raise ProbeError("service did not complete a new boot: {}".format(last_error))


def wait_for_program(base_url, run_id, timeout_s=8.0, until_running=False):
    """Poll until a bounded probe program reaches the requested state.

    A short program may move from ``loading`` to ``ready`` before the first
    sample. Long-running probes renew their run lease as soon as ``running`` is
    observed.
    """
    deadline = time.monotonic() + timeout_s
    state = None
    attempt = 0
    while time.monotonic() < deadline:
        state, _ = request_json(base_url, "/api/v1/telemetry")
        run_state = state.get("state")
        if run_state == "running":
            command(base_url, "lease", 400 + attempt, runId=run_id)
            if until_running:
                return state
        elif run_state != "loading":
            return state
        attempt += 1
        time.sleep(0.05)
    raise ProbeError("program did not leave its startup/run state")


def zero_output_project(wait_forever=False):
    if wait_forever:
        main = """\
import time
from ucsb_xrp import RobotConfig, XRPBot

bot = XRPBot(RobotConfig())
try:
    while True:
        # read() is a normal course-library boundary and observes the browser's
        # cooperative Stop request. Motor effort remains zero throughout.
        bot.read()
        time.sleep_ms(50)
finally:
    bot.stop()
"""
    else:
        main = """\
from ucsb_xrp import DriveCommand, RobotConfig, XRPBot

config = RobotConfig()
bot = XRPBot(config)
try:
    raw = bot.read(include_range=True)
    bot.set_drive(DriveCommand(0.0, 0.0))
    assert 0.0 <= config.max_drive_command <= 1.0
    assert raw.time_ms >= 0
    print("Physical service probe output")
finally:
    bot.stop()
"""
    return {
        "name": "Physical service probe",
        "entrypoint": "main.py",
        "files": {"main.py": main, "probe-note.md": "Zero-output lifecycle probe.\n"},
    }


def pose_telemetry_project():
    main = """\
from ucsb_xrp import Pose, Robot, RobotConfig, STOP_COMMAND, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel,
    WheelSpeedController,
)

class ImmediateStartBot:
    def __init__(self, config):
        self._bot = XRPBot(config)
    def read(self, include_range=False):
        return self._bot.read(include_range)
    def reset_encoders(self):
        # Pose-channel validation only needs a coherent starting sample. Avoid
        # reinitializing XRPLib's RP2350 PIO encoders from the student core.
        pass
    def wait_for_button(self):
        pass
    def set_drive(self, command):
        self._bot.set_drive(command)
    def stop(self):
        self._bot.stop()

config = RobotConfig()
robot = Robot(
    config,
    ImmediateStartBot(config),
    SensorModel(config),
    WheelSpeedController(config),
    DifferentialDrive(config),
    Odometry(config),
)
try:
    robot.start(Pose(125.0, -50.0, 0.25))
    state = robot.step(STOP_COMMAND)
    print("Physical pose telemetry:", state.pose)
finally:
    robot.stop()
"""
    return {
        "name": "Physical pose telemetry probe",
        "entrypoint": "main.py",
        "files": {"main.py": main},
    }


def run_probe(address, include_reset=False):
    base_url = "http://{}".format(address)
    evidence = {"address": address, "operations": []}

    info = wait_for_service(base_url)
    if "project.current" not in info.get("capabilities", []):
        raise ProbeError("service does not advertise retained-project discovery")
    evidence["service"] = info

    preflight = Request(
        base_url + "/api/v1/prepare",
        method="OPTIONS",
        headers={
            "Origin": "http://127.0.0.1:4174",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Private-Network": "true",
        },
    )
    with urlopen(preflight, timeout=1.5) as response:
        allowed = response.headers.get("Access-Control-Allow-Private-Network")
    if allowed != "true":
        raise ProbeError("private-network preflight header is missing")
    evidence["operations"].append("browser preflight")

    project = zero_output_project()
    check = command(base_url, "check", 1, project=project)
    prepared = command(base_url, "prepare", 2, project=project)
    expected_revision = project_revision(project)
    if prepared.get("project", {}).get("revision") != expected_revision:
        raise ProbeError("prepared project revision did not match its source")
    if prepared.get("project", {}).get("lifetime") != "boot":
        raise ProbeError("prepared project did not report boot lifetime")
    retained_info, _ = request_json(base_url, "/api/v1/info")
    if retained_info.get("project", {}).get("revision") != expected_revision:
        raise ProbeError("service discovery did not retain the prepared project")
    evidence["operations"].extend([check["detail"], prepared["detail"]])
    evidence["operations"].append("RAM project revision retained")
    evidence["projectRevision"] = expected_revision

    run = command(base_url, "run", 3)
    final_state = wait_for_program(base_url, run["runId"])
    observed_logs = final_state.get("logs", [])
    if final_state is None or final_state.get("state") != "ready":
        raise ProbeError("zero-output project did not complete")
    if not any(
        entry.get("stream") == "stdout"
        and entry.get("line") == "Physical service probe output"
        for entry in observed_logs
    ):
        raise ProbeError("physical project stdout was not captured")
    evidence["operations"].append("run completed")
    evidence["operations"].append("stdout captured")
    evidence["telemetry"] = final_state["sample"]

    command(base_url, "prepare", 5, project=pose_telemetry_project())
    pose_run = command(base_url, "run", 6)
    pose_state = wait_for_program(base_url, pose_run["runId"])
    sample = None if pose_state is None else pose_state.get("sample")
    if (
        pose_state is None
        or pose_state.get("state") != "ready"
        or not sample
        or not sample.get("poseAvailable")
        or abs(sample.get("xMm", 0.0) - 125.0) > 0.001
        or abs(sample.get("yMm", 0.0) + 50.0) > 0.001
        or abs(sample.get("headingRad", 0.0) - 0.25) > 0.001
        or sample.get("leftEffort") != 0.0
        or sample.get("rightEffort") != 0.0
    ):
        raise ProbeError("course pose telemetry was not published correctly")
    evidence["operations"].append("course pose telemetry")
    evidence["poseTelemetry"] = sample

    # A normal Stop must preserve the current boot and return the worker to an
    # immediately reusable state. This is the ordinary student workflow.
    long_project = zero_output_project(wait_forever=True)
    long_prepared = command(base_url, "prepare", 7, project=long_project)
    long_revision = project_revision(long_project)
    if long_prepared.get("project", {}).get("revision") != long_revision:
        raise ProbeError("long-running project revision did not match its source")
    long_run = command(base_url, "run", 8)
    wait_for_program(base_url, long_run["runId"], until_running=True)
    before_stop, _ = request_json(base_url, "/api/v1/info")
    command(base_url, "stop", 9)
    stopped_state = wait_for_program(base_url, long_run["runId"])
    if stopped_state.get("state") != "ready":
        raise ProbeError("cooperative stop did not return to ready")
    after_stop, _ = request_json(base_url, "/api/v1/info")
    if after_stop.get("bootId") != before_stop.get("bootId"):
        raise ProbeError("ordinary Stop unexpectedly rebooted the XRP")
    if after_stop.get("project", {}).get("revision") != long_revision:
        raise ProbeError("Stop did not retain the current project")
    evidence["serviceAfterStop"] = after_stop
    evidence["operations"].append("cooperative stop without reboot")

    # Repeated immediate Prepare/Run cycles prove that normal project work does
    # not write internal flash or reboot the controller.
    repeated_boot_id = after_stop.get("bootId")
    for cycle in range(3):
        repeat_project = zero_output_project()
        repeat_project["files"]["cycle.txt"] = "cycle {}\n".format(cycle + 1)
        command(base_url, "prepare", 20 + cycle * 2, project=repeat_project)
        repeat_run = command(base_url, "run", 21 + cycle * 2)
        repeat_state = wait_for_program(base_url, repeat_run["runId"])
        if repeat_state.get("state") != "ready":
            raise ProbeError("repeat cycle {} did not complete".format(cycle + 1))
        repeat_info, _ = request_json(base_url, "/api/v1/info")
        if repeat_info.get("bootId") != repeated_boot_id:
            raise ProbeError("repeat cycle {} rebooted the XRP".format(cycle + 1))
    evidence["operations"].append("three immediate Prepare/Run cycles on one boot")

    if include_reset:
        before_reset, _ = request_json(base_url, "/api/v1/info")
        command(base_url, "reset", 10)
        after_reset = wait_for_new_boot(base_url, before_reset)
        if after_reset.get("project", {}).get("revision") == repeat_info.get(
            "project", {}
        ).get("revision"):
            raise ProbeError("target reset unexpectedly retained the RAM project")
        restored = zero_output_project()
        command(base_url, "prepare", 50, project=restored)
        restored_run = command(base_url, "run", 51)
        restored_state = wait_for_program(base_url, restored_run["runId"])
        if restored_state.get("state") != "ready":
            raise ProbeError("project did not prepare and run after reset")
        evidence["serviceAfterReset"] = after_reset
        evidence["operations"].append("reset cleared RAM project; prepare/run recovered")
    return evidence


def make_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--address", required=True)
    parser.add_argument(
        "--include-reset",
        action="store_true",
        help="also exercise the exceptional full-controller Reset path",
    )
    return parser


def main(argv=None):
    args = make_parser().parse_args(argv)
    try:
        evidence = run_probe(args.address, include_reset=args.include_reset)
    except ProbeError as exc:
        print("Service probe error: {}".format(exc), file=sys.stderr)
        return 2
    print(json.dumps(evidence, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
