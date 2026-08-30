# Values that define this Straight Run task.

from ucsb_xrp import distance_to_goal, load_world


WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
TRAVEL_DISTANCE_MM = distance_to_goal(INITIAL_POSE, WORLD.waypoint("finish"))
TARGET_TIME_S = 8.0

# If measured travel never reaches the finish, stop rather than leaving a
# mistaken sensor or controller implementation commanding the motors forever.
MAX_RUN_TIME_S = 20.0
