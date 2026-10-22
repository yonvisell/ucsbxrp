# Circle trial settings. Change one diameter or direction at a time.

from math import isfinite
from ucsb_xrp import load_world


CIRCLE_DIAMETER_MM = 400.0  # Diameter of the axle-midpoint path [mm]; test 200, 300, and 400.
FORWARD_SPEED_MM_S = 100.0  # Forward speed [mm/s]; keep fixed across trials.
CLOCKWISE = False  # False turns left (counterclockwise); True turns right (clockwise).

if not isfinite(CIRCLE_DIAMETER_MM) or CIRCLE_DIAMETER_MM <= 0.0:
    raise ValueError("CIRCLE_DIAMETER_MM must be a finite diameter greater than zero")
if not isfinite(FORWARD_SPEED_MM_S) or FORWARD_SPEED_MM_S < 0.0:
    raise ValueError("FORWARD_SPEED_MM_S must be a finite forward speed of zero or greater")

TURN_RATE_RAD_S = (-1.0 if CLOCKWISE else 1.0) * 2.0 * FORWARD_SPEED_MM_S / CIRCLE_DIAMETER_MM  # Steering rate = speed / radius, with the selected sign [rad/s].
INITIAL_POSE = load_world().initial_pose  # Starting pose from world.json.
