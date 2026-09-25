# Publish motor command and measured wheel-speed samples.

from ucsb_xrp import live


# Publish observed values for inspection without changing the motion decision.
def publish_motor_values(command, measurements):
    live.plot("effort", command, label="Motor effort")
    live.plot("left_speed_mm_s", measurements.wheel_speeds.left_mm_s, unit="mm/s", label="Left speed")
    live.plot("right_speed_mm_s", measurements.wheel_speeds.right_mm_s, unit="mm/s", label="Right speed")
