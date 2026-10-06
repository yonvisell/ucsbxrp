# Publish route progress as estimated wheel travel and phase.

from ucsb_xrp import live


# Register signal names and units once; the loop writes only each value.
_WATCH_TRAVEL_MM = live.register_watch('travel_mm', unit="mm")
_WATCH_PHASE = live.register_watch('phase')


def publish_travel(travel_mm):
    _WATCH_TRAVEL_MM.value = travel_mm


def publish_phase(phase):
    _WATCH_PHASE.value = phase
