"""Validate the canonical course package on an XRP without motor motion.

The default RobotConfig is motion-locked. This script requests only explicit
zero effort and repeats zero in finally cleanup.
"""

import gc
import json

import ucsb_xrp
from ucsb_xrp import MotorEfforts, Pose, RobotConfig, WheelSpeeds, XRPBot


result = {}
config = RobotConfig()
bot = XRPBot(config)

try:
    bot.set_efforts(MotorEfforts(0.0, 0.0))
    sensors = bot.read(include_range=True)
    result = {
        "state": "pass",
        "ucsb_xrp_version": ucsb_xrp.__version__,
        "motion_locked": config.is_motion_locked,
        "max_effort": config.max_effort,
        "record_repr": repr(WheelSpeeds(12.5, -3.0)),
        "heading_normalized_rad": Pose(0, 0, 3.141592653589793).heading_rad,
        "raw_sensors": {
            "time_ms": sensors.time_ms,
            "left_encoder_count": sensors.left_encoder_count,
            "right_encoder_count": sensors.right_encoder_count,
            "range_mm": sensors.range_mm,
            "button_pressed": sensors.button_pressed,
        },
        "zero_effort_commanded": True,
        "free_heap_bytes": gc.mem_free(),
    }
finally:
    bot.stop()

print("UCSB_XRP_PACKAGE_H1=" + json.dumps(result))
