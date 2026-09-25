# Publish the segment, phase, and estimated distance travelled.

from ucsb_xrp import live


# Motion code reads the current .value when it applies these Monitor controls.
FORWARD_SPEED_MM_S = live.number("snake_forward_speed_mm_s", 150.0, 60.0, 180.0, 10.0, unit="mm/s", label="Forward speed")
TURN_RATE_RAD_S = live.number("snake_turn_rate_rad_s", 1.4, 0.5, 1.8, 0.1, unit="rad/s", label="Turn rate")


# Publish observed values for inspection without changing the motion decision.
def publish_segment(number):
    live.watch("segment", number)


def publish_phase(phase):
    live.watch("phase", phase)


def publish_travel(travel_mm):
    live.watch("travel_mm", travel_mm, unit="mm")
