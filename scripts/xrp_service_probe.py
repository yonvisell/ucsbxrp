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


def request_json(base_url, path, method="GET", body=None, timeout=5.0):
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
    )
    if reply.get("requestId") != request_id:
        raise ProbeError("uncorrelated {} reply".format(name))
    if not reply.get("ok"):
        error = reply.get("error", {})
        raise ProbeError(error.get("detail", "{} failed".format(name)))
    return reply.get("result", {})


def wait_for_service(base_url, timeout_s=25.0):
    deadline = time.monotonic() + timeout_s
    last_error = None
    while time.monotonic() < deadline:
        try:
            info, _ = request_json(base_url, "/api/v1/info", timeout=2.0)
            if info.get("protocol") == 1:
                return info
        except ProbeError as exc:
            last_error = str(exc)
        time.sleep(0.35)
    raise ProbeError("service did not return: {}".format(last_error))


def is_new_boot(previous, current):
    previous_id = previous.get("bootId")
    current_id = current.get("bootId")
    return bool(previous_id and current_id and current_id != previous_id)


def wait_for_new_boot(base_url, previous, timeout_s=25.0):
    deadline = time.monotonic() + timeout_s
    last_error = None
    while time.monotonic() < deadline:
        try:
            info, _ = request_json(base_url, "/api/v1/info", timeout=2.0)
            if is_new_boot(previous, info):
                return info
            last_error = "service still reports boot {}".format(info.get("bootId"))
        except ProbeError as exc:
            last_error = str(exc)
        time.sleep(0.35)
    raise ProbeError("service did not complete a new boot: {}".format(last_error))


def zero_output_project(wait_forever=False):
    if wait_forever:
        main = """\
import time
from ucsb_xrp import RobotConfig, XRPBot

bot = XRPBot(RobotConfig())
try:
    while True:
        time.sleep_ms(100)
finally:
    bot.stop()
"""
    else:
        main = """\
from ucsb_xrp import MotorEfforts, RobotConfig, XRPBot

config = RobotConfig()
bot = XRPBot(config)
try:
    raw = bot.read(include_range=True)
    bot.set_efforts(MotorEfforts(0.0, 0.0))
    assert 0.0 <= config.max_effort <= 1.0
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
    def set_efforts(self, efforts):
        self._bot.set_efforts(efforts)
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


def run_probe(address):
    base_url = "http://{}".format(address)
    evidence = {"address": address, "operations": []}

    info = wait_for_service(base_url)
    if "project.current" not in info.get("capabilities", []):
        raise ProbeError("service does not advertise retained-project discovery")
    evidence["service"] = info

    preflight = Request(
        base_url + "/api/v1/sync",
        method="OPTIONS",
        headers={
            "Origin": "http://127.0.0.1:4174",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Private-Network": "true",
        },
    )
    with urlopen(preflight, timeout=5.0) as response:
        allowed = response.headers.get("Access-Control-Allow-Private-Network")
    if allowed != "true":
        raise ProbeError("private-network preflight header is missing")
    evidence["operations"].append("browser preflight")

    project = zero_output_project()
    check = command(base_url, "check", 1, project=project)
    sync = command(base_url, "sync", 2, project=project)
    expected_revision = project_revision(project)
    if sync.get("project", {}).get("revision") != expected_revision:
        raise ProbeError("synchronized project revision did not match its source")
    retained_info, _ = request_json(base_url, "/api/v1/info")
    if retained_info.get("project", {}).get("revision") != expected_revision:
        raise ProbeError("service discovery did not retain the synchronized project")
    evidence["operations"].extend([check["detail"], sync["detail"]])
    evidence["operations"].append("project revision retained")
    evidence["projectRevision"] = expected_revision

    run = command(base_url, "run", 3)
    deadline = time.monotonic() + 8.0
    final_state = None
    observed_logs = []
    while time.monotonic() < deadline:
        state, _ = request_json(base_url, "/api/v1/telemetry")
        final_state = state
        observed_logs = state.get("logs", [])
        if state.get("state") != "running":
            break
        command(base_url, "lease", 4, runId=run["runId"])
        time.sleep(0.25)
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

    command(base_url, "sync", 5, project=pose_telemetry_project())
    command(base_url, "run", 6)
    deadline = time.monotonic() + 8.0
    pose_state = None
    while time.monotonic() < deadline:
        pose_state, _ = request_json(base_url, "/api/v1/telemetry")
        if pose_state.get("state") != "running":
            break
        time.sleep(0.2)
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

    long_project = zero_output_project(wait_forever=True)
    long_sync = command(base_url, "sync", 7, project=long_project)
    long_revision = project_revision(long_project)
    if long_sync.get("project", {}).get("revision") != long_revision:
        raise ProbeError("long-running project revision did not match its source")
    command(base_url, "run", 8)
    time.sleep(0.4)
    before_stop, _ = request_json(base_url, "/api/v1/info")
    command(base_url, "stop", 9)
    after_stop = wait_for_new_boot(base_url, before_stop)
    if after_stop.get("project", {}).get("revision") != long_revision:
        raise ProbeError("stop restart did not retain the current project")
    evidence["serviceAfterStop"] = after_stop
    evidence["operations"].append("stop and restart")

    before_reset = after_stop
    command(base_url, "reset", 10)
    after_reset = wait_for_new_boot(base_url, before_reset)
    if after_reset.get("project", {}).get("revision") != long_revision:
        raise ProbeError("target reset did not retain the current project")
    evidence["serviceAfterReset"] = after_reset
    evidence["operations"].append("reset and reconnect")
    return evidence


def make_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--address", required=True)
    return parser


def main(argv=None):
    args = make_parser().parse_args(argv)
    try:
        evidence = run_probe(args.address)
    except ProbeError as exc:
        print("Service probe error: {}".format(exc), file=sys.stderr)
        return 2
    print(json.dumps(evidence, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
