from ucsb_xrp import load_world


WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose

CHECKPOINTS_MM = tuple((goal.x_mm, goal.y_mm) for goal in WORLD.waypoints())
CHECKPOINT_TOLERANCE_MM = 150.0
MAXIMUM_LOST_LINE_S = 0.4
