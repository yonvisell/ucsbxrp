"""Challenge 2: drive out, turn around, and return."""

from challenge import (
    INITIAL_POSE,
    OUTBOUND_DISTANCE_MM,
    RETURN_DISTANCE_MM,
    TURN_HEADING_RAD,
)
from course_setup import make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import MotionCommand, StraightLineController, wrap_angle_rad


robot = make_robot(ROBOT_CONFIG)
state = None


def drive_straight(distance_mm):
    global state
    controller = StraightLineController(NAVIGATION_CONFIG)
    controller.start(state.measurements, distance_mm)
    while not controller.is_complete():
        state = robot.step(controller.update(state.measurements))


try:
    state = robot.start(INITIAL_POSE)
    drive_straight(OUTBOUND_DISTANCE_MM)

    heading_error = wrap_angle_rad(TURN_HEADING_RAD - state.pose.heading_rad)
    while abs(heading_error) > NAVIGATION_CONFIG.heading_tolerance_rad:
        turn_rate = (
            NAVIGATION_CONFIG.turn_rate_rad_s
            if heading_error > 0
            else -NAVIGATION_CONFIG.turn_rate_rad_s
        )
        state = robot.step(MotionCommand(0.0, turn_rate))
        heading_error = wrap_angle_rad(TURN_HEADING_RAD - state.pose.heading_rad)

    drive_straight(RETURN_DISTANCE_MM)
    print("Challenge 2 complete")
    print("final_pose:", state.pose)
finally:
    robot.stop()
