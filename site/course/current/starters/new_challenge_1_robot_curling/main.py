# Robot Curling: measure travel and call the distance-based stopping rule.

from challenge import INITIAL_POSE, TRAVEL_DISTANCE_MM
from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from stopping_controller import speed_for_distance
from ucsb_xrp import run_straight_trial


# The world supplies the start pose and target distance; the selected robot
# components supply measurements and wheel control. The callback alone chooses
# forward speed from remaining measured travel. The runner records and stops.
run_straight_trial(make_robot(ROBOT_CONFIG), INITIAL_POSE, TRAVEL_DISTANCE_MM, speed_for_distance)
