# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import load_world

WORLD = load_world()  # initial_pose and geometry come from world.json.
INITIAL_POSE = WORLD.initial_pose
OBSTACLE_STOP_MM = 400.0  # Forward distance measured from the ultrasound sensor.
SPIRAL_EXPANSION_MM = 8000.0  # Expand slowly enough to see several circuits inside the arena.
