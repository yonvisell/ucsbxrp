"""Verify Challenge 1 reference bytecode on-device without hardware motion."""

import hashlib
import json
from math import pi
import os
import sys

from ucsb_xrp import RawSensors, RobotConfig, WheelSpeeds
import ucsb_xrp_reference
from ucsb_xrp_reference import SensorModel, WheelSpeedController


def file_sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as source:
        while True:
            block = source.read(1024)
            if not block:
                return digest.digest().hex()
            digest.update(block)


config = RobotConfig(
    wheel_diameter_mm=100.0 / pi,
    encoder_counts_per_revolution=100.0,
    left_encoder_sign=1,
    right_encoder_sign=-1,
    left_start_effort=0.10,
    right_start_effort=0.12,
    left_speed_effort_gain=0.002,
    right_speed_effort_gain=0.0015,
    wheel_speed_kp=0.001,
    max_effort=0.5,
)

sensor_model = SensorModel(config)
sensor_model.reset(RawSensors(1000, 100, 200, None, False))
measurements = sensor_model.update(RawSensors(1250, 110, 185, None, False))

wheel_controller = WheelSpeedController(config)
efforts = wheel_controller.update(
    WheelSpeeds(100.0, -80.0), WheelSpeeds(90.0, -60.0)
)

assert abs(measurements.left_position_mm - 10.0) < 0.0001
assert abs(measurements.right_speed_mm_s - 60.0) < 0.0001
assert abs(efforts.left - 0.31) < 0.0001
assert abs(efforts.right + 0.26) < 0.0001

files = (
    "/lib/ucsb_xrp_reference/__init__.mpy",
    "/lib/ucsb_xrp_reference/challenge_1.mpy",
)
course_files = tuple(
    "/lib/ucsb_xrp/" + name
    for name in sorted(os.listdir("/lib/ucsb_xrp"))
    if name.endswith(".py")
)
result = {
    "state": "pass",
    "mpy": getattr(sys.implementation, "_mpy", None),
    "package_file": getattr(ucsb_xrp_reference, "__file__", None),
    "reference_artifact_sha256": {
        path: file_sha256(path) for path in files
    },
    "course_source_sha256": {
        path: file_sha256(path) for path in course_files
    },
    "contract_values": {
        "left_position_mm": measurements.left_position_mm,
        "right_speed_mm_s": measurements.right_speed_mm_s,
        "left_effort": efforts.left,
        "right_effort": efforts.right,
    },
    "hardware_accessed": False,
    "motor_effort_commanded": False,
}

print("UCSB_XRP_REFERENCE_H1=" + json.dumps(result))
