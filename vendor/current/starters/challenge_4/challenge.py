# Dimensioned map and route for Challenge 4: Mapped Route.

from ucsb_xrp import load_world


WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
DESTINATION = WORLD.waypoint("destination")
ARENA_MAP = WORLD.arena_map()
GRID_RESOLUTION_MM = 100.0
CLEARANCE_MM = 35.0
