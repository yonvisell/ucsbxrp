# Robot Curling: measure travel and call the distance-based stopping rule.

from challenge import INITIAL_POSE, TRAVEL_DISTANCE_MM
from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from stopping_controller import speed_for_distance
from ucsb_xrp import run_straight_trial


# speed_for_distance(remaining_mm) supplies speed requests; zero starts the stop.
run_straight_trial(make_robot(ROBOT_CONFIG), INITIAL_POSE, TRAVEL_DISTANCE_MM, speed_for_distance)
