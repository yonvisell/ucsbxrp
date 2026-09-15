"""Editable distance control, separate from wheel-speed feedback."""
from math import isfinite
from ucsb_xrp import MotionCommand

CRUISE_SPEED_MM_S = 120.0
APPROACH_GAIN_PER_S = 1.0
MINIMUM_MOVING_SPEED_MM_S = 25.0
STOP_TOLERANCE_MM = 10.0

def distance_command(remaining_mm):
    """Approach more slowly as distance decreases; never reverse after overshoot."""
    if not isfinite(remaining_mm):
        raise ValueError("remaining_mm must be finite")
    if remaining_mm <= STOP_TOLERANCE_MM:
        return MotionCommand(0.0, 0.0)
    speed_mm_s = APPROACH_GAIN_PER_S * remaining_mm
    speed_mm_s = max(MINIMUM_MOVING_SPEED_MM_S, min(CRUISE_SPEED_MM_S, speed_mm_s))
    return MotionCommand(speed_mm_s, 0.0)
