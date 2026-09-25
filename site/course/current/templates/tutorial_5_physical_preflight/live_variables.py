# Explicit motion permission for the short physical preflight.

from ucsb_xrp import live


# Stationary checks always run; this control alone permits the motion segment.
ENABLE_SHORT_MOTION = live.toggle("tutorial_enable_short_motion", False, label="Enable short motion")
