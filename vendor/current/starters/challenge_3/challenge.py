# World-coordinate route for Challenge 3: Waypoint Courier.

from ucsb_xrp import load_world


WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
ROUTE = WORLD.waypoints()

# This is a mission limit, not part of NavigationController. At the default
# 20 ms sample period it allows up to 60 s of motion before the program stops.
MAXIMUM_NAVIGATION_STEPS = 3000
