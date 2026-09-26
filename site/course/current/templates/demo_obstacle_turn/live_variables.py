# Publish obstacle-turn range and current phase.

from ucsb_xrp import live


CLOSE_RANGE_MM = live.number("close_range_mm", 400.0, minimum=200.0, maximum=900.0, step=25.0, unit="mm", label="Obstacle distance")
FORWARD_SPEED_MM_S = live.number("forward_speed_mm_s", 150.0, minimum=40.0, maximum=180.0, step=10.0, unit="mm/s", label="Forward speed")
TURN_RATE_RAD_S = live.number("turn_rate_rad_s", 1.3, minimum=0.4, maximum=1.8, step=0.1, unit="rad/s", label="Turn rate")
TURN_DIRECTION = live.choice("turn_direction", "left", options=("left", "right"), label="Turn direction")
SECOND_APPROACH = live.toggle("second_approach", True, label="Drive after turn")


def publish_range(range_mm):
    live.watch("range_mm", range_mm if range_mm is not None else "No echo", unit="mm")


def publish_phase(phase):
    live.watch("phase", phase)


def publish_heading_error(error_rad):
    live.watch("heading_error_rad", error_rad, unit="rad")
