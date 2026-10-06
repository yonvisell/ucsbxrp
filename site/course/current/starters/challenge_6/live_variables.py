# Publish the current range decision for the Monitor.

from ucsb_xrp import live


# Publish observed values for inspection without changing the motion decision.
# Register signal names and units once; the loop writes only each value.
_WATCH_RANGE_ESTIMATE_MM = live.register_watch('range_estimate_mm', unit="mm", label="Filtered range")
_WATCH_STUDENT_SPEED_MM_S = live.register_watch('student_speed_mm_s', unit="mm/s", label="Student controller output")
_PLOT_STUDENT_SPEED_MM_S = live.register_plot('student_speed_mm_s', unit="mm/s", label="Student controller output")


def publish_range_decision(estimate_mm, speed_mm_s):
    _WATCH_RANGE_ESTIMATE_MM.value = estimate_mm if estimate_mm is not None else "—"
    _WATCH_STUDENT_SPEED_MM_S.value = speed_mm_s
    _PLOT_STUDENT_SPEED_MM_S.value = speed_mm_s
