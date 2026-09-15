"""Geometry is known; only the named gate's occupancy is uncertain."""
from ucsb_xrp import load_world

WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
OUTBOUND_ROUTE = tuple(WORLD.waypoint(name) for name in ("outbound_1", "outbound_2", "observation"))
HOME = WORLD.waypoint("home")
# Use one map definition in both virtual cases; never read the selected
# world's obstacle list to infer the hidden gate state.
MISSION_MAP = load_world(world_id="gate-blocked").arena_map()
GRID_RESOLUTION_MM = 100.0
CLEARANCE_MM = 95.0
MAXIMUM_LEG_TIME_S = 120.0
RANGE_SAMPLE_COUNT = 7
MINIMUM_USABLE_RANGE_COUNT = 4
BLOCKED_RANGE_THRESHOLD_MM = 550.0
