# Robot Curling target in the selected world.

from ucsb_xrp import distance_to_goal, load_world


WORLD = load_world()  # Load the world selected in Monitor.
INITIAL_POSE = WORLD.initial_pose
FINISH = WORLD.waypoint("finish")
TRAVEL_DISTANCE_MM = distance_to_goal(INITIAL_POSE, FINISH)
