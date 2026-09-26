# Monitor controls for the distance-based stopping decision.

from ucsb_xrp import live


# Create sliders in Monitor; .value reads each slider setting.
CRUISE_SPEED_MM_S = live.number("cruise_speed_mm_s", 120.0, 0.0, 240.0, 5.0, unit="mm/s", label="Cruise speed")
SLOWDOWN_DISTANCE_MM = live.number("slowdown_distance_mm", 120.0, 0.0, 1000.0, 10.0, unit="mm", label="Slowing distance")


def publish_curling_values(remaining_mm, requested_speed_mm_s, motion_time_s):
    live.plot("remaining_mm", remaining_mm, unit="mm", label="Remaining distance")
    live.plot("requested_speed_mm_s", requested_speed_mm_s, unit="mm/s", label="Requested speed")
    live.watch("motion_time_s", motion_time_s, unit="s", label="Estimated motion time")
