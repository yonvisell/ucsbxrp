# Supplied starting pose and five ordered navigation goals in the arena.
from math import pi
from ucsb_xrp import load_world

# Fixed course acceptance; these are not controller tuning settings.
POSITION_TOLERANCE_MM = 50.0
HEADING_TOLERANCE_RAD = pi / 18.0  # Ten degrees at the final return.

WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
ROUTE = WORLD.waypoints()
