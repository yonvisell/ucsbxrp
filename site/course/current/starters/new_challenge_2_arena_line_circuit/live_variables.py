# Publish the measurements and control state for one line-circuit sample.

from ucsb_xrp import live


DEFAULT_CRUISE_SPEED_MM_S = 100.0  # Initial forward-speed slider value, mm/s.
DEFAULT_P_GAIN_RAD_S = 1.8  # Initial rad/s correction per unit left-minus-right reflectance.
# Create sliders in Monitor; .value reads each applied setting.
# Each declaration lists the initial value, lower/upper bounds, and adjustment step.
CRUISE_SPEED = live.number("cruise_speed_mm_s", DEFAULT_CRUISE_SPEED_MM_S, 50.0, 180.0, 5.0, label="Cruise speed", unit="mm/s")
P_GAIN = live.number("line_gain", DEFAULT_P_GAIN_RAD_S, 0.0, 5.0, 0.1, label="P gain", unit="rad/s")


# Register signal names and units once; the loop writes only each value.
_PLOT_REFLECTANCE_LEFT = live.register_plot('reflectance_left')
_PLOT_REFLECTANCE_RIGHT = live.register_plot('reflectance_right')
_PLOT_LINE_ERROR = live.register_plot('line_error')
_PLOT_TURN_RATE_RAD_S = live.register_plot('turn_rate_rad_s', unit="rad/s", label="Requested turn rate")
_WATCH_CHECKPOINTS_REACHED = live.register_watch('checkpoints_reached')
_WATCH_PHASE = live.register_watch('phase')


def publish_line_values(readings, command, line_error, checkpoints_reached, phase):
    _PLOT_REFLECTANCE_LEFT.value = readings.left  # Normalized reflectance: 0 = light, 1 = dark.
    _PLOT_REFLECTANCE_RIGHT.value = readings.right
    _PLOT_LINE_ERROR.value = line_error  # Left reading minus right reading.
    _PLOT_TURN_RATE_RAD_S.value = command.turn_rate_rad_s
    _WATCH_CHECKPOINTS_REACHED.value = checkpoints_reached
    _WATCH_PHASE.value = phase
