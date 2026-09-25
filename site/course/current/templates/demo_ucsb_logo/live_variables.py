# Publish route progress as estimated wheel travel and phase.

from ucsb_xrp import live


def publish_travel(travel_mm):
    live.watch("travel_mm", travel_mm, unit="mm")


def publish_phase(phase):
    live.watch("phase", phase)
