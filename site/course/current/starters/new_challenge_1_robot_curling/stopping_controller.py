# Choose forward speed from the target distance minus mean measured wheel travel.
# Called by: main.py before its next motion request.
# Inputs: remaining_mm in mm; live cruise speed and slowing distance.
# State: none; live values are read on each call.
# Returns: forward speed in mm/s; zero requests a stop.

from live_variables import CRUISE_SPEED_MM_S, SLOWDOWN_DISTANCE_MM


# Distance-feedback constants, declared here so the stopping controller owns them.
# All start at zero; a constant affects the requested speed only if your controller uses it.
TARGET_LOCATION_KP = 0.0  # 1/s: multiply remaining distance (mm).
TARGET_LOCATION_KI = 0.0  # 1/s^2: multiply accumulated distance error (mm*s).
TARGET_LOCATION_KD = 0.0  # Dimensionless: multiply distance-error rate (mm/s).


def speed_for_distance(remaining_mm):
    # remaining_mm = target distance - mean left/right travel since start (mm).
    # Positive means travel remains; negative means the wheels passed the target distance.
    # Read CRUISE_SPEED_MM_S.value and SLOWDOWN_DISTANCE_MM.value on each call.
    # Return a finite, nonnegative speed in mm/s. The first zero request is final.
    # Leave TARGET_LOCATION_KI and TARGET_LOCATION_KD at zero for this challenge.
    raise NotImplementedError("Choose speed from measured remaining distance")
