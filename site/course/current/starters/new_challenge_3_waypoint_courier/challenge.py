# World-coordinate route for Challenge 3: Waypoint Courier.

from ucsb_xrp import load_world


WORLD = load_world()  # Load the world selected in Monitor.
INITIAL_POSE = WORLD.initial_pose
ROUTE = WORLD.waypoints()
