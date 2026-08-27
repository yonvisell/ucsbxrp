"""Challenge 2: drive out, turn around, and return."""

from challenge import (
    FINAL_HEADING_RAD,
    INITIAL_POSE,
    OUTBOUND_DISTANCE_MM,
    RETURN_DISTANCE_MM,
    TURN_HEADING_RAD,
)
from course_setup import make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import MotionCommand, StraightLineController, wrap_angle_rad


def drive_straight(robot, state, distance_mm):
    """Drive one measured distance and return the updated RobotState."""
    controller = StraightLineController(NAVIGATION_CONFIG)
    controller.start(state.measurements, distance_mm)
    while not controller.is_complete():
        state = robot.step(controller.update(state.measurements))
    return state


def turn_to_heading(robot, state, target_heading_rad):
    """Turn in place toward one world heading and return the updated state."""
    heading_error = wrap_angle_rad(target_heading_rad - state.pose.heading_rad)
    while abs(heading_error) > NAVIGATION_CONFIG.heading_tolerance_rad:
        turn_rate = (
            NAVIGATION_CONFIG.turn_rate_rad_s
            if heading_error > 0
            else -NAVIGATION_CONFIG.turn_rate_rad_s
        )
        state = robot.step(MotionCommand(0.0, turn_rate))
        heading_error = wrap_angle_rad(target_heading_rad - state.pose.heading_rad)
    return state


def run_challenge():
    """Run the out-turn-return sequence and return the final RobotState."""
    robot = make_robot(ROBOT_CONFIG)
    try:
        state = robot.start(INITIAL_POSE)
        state = drive_straight(robot, state, OUTBOUND_DISTANCE_MM)
        state = turn_to_heading(robot, state, TURN_HEADING_RAD)
        state = drive_straight(robot, state, RETURN_DISTANCE_MM)
        state = turn_to_heading(robot, state, FINAL_HEADING_RAD)
        print("Challenge 2 complete")
        print("final_pose:", state.pose)
        return state
    finally:
        robot.stop()


run_challenge()
