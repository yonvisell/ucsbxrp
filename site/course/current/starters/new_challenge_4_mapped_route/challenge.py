# Dimensioned map and route for Challenge 4: Mapped Route.

from ucsb_xrp import load_world


# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
DESTINATION = WORLD.waypoint("destination")
ARENA_MAP = WORLD.arena_map()
# Grid resolution sets cell size in mm; clearance expands blocked regions.
GRID_RESOLUTION_MM = 100.0
# Obstacle expansion for robot size and path-following error.
CLEARANCE_MM = 150.0

# Motion selection and planner memory limit.
EXECUTE_ROUTE = False
MAXIMUM_GRID_CELLS = 1024
