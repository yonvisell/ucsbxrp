# Monitor controls for the distance-based stopping decision.

from ucsb_xrp import live


# Create sliders in Monitor; .value reads each applied setting.
# Each declaration lists the initial value, lower/upper bounds, and adjustment step.
CRUISE_SPEED_MM_S = live.number("cruise_speed_mm_s", 120.0, 0.0, 240.0, 5.0, unit="mm/s", label="Cruise speed")
SLOWDOWN_DISTANCE_MM = live.number("slowdown_distance_mm", 120.0, 0.0, 1000.0, 10.0, unit="mm", label="Slowing distance")


# Register signal names and units once; the loop writes only each value.
_PLOT_CURLING_TARGET_DISTANCE_MM = live.register_plot('curling_target_distance_mm', unit="mm", label="Trial target distance")
_PLOT_CURLING_INITIAL_POSITION_MM = live.register_plot('curling_initial_position_mm', unit="mm", label="Trial initial wheel position")
_PLOT_REMAINING_MM = live.register_plot('remaining_mm', unit="mm", label="Remaining distance")
_PLOT_REQUESTED_SPEED_MM_S = live.register_plot('requested_speed_mm_s', unit="mm/s", label="Requested speed")
_WATCH_MOTION_TIME_S = live.register_watch('motion_time_s', unit="s", label="Estimated motion time")
_PLOT_CURLING_TIME_LIMIT_S = live.register_plot('curling_time_limit_s', unit="s", label="Curling time limit")


def publish_curling_trial(target_distance_mm, initial_position_mm):
    # Save the fixed distance and wheel-position origin with this run's samples.
    # The distance CSV uses these values rather than settings edited after Run.
    _PLOT_CURLING_TARGET_DISTANCE_MM.value = target_distance_mm
    _PLOT_CURLING_INITIAL_POSITION_MM.value = initial_position_mm


def publish_curling_values(remaining_mm, requested_speed_mm_s, motion_time_s, timed_out=False):
    _PLOT_REMAINING_MM.value = remaining_mm
    _PLOT_REQUESTED_SPEED_MM_S.value = requested_speed_mm_s
    _WATCH_MOTION_TIME_S.value = motion_time_s
    if timed_out:
        # This final marker fixes the scored time at 120 s in Monitor and saved run summaries.
        _PLOT_CURLING_TIME_LIMIT_S.value = motion_time_s
