"""Challenge 1: drive the requested straight-line distance."""

from challenge import INITIAL_POSE, TARGET_TIME_S, TRAVEL_DISTANCE_MM
from course_setup import make_robot
from robot_config import ROBOT_CONFIG, STRAIGHT_CONFIG
from ucsb_xrp import StraightLineController, elapsed_time_s


robot = make_robot(ROBOT_CONFIG)
straight = StraightLineController(STRAIGHT_CONFIG)
try:
    state = robot.start(INITIAL_POSE)
    start_time_ms = state.measurements.time_ms
    straight.start(state.measurements, TRAVEL_DISTANCE_MM)

    while not straight.is_complete():
        state = robot.step(straight.update(state.measurements))

    measured_elapsed_time_s = elapsed_time_s(
        state.measurements.time_ms,
        start_time_ms,
    )
    mean_wheel_travel_mm = (
        state.measurements.left_position_mm
        + state.measurements.right_position_mm
    ) / 2.0

    print("Challenge 1 complete")
    print("target_distance_mm:", TRAVEL_DISTANCE_MM)
    print("mean_wheel_travel_mm:", mean_wheel_travel_mm)
    print("target_time_s:", TARGET_TIME_S)
    print("measured_elapsed_time_s:", measured_elapsed_time_s)
finally:
    robot.stop()
