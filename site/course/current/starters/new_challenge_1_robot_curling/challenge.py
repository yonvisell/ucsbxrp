# Robot Curling target in the selected world.

from ucsb_xrp import distance_to_goal, load_world


WORLD = load_world()  # Load the world selected in Monitor.
INITIAL_POSE = WORLD.initial_pose
FINISH = WORLD.waypoint("finish")
TRAVEL_DISTANCE_MM = distance_to_goal(INITIAL_POSE, FINISH)

# Confirm the final stop from wheel speeds; these values do not choose when to brake.
STATIONARY_SPEED_MM_S = 5.0
STATIONARY_DURATION_S = 0.3
if TRAVEL_DISTANCE_MM <= 0.0:
    raise ValueError("The finish marker must be separated from the initial pose")
