# World-coordinate route for Challenge 3: Waypoint Courier.

from ucsb_xrp import load_world


WORLD = load_world()  # Load the world selected in Monitor.
INITIAL_POSE = WORLD.initial_pose  # Starting axle-midpoint position (mm) and heading (rad).
ROUTE = WORLD.waypoints()  # Ordered NavigationGoal records: x_mm, y_mm, optional heading_rad.
