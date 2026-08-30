# Values for Challenge 6: Range-Constrained Stopping.

from ucsb_xrp import load_world


WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose

NOMINAL_FORWARD_SPEEDS_MM_S = {
    "near-wall": 120.0,
    "far-wall": 100.0,
    "no-range": 120.0,
}
NOMINAL_FORWARD_SPEED_MM_S = NOMINAL_FORWARD_SPEEDS_MM_S[WORLD.id]
MAXIMUM_SAFE_SPEED_MM_S = 180.0
RESPONSE_TIME_S = 0.25
MINIMUM_DECELERATION_MM_S2 = 300.0
STOP_MARGIN_MM = 220.0

# These explicit mission bounds stop a runaway exercise; they do not implement
# the student's stopping-distance controller. The contact guard is measured
# from the ultrasonic sensor origin to the wall and lies well inside the
# 220 mm exclusion margin that the student controller must preserve.
ABSOLUTE_CONTACT_GUARD_RANGE_MM = 100.0
MAXIMUM_APPROACH_TIME_S = 16.0
MAXIMUM_FORWARD_TRAVEL_MM = {
    "near-wall": 650.0,
    "far-wall": 1150.0,
    "no-range": 0.0,
}[WORLD.id]

RANGE_WINDOW_SIZE = 5
MINIMUM_USABLE_RANGE_COUNT = 3
INITIAL_RANGE_SAMPLE_COUNT = 5
MAXIMUM_APPROACH_STEPS = 700
MAXIMUM_SETTLE_STEPS = 100
STOPPED_SPEED_MM_S = 5.0
