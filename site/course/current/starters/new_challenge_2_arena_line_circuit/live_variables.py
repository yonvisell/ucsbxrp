# Supplied controls and telemetry. No student adjustment needed.
# The saved values in line_follower.py initialize each Run; Monitor edits are temporary.
from ucsb_xrp import live
from line_follower import CRUISE_SPEED_MM_S, P_GAIN_RAD_S

CRUISE_SPEED = live.number("cruise_speed_mm_s", CRUISE_SPEED_MM_S, 0.0, None, 1.0, label="Cruise speed", unit="mm/s")
P_GAIN = live.number("line_gain", P_GAIN_RAD_S, 0.0, None, 0.01, label="P gain", unit="rad/s")

# Cached handles register names and units once; each control step writes values only.
_PLOT_REFLECTANCE_LEFT = live.register_plot('reflectance_left')
_PLOT_REFLECTANCE_RIGHT = live.register_plot('reflectance_right')
_PLOT_LINE_ERROR = live.register_plot('line_error')
_PLOT_TURN_RATE_RAD_S = live.register_plot('turn_rate_rad_s', unit="rad/s", label="Requested turn rate")
_PLOT_WAYPOINTS_REACHED = live.register_plot("waypoints_reached", label="Waypoints")
_WATCH_PHASE = live.register_watch('phase')


_PLOT_P_TERM = live.register_plot("line_p_rad_s", unit="rad/s", label="Line P contribution")
_PLOT_I_TERM = live.register_plot("line_i_rad_s", unit="rad/s", label="Line I contribution")
_PLOT_D_TERM = live.register_plot("line_d_rad_s", unit="rad/s", label="Line D contribution")


def publish_line_values(readings, command, follower, waypoints_reached, phase):
    _PLOT_REFLECTANCE_LEFT.value = readings.left  # Normalized reflectance: 0 = light, 1 = dark.
    _PLOT_REFLECTANCE_RIGHT.value = readings.right
    _PLOT_LINE_ERROR.value = follower.line_error  # Left reading minus right reading.
    _PLOT_TURN_RATE_RAD_S.value = command.turn_rate_rad_s
    _PLOT_WAYPOINTS_REACHED.value = waypoints_reached
    _PLOT_P_TERM.value = follower.p_term_rad_s if phase == "following" else 0.0
    _PLOT_I_TERM.value = follower.i_term_rad_s if phase == "following" else 0.0
    _PLOT_D_TERM.value = follower.d_term_rad_s if phase == "following" else 0.0
    _WATCH_PHASE.value = phase
