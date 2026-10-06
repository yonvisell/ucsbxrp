# Choose forward speed from the target distance minus mean measured wheel travel.
# Called by: main.py before its next motion command.
# Inputs: remaining_mm in mm; live cruise speed and slowing distance.
# State: none; use only the proportional term of PID for this challenge.
# Returns: forward speed in mm/s; the first zero command is final.

from live_variables import CRUISE_SPEED_MM_S, SLOWDOWN_DISTANCE_MM


# Distance-controller gains; these do not change the supplied motor-speed loop.
TARGET_LOCATION_KP = 1.0  # 1/s: multiply remaining distance (mm) to obtain speed (mm/s).
TARGET_LOCATION_KI = 0.0  # 1/s^2: integral gain; leave zero (no accumulated-error term).
TARGET_LOCATION_KD = 0.0  # Dimensionless: derivative gain; leave zero (no error-rate term).
STOP_DISTANCE_MM = 10.0  # Command zero at/below this remaining distance, including overshoot.


def speed_for_distance(remaining_mm):
    # Positive means distance remains; negative means measured travel passed the target.
    # Check STOP_DISTANCE_MM before choosing cruise speed or proportional approach speed.
    # Read CRUISE_SPEED_MM_S.value and SLOWDOWN_DISTANCE_MM.value on each call.
    # Within the approach region, use TARGET_LOCATION_KP; cap speed at cruise speed.
    # Return a finite, nonnegative speed in mm/s. See README Steps 2.1–2.3.
    raise NotImplementedError("Implement cruise, proportional approach, and distance stop")
