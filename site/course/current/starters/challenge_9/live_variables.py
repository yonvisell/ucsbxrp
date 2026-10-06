# Publish line tracking signals for the Monitor.

from ucsb_xrp import live


# Publish observed values for inspection without changing the motion decision.
# Register signal names and units once; the loop writes only each value.
_PLOT_REFLECTANCE_LEFT = live.register_plot('reflectance_left')
_PLOT_REFLECTANCE_RIGHT = live.register_plot('reflectance_right')
_PLOT_LINE_ERROR = live.register_plot('line_error')
_WATCH_CHECKPOINTS_REACHED = live.register_watch('checkpoints_reached')
_WATCH_PHASE = live.register_watch('phase')


def publish_line_values(readings, line_error, checkpoints_reached, line_lost):
    _PLOT_REFLECTANCE_LEFT.value = readings.left
    _PLOT_REFLECTANCE_RIGHT.value = readings.right
    _PLOT_LINE_ERROR.value = line_error
    _WATCH_CHECKPOINTS_REACHED.value = checkpoints_reached
    _WATCH_PHASE.value = "line_lost_stopping" if line_lost else "following"
