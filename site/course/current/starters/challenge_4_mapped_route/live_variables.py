# Publish the route follower's current progress.

from ucsb_xrp import live
from settings import CRUISE_SPEED_MM_S, STEERING_RATE_RAD_S


DEFAULT_CRUISE_SPEED_MM_S = CRUISE_SPEED_MM_S  # Initial forward-speed control value, mm/s.
DEFAULT_STEERING_RATE_RAD_S = STEERING_RATE_RAD_S  # Initial magnitude limit for turning, rad/s.
# Create numeric controls in Monitor; .value reads each applied setting.
# Navigation uses positive values; maximum=None removes the preset upper limit.
CRUISE_SPEED = live.number(
    "navigation_cruise_speed_mm_s", DEFAULT_CRUISE_SPEED_MM_S,
    minimum=0.0, maximum=None, step=10.0, unit="mm/s", label="Cruise speed",
)
STEERING_RATE = live.number(
    "navigation_steering_rate_rad_s", DEFAULT_STEERING_RATE_RAD_S,
    minimum=0.0, maximum=None, step=0.1, unit="rad/s", label="Steering rate",
)


# Register signal names and units once; the loop writes only each value.
_WATCH_NAVIGATION_STEPS = live.register_watch('navigation_steps')


def publish_navigation_steps(step_count):
    _WATCH_NAVIGATION_STEPS.value = step_count
