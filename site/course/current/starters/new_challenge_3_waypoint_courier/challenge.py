# World-coordinate route for Challenge 3: Waypoint Courier.

from ucsb_xrp import load_world


# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
ROUTE = WORLD.waypoints()
