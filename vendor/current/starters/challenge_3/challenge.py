"""World-coordinate route for Challenge 3: Waypoint Courier."""

from ucsb_xrp import load_world


WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
ROUTE = WORLD.waypoints()
