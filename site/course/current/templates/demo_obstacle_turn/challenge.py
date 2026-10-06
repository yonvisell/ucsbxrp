# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import load_world

WORLD = load_world()  # Match the arena and initial pose in the selected world.
TURN_TOLERANCE_RAD = 0.06  # Accept the quarter-turn when absolute heading error is at most this value, rad.
TURN_TIMEOUT_S = 8.0  # Stop the run if the turn has not completed within this elapsed time, s.
