"""Challenge 1: drive the requested straight-line distance."""

from challenge import INITIAL_POSE, TARGET_TIME_S, TRAVEL_DISTANCE_MM
from course_setup import make_robot
from robot_config import ROBOT_CONFIG, STRAIGHT_CONFIG
from ucsb_xrp import StraightLineController


robot = make_robot(ROBOT_CONFIG)
straight = StraightLineController(STRAIGHT_CONFIG)
try:
    print("Press and release USER to start Challenge 1")
    state = robot.start(INITIAL_POSE)
    straight.start(state.measurements, TRAVEL_DISTANCE_MM)

    while not straight.is_complete():
        state = robot.step(straight.update(state.measurements))

    print("Challenge 1 complete")
    print("target_distance_mm:", TRAVEL_DISTANCE_MM)
    print("target_time_s:", TARGET_TIME_S)
finally:
    robot.stop()
