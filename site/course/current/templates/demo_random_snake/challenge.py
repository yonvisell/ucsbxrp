# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import load_world

WORLD = load_world()  # Match the arena and initial pose in the selected world.
RANDOM_SEED = 0x5A17
SEGMENT_COUNT = 12
TURN_TOLERANCE_RAD = 0.05
TURN_TIMEOUT_S = 8.0
SEGMENT_TIMEOUT_S = 30.0
MINIMUM_SEGMENT_TRAVEL_MM = 100.0
MAXIMUM_SEGMENT_TRAVEL_MM = 180.0
