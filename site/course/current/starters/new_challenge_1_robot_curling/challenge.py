# Robot Curling target in the selected world.

from ucsb_xrp import distance_to_goal, load_world


# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
FINISH = WORLD.waypoint("finish")
TRAVEL_DISTANCE_MM = distance_to_goal(INITIAL_POSE, FINISH)
