"""Values that define Challenge 2: Turn and Return."""

from math import pi

from ucsb_xrp import distance_to_goal, load_world


WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
OUTBOUND_DISTANCE_MM = distance_to_goal(INITIAL_POSE, WORLD.waypoint("turn"))
TURN_HEADING_RAD = pi
RETURN_DISTANCE_MM = OUTBOUND_DISTANCE_MM
