# Publish the current waypoint count and estimated heading.

from ucsb_xrp import live


DEFAULT_CRUISE_SPEED_MM_S = 150.0
DEFAULT_TURN_RATE_RAD_S = 0.8
# Create sliders in Monitor; .value reads each slider setting.
CRUISE_SPEED = live.number(
    "navigation_cruise_speed_mm_s", DEFAULT_CRUISE_SPEED_MM_S,
    minimum=80.0, maximum=220.0, step=10.0, unit="mm/s", label="Cruise speed",
)
TURN_RATE = live.number(
    "navigation_turn_rate_rad_s", DEFAULT_TURN_RATE_RAD_S,
    minimum=0.4, maximum=1.6, step=0.1, unit="rad/s", label="Turn rate",
)


def publish_goal_count(reached_count):
    live.watch("goals_reached", reached_count)


def publish_heading(pose):
    live.plot("heading_rad", pose.heading_rad, unit="rad", label="Estimated heading")
