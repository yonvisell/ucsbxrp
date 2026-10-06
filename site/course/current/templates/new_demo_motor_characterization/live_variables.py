# Publish motor command and measured wheel-speed samples.

from ucsb_xrp import elapsed_time_s, live


def publish_motor_values(command, measurements, start_ms, sample_period_ms):
    # Raw acquisition publishes before speed calculation; this timestamp identifies
    # the measurement used for command, speeds, and intervals on the next raw row.
    live.plot("measurement_time_s", elapsed_time_s(measurements.time_ms, start_ms), unit="s", label="Measurement time")
    live.plot("measured_interval_ms", measurements.dt_s * 1000.0, unit="ms", label="Measured sample interval")
    live.plot("configured_period_ms", sample_period_ms, unit="ms", label="Configured sample period")
    live.plot("effort", command, label="Motor effort")
    live.plot("left_speed_mm_s", measurements.wheel_speeds.left_mm_s, unit="mm/s", label="Left speed")
    live.plot("right_speed_mm_s", measurements.wheel_speeds.right_mm_s, unit="mm/s", label="Right speed")
