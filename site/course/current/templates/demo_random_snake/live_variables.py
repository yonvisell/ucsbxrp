# Publish the segment, phase, and estimated distance travelled.

from ucsb_xrp import live


# Each number lists initial value, minimum, maximum, and slider step in the stated unit.
# Forward speed applies to straight segments; turn rate limits either direction's magnitude.
FORWARD_SPEED_MM_S = live.number("snake_forward_speed_mm_s", 150.0, 60.0, 180.0, 10.0, unit="mm/s", label="Forward speed")
TURN_RATE_RAD_S = live.number("snake_turn_rate_rad_s", 1.4, 0.5, 1.8, 0.1, unit="rad/s", label="Turn rate")


# Register signal names and units once; the loop writes only each value.
_WATCH_SEGMENT = live.register_watch('segment')
_WATCH_PHASE = live.register_watch('phase')
_WATCH_TRAVEL_MM = live.register_watch('travel_mm', unit="mm")


def publish_segment(number):
    _WATCH_SEGMENT.value = number


def publish_phase(phase):
    _WATCH_PHASE.value = phase


def publish_travel(travel_mm):
    _WATCH_TRAVEL_MM.value = travel_mm
