# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import load_world

WORLD = load_world()  # Match the arena and initial pose in the selected world.
RANDOM_SEED = 0x5A17  # Integer seed repeats the same distances and left/right choices.
SEGMENT_COUNT = 12  # Number of straight-run/quarter-turn pairs before completion.
TURN_TOLERANCE_RAD = 0.05  # Accept a turn when absolute heading error is at most this value, rad.
TURN_TIMEOUT_S = 8.0  # Stop the run if a turn exceeds this elapsed time, s.
SEGMENT_TIMEOUT_S = 30.0  # Stop the run if a straight segment exceeds this elapsed time, s.
# Random straight-segment targets lie between these axle-center travel limits, mm.
MINIMUM_SEGMENT_TRAVEL_MM = 100.0
MAXIMUM_SEGMENT_TRAVEL_MM = 180.0
