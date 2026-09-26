# World-coordinate route for Challenge 3: Waypoint Courier.

from ucsb_xrp import load_world


# Load the selected world; its pose and markers set the task coordinates below.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
ROUTE = WORLD.waypoints()
