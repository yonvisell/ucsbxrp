# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import load_world

WORLD = load_world()  # Match the arena and initial pose in the selected world.
INITIAL_POSE = WORLD.initial_pose
OBSTACLE_STOP_MM = 400.0  # Forward distance measured from the ultrasound sensor.
SPIRAL_EXPANSION_MM = 8000.0  # Curvature halves after this axle-center travel at a fixed winding rate, mm.
