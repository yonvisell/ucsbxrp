# Publish obstacle-turn range and current phase.

from ucsb_xrp import live


# Each number sets an initial value, lower/upper bounds, and step in the stated unit.
# Sensor range at or below the obstacle distance ends an approach.
# Forward speed applies during approach; turn rate limits the quarter-turn's magnitude.
CLOSE_RANGE_MM = live.number("close_range_mm", 400.0, minimum=200.0, maximum=900.0, step=25.0, unit="mm", label="Obstacle distance")
FORWARD_SPEED_MM_S = live.number("forward_speed_mm_s", 150.0, minimum=40.0, maximum=180.0, step=10.0, unit="mm/s", label="Forward speed")
TURN_RATE_RAD_S = live.number("turn_rate_rad_s", 1.3, minimum=0.4, maximum=1.8, step=0.1, unit="rad/s", label="Turn rate")
TURN_DIRECTION = live.choice("turn_direction", "left", options=("left", "right"), label="Turn direction")
SECOND_APPROACH = live.toggle("second_approach", True, label="Drive after turn")


# Register signal names and units once; the loop writes only each value.
_WATCH_RANGE_MM = live.register_watch('range_mm', unit="mm")
_WATCH_PHASE = live.register_watch('phase')
_WATCH_HEADING_ERROR_RAD = live.register_watch('heading_error_rad', unit="rad")


def publish_range(range_mm):
    _WATCH_RANGE_MM.value = range_mm if range_mm is not None else "No echo"


def publish_phase(phase):
    _WATCH_PHASE.value = phase


def publish_heading_error(error_rad):
    _WATCH_HEADING_ERROR_RAD.value = error_rad
