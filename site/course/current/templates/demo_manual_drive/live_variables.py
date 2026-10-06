# Monitor controls for manual driving; each Run starts from zero effort.

from ucsb_xrp import live


# Each number lists initial value, minimum, maximum, and slider step in the stated unit.
# Negative forward speed reverses; positive turn rate rotates counterclockwise.
FORWARD_SPEED = live.number("manual_forward_mm_s", 0.0, -120.0, 120.0, 10.0, unit="mm/s", label="Forward speed")
TURN_RATE = live.number("manual_turn_rad_s", 0.0, -1.0, 1.0, 0.1, unit="rad/s", label="Turn rate")
