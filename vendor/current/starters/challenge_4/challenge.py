# Dimensioned map and route for Challenge 4: Mapped Route.

from ucsb_xrp import load_world


WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
DESTINATION = WORLD.waypoint("destination")
ARENA_MAP = WORLD.arena_map()
GRID_RESOLUTION_MM = 100.0
# 85 mm is the virtual XRP collision radius. The extra 10 mm prevents the
# planned cell centers from merely grazing obstacles or the arena boundary.
CLEARANCE_MM = 95.0
