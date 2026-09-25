# Publish line tracking signals for the Monitor.

from ucsb_xrp import live


def publish_line_values(readings, line_error, checkpoints_reached, line_lost):
    live.plot("reflectance_left", readings.left)
    live.plot("reflectance_right", readings.right)
    live.plot("line_error", line_error)
    live.watch("checkpoints_reached", checkpoints_reached)
    live.watch("phase", "line_lost_stopping" if line_lost else "following")
