# Publish motor command and measured wheel-speed samples.

from ucsb_xrp import elapsed_time_s, live


# Register signal names and units once; the loop writes only each value.
_PLOT_MEASUREMENT_TIME_S = live.register_plot('measurement_time_s', unit="s", label="Measurement time")
_PLOT_MEASURED_INTERVAL_MS = live.register_plot('measured_interval_ms', unit="ms", label="Measured sample interval")
_PLOT_CONFIGURED_PERIOD_MS = live.register_plot('configured_period_ms', unit="ms", label="Configured sample period")
_PLOT_EFFORT = live.register_plot('effort', label="Motor effort")
_PLOT_LEFT_SPEED_MM_S = live.register_plot('left_speed_mm_s', unit="mm/s", label="Left speed")
_PLOT_RIGHT_SPEED_MM_S = live.register_plot('right_speed_mm_s', unit="mm/s", label="Right speed")


def publish_motor_values(command, measurements, start_ms, sample_period_ms):
    # Raw acquisition publishes before speed calculation; this timestamp identifies
    # the measurement used for command, speeds, and intervals on the next raw row.
    _PLOT_MEASUREMENT_TIME_S.value = elapsed_time_s(measurements.time_ms, start_ms)
    _PLOT_MEASURED_INTERVAL_MS.value = measurements.dt_s * 1000.0
    _PLOT_CONFIGURED_PERIOD_MS.value = sample_period_ms
    _PLOT_EFFORT.value = command
    _PLOT_LEFT_SPEED_MM_S.value = measurements.wheel_speeds.left_mm_s
    _PLOT_RIGHT_SPEED_MM_S.value = measurements.wheel_speeds.right_mm_s
