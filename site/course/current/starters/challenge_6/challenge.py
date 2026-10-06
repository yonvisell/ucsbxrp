# Values for Challenge 6: Range-Constrained Stopping.

from ucsb_xrp import load_world


# Load the selected world; its pose and markers set the task coordinates below.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose

# Requested approach speed for each selected world case, mm/s.
NOMINAL_FORWARD_SPEEDS_MM_S = {
    "near-wall": 120.0,
    "far-wall": 100.0,
    "no-range": 120.0,
}
NOMINAL_FORWARD_SPEED_MM_S = NOMINAL_FORWARD_SPEEDS_MM_S[WORLD.id]
MAXIMUM_SAFE_SPEED_MM_S = 180.0  # Reject any controller output above this forward-speed limit, mm/s.
# Admit observations up to 0.25 s old, plus 0.15 s for control/command response.
# These are provisional timing allowances; qualify them again on the robot.
MAXIMUM_RANGE_SAMPLE_AGE_S = 0.25
RESPONSE_TIME_S = MAXIMUM_RANGE_SAMPLE_AGE_S + 0.15
MINIMUM_DECELERATION_MM_S2 = 300.0  # Assumed minimum braking magnitude in the stopping-distance calculation, mm/s^2.
STOP_MARGIN_MM = 220.0  # Reserve this sensor-to-wall distance beyond response and braking travel, mm.
# The final stationary sensor-to-wall estimate must lie in this inclusive band, mm.
SUCCESS_MINIMUM_RANGE_MM = 220.0
SUCCESS_MAXIMUM_RANGE_MM = 380.0

RANGE_WINDOW_SIZE = 3  # Number of distinct ultrasound attempts retained during approach.
MINIMUM_USABLE_RANGE_COUNT = 3  # Fresh, positive finite readings required for an estimate.
INITIAL_RANGE_SAMPLE_COUNT = 3  # Distinct attempts collected before motion and again after stopping.
STOPPED_SPEED_MM_S = 5.0  # Both absolute measured wheel speeds must be at or below this value, mm/s.
