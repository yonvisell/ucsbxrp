# Values derived from this project's Turn and Return world.

from ucsb_xrp import distance_to_goal, load_world


WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
TURN_GOAL = WORLD.waypoint("turn")
OUTBOUND_DISTANCE_MM = distance_to_goal(INITIAL_POSE, TURN_GOAL)
TURN_HEADING_RAD = TURN_GOAL.heading_rad
RETURN_DISTANCE_MM = OUTBOUND_DISTANCE_MM
FINAL_HEADING_RAD = INITIAL_POSE.heading_rad
