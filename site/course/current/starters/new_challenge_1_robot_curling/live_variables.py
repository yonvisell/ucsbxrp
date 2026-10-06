# Monitor controls for the distance-based stopping decision.

from ucsb_xrp import live


# Create sliders in Monitor; .value reads each applied setting.
# Each declaration lists the initial value, lower/upper bounds, and adjustment step.
CRUISE_SPEED_MM_S = live.number("cruise_speed_mm_s", 120.0, 0.0, 240.0, 5.0, unit="mm/s", label="Cruise speed")
SLOWDOWN_DISTANCE_MM = live.number("slowdown_distance_mm", 120.0, 0.0, 1000.0, 10.0, unit="mm", label="Slowing distance")


def publish_curling_trial(target_distance_mm, initial_position_mm):
    # Save the fixed distance and wheel-position origin with this run's samples.
    # The distance CSV uses these values rather than settings edited after Run.
    live.plot("curling_target_distance_mm", target_distance_mm, unit="mm", label="Trial target distance")
    live.plot("curling_initial_position_mm", initial_position_mm, unit="mm", label="Trial initial wheel position")


def publish_curling_values(remaining_mm, requested_speed_mm_s, motion_time_s, timed_out=False):
    live.plot("remaining_mm", remaining_mm, unit="mm", label="Remaining distance")
    live.plot("requested_speed_mm_s", requested_speed_mm_s, unit="mm/s", label="Requested speed")
    live.watch("motion_time_s", motion_time_s, unit="s", label="Estimated motion time")
    if timed_out:
        # This final marker fixes the scored time at 120 s in Monitor and saved run summaries.
        live.plot("curling_time_limit_s", motion_time_s, unit="s", label="Curling time limit")
