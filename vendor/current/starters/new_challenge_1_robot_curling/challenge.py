# Values that define this Robot Curling task.

from math import cos, sin
from ucsb_xrp import distance_to_goal, load_world


WORLD = load_world()
INITIAL_POSE = WORLD.initial_pose
FINISH = WORLD.waypoint("finish")
TRAVEL_DISTANCE_MM = distance_to_goal(INITIAL_POSE, FINISH)

# The distance policy drives straight ahead; reject a mismatched lane before
# constructing the robot. Allow 1 mm of rounding in the world coordinates.
_dx_mm = FINISH.x_mm - INITIAL_POSE.x_mm
_dy_mm = FINISH.y_mm - INITIAL_POSE.y_mm
_forward_mm = _dx_mm * cos(INITIAL_POSE.heading_rad) + _dy_mm * sin(INITIAL_POSE.heading_rad)
_lateral_mm = -_dx_mm * sin(INITIAL_POSE.heading_rad) + _dy_mm * cos(INITIAL_POSE.heading_rad)
if _forward_mm <= 0 or abs(_lateral_mm) > 1.0:
    raise ValueError(
        "Robot Curling requires finish ahead of initial_pose along its heading "
        "(within 1 mm laterally). Check world.json."
    )

MINIMUM_TIME_S = 8.0
STATIONARY_SPEED_MM_S = 5.0
STATIONARY_DURATION_S = 0.3

# If measured travel never reaches the finish, stop rather than leaving a
# mistaken sensor or controller implementation commanding the motors forever.
MAXIMUM_RUN_TIME_S = 30.0
