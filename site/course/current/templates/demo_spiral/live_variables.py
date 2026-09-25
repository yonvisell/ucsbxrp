# Publish the distance travelled and requested yaw rate for one sample.

from ucsb_xrp import live


FORWARD_SPEED = live.number("forward_speed_mm_s", 110.0, minimum=60.0, maximum=160.0, step=10.0, unit="mm/s", label="Forward speed")
WINDING_RATE = live.number("spiral_winding_turns_per_m", 0.7, minimum=0.3, maximum=1.4, step=0.1, unit="revolutions/m", label="Spiral winding rate")


def publish_spiral_values(travel_mm, turn_rate_rad_s):
    live.plot("travel_mm", travel_mm, unit="mm", label="Travel")
    live.plot("turn_rate_rad_s", turn_rate_rad_s, unit="rad/s", label="Yaw rate")
