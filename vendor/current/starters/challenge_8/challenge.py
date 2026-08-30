# Values for Challenge 8: Multi-Stop Route Planning.

from ucsb_xrp import NavigationGoal, load_world


WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
SERVICE_STOPS = (
    WORLD.waypoint("stop_a"),
    WORLD.waypoint("stop_b"),
    WORLD.waypoint("stop_c"),
)
NODE_GOALS = (
    NavigationGoal(
        INITIAL_POSE.x_mm,
        INITIAL_POSE.y_mm,
        INITIAL_POSE.heading_rad,
    ),
) + SERVICE_STOPS
NODE_NAMES = ("depot", "stop_a", "stop_b", "stop_c")
START_NODE_INDEX = 0
REQUIRED_NODE_INDICES = (1, 2, 3)
FINISH_NODE_INDEX = 0
ARENA_MAP = WORLD.arena_map()
GRID_RESOLUTION_MM = 100.0
CLEARANCE_MM = 95.0
