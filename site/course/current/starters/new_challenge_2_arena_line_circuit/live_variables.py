# Publish the measurements and control state for one line-circuit sample.

from ucsb_xrp import live


DEFAULT_CRUISE_SPEED_MM_S = 100.0
DEFAULT_P_GAIN_RAD_S = 1.8
# Create sliders in Monitor; .value reads each slider setting.
CRUISE_SPEED = live.number("cruise_speed_mm_s", DEFAULT_CRUISE_SPEED_MM_S, 50.0, 180.0, 5.0, label="Cruise speed", unit="mm/s")
P_GAIN = live.number("line_gain", DEFAULT_P_GAIN_RAD_S, 0.0, 5.0, 0.1, label="P gain", unit="rad/s")


def publish_line_values(readings, command, line_error, checkpoints_reached, phase):
    live.plot("reflectance_left", readings.left)  # Normalized reflectance: 0 = light, 1 = dark.
    live.plot("reflectance_right", readings.right)
    live.plot("line_error", line_error)  # Left reading minus right reading.
    live.plot("turn_rate_rad_s", command.turn_rate_rad_s, unit="rad/s", label="Requested turn rate")
    live.watch("checkpoints_reached", checkpoints_reached)
    live.watch("phase", phase)
