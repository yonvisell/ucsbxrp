# Purpose: choose forward speed from measured remaining distance.
# Called by: the supplied straight trial after each robot sample.
# Inputs: remaining_mm in mm; live cruise speed and slowing distance.
# State: none; live values are read on each call.
# Returns: forward speed in mm/s; zero requests a stop.

from live_variables import CRUISE_SPEED_MM_S, SLOWDOWN_DISTANCE_MM


def speed_for_distance(remaining_mm):
    # remaining_mm is measured wheel travel left to the target, in mm.
    # Read both live .value controls. Return a forward request in mm/s;
    # zero ends the trial.
    raise NotImplementedError("Choose speed from measured remaining distance")
