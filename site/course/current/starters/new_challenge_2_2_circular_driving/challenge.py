# Circle trial settings. Change one diameter or direction at a time.

from math import isfinite
from ucsb_xrp import load_world


CIRCLE_DIAMETER_MM = 400.0  # Diameter of the axle-midpoint path [mm]; test 200, 300, and 400.
FORWARD_SPEED_MM_S = 100.0  # Constant forward speed of the axle midpoint [mm/s]; use the same speed for all comparisons.
CLOCKWISE = False  # False turns left (counterclockwise); True turns right (clockwise).

if not isfinite(CIRCLE_DIAMETER_MM) or CIRCLE_DIAMETER_MM <= 0.0:
    raise ValueError("CIRCLE_DIAMETER_MM must be a finite diameter greater than zero")
if not isfinite(FORWARD_SPEED_MM_S) or FORWARD_SPEED_MM_S < 0.0:
    raise ValueError("FORWARD_SPEED_MM_S must be a finite forward speed of zero or greater")

TURN_RATE_RAD_S = (-1.0 if CLOCKWISE else 1.0) * 2.0 * FORWARD_SPEED_MM_S / CIRCLE_DIAMETER_MM  # Use signed speed/radius to request the circular motion [rad/s].
INITIAL_POSE = load_world().initial_pose  # Read the run's starting pose from world.json.
