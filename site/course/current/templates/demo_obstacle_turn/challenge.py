# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import load_world

WORLD = load_world()  # initial_pose and geometry come from world.json.
TURN_TOLERANCE_RAD = 0.06
TURN_TIMEOUT_S = 8.0
