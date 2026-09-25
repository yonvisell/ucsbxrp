# Geometry is known; only the named gate's occupancy is uncertain.
from ucsb_xrp import load_world
from robot_config import ROBOT_CONFIG

# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
OUTBOUND_ROUTE = tuple(WORLD.waypoint(name) for name in ("outbound_1", "outbound_2", "observation"))
HOME = WORLD.waypoint("home")
# Use one map definition in both virtual cases; never read the selected
# world's obstacle list to infer the hidden gate state.
MISSION_MAP = load_world(world_id="gate-blocked").arena_map()
# Grid resolution sets cell size in mm; clearance expands blocked regions.
GRID_RESOLUTION_MM = 100.0
CLEARANCE_MM = 95.0
RANGE_SAMPLE_COUNT = 7
MINIMUM_USABLE_RANGE_COUNT = 4
BLOCKED_RANGE_THRESHOLD_MM = 550.0
GATE_FEATURE = "center_gate"

# Stopped-wheel criteria and planner memory limit.
STATIONARY_DURATION_S = 0.3
STATIONARY_SPEED_MM_S = 5.0
MAXIMUM_STOP_WAIT_S = 3.0
MAXIMUM_GRID_CELLS = 1024
# Allow each distinct ultrasound attempt two control periods plus two 70 ms
# acquisition intervals; retain a 2 s minimum for scheduler variation.
RANGE_COLLECTION_TIMEOUT_S = max(2.0, RANGE_SAMPLE_COUNT * (2 * ROBOT_CONFIG.sample_period_ms + 140) / 1000.0)
