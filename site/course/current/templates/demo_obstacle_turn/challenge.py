# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import load_world

WORLD = load_world()  # Match the arena and initial pose in the selected world.
TURN_TOLERANCE_RAD = 0.06
TURN_TIMEOUT_S = 8.0
