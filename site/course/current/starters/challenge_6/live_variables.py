# Publish the current range decision for the Monitor.

from ucsb_xrp import live


# Publish observed values for inspection without changing the motion decision.
def publish_range_decision(estimate_mm, speed_mm_s):
    live.watch(
        "range_estimate_mm",
        estimate_mm if estimate_mm is not None else "—",
        unit="mm",
        label="Filtered range",
    )
    live.watch("student_speed_mm_s", speed_mm_s, unit="mm/s", label="Student controller output")
    live.plot("student_speed_mm_s", speed_mm_s, unit="mm/s", label="Student controller output")
