from ucsb_xrp import load_world


WORLD = load_world()  # Load the world selected in Monitor.
INITIAL_POSE = WORLD.initial_pose  # Starting axle-midpoint position (mm) and heading (rad).

CHECKPOINTS_MM = tuple((goal.x_mm, goal.y_mm) for goal in WORLD.waypoints())  # Required order, world mm.
CHECKPOINT_TOLERANCE_MM = 150.0  # Accept estimated pose within this radius of the next checkpoint.
MAXIMUM_LOST_LINE_S = 0.4  # Stop the trial after this continuous interval with neither sensor on the line.
