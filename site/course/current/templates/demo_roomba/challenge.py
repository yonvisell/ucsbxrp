# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import load_world

WORLD = load_world()  # Match the arena and initial pose in the selected world.
RANDOM_SEED = 0xC0FFEE  # Integer seed repeats the same avoidance angles and left/right choices.
REVERSE_TIME_S = 0.4  # Elapsed reverse-command duration before each avoidance turn, s.
# Each avoidance turn chooses an angle magnitude between these limits, degrees.
MINIMUM_TURN_ANGLE_DEG = 70.0
MAXIMUM_TURN_ANGLE_DEG = 160.0
TURN_TOLERANCE_RAD = 0.06  # Accept a turn when absolute heading error is at most this value, rad.
TURN_TIMEOUT_S = 8.0  # End the run if a wheel or encoder prevents the rotation.
