# Dimensioned map and route for Challenge 4: Mapped Route.

from ucsb_xrp import load_world


WORLD = load_world()  # Load the world selected in Monitor.
INITIAL_POSE = WORLD.initial_pose
DESTINATION = WORLD.waypoint("destination")
ARENA_MAP = WORLD.arena_map()
GRID_RESOLUTION_MM = 100.0  # Width and height of each square grid cell.
CLEARANCE_MM = 150.0  # Expand obstacles by the robot radius plus a tracking margin.

EXECUTE_ROUTE = False  # False: print the path. True: also drive it.
MAXIMUM_GRID_CELLS = 1024  # Limit grid memory use on the XRP.
