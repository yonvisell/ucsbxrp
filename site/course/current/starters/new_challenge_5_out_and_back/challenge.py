# Geometry is known; only the named gate's occupancy is uncertain.
from ucsb_xrp import load_world
from robot_config import ROBOT_CONFIG

WORLD = load_world()  # Load the world selected in Monitor.
INITIAL_POSE = WORLD.initial_pose
OUTBOUND_ROUTE = tuple(WORLD.waypoint(name) for name in ("outbound_1", "outbound_2", "observation"))
HOME = WORLD.waypoint("home")
# Use one map definition in both virtual cases; never read the selected
# world's obstacle list to infer the hidden gate state.
MISSION_MAP = load_world(world_id="gate-blocked").arena_map()
GRID_RESOLUTION_MM = 100.0  # Width and height of each square grid cell.
CLEARANCE_MM = 95.0  # Expand obstacles by the robot radius plus a tracking margin.
RANGE_SAMPLE_COUNT = 7
MINIMUM_USABLE_RANGE_COUNT = 4
BLOCKED_RANGE_THRESHOLD_MM = 550.0
GATE_FEATURE = "center_gate"

STATIONARY_DURATION_S = 0.3  # Required continuous interval at low wheel speed.
STATIONARY_SPEED_MM_S = 5.0  # Maximum absolute wheel speed counted as stationary.
MAXIMUM_STOP_WAIT_S = 3.0  # Longest wait for the stationary check.
MAXIMUM_GRID_CELLS = 1024  # Limit grid memory use on the XRP.
# Allow each distinct ultrasound attempt two control periods plus two 70 ms
# acquisition intervals; retain a 2 s minimum for scheduler variation.
RANGE_COLLECTION_TIMEOUT_S = max(2.0, RANGE_SAMPLE_COUNT * (2 * ROBOT_CONFIG.sample_period_ms + 140) / 1000.0)
