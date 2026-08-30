# Values for Challenge 8: Multi-Stop Route Planning.

from ucsb_xrp import load_world


WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
SERVICE_STOPS = (
    WORLD.waypoint("stop_a"),
    WORLD.waypoint("stop_b"),
    WORLD.waypoint("stop_c"),
)
NODE_NAMES = ("depot", "stop_a", "stop_b", "stop_c")
ARENA_MAP = WORLD.arena_map()
GRID_RESOLUTION_MM = 100.0
CLEARANCE_MM = 95.0
MAXIMUM_NAVIGATION_STEPS = 7000
