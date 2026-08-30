# Challenge 2: drive out, turn around, and return.

from math import sqrt

from challenge import (
    FINAL_HEADING_RAD,
    INITIAL_POSE,
    MAX_STRAIGHT_TIME_S,
    MAX_TURN_TIME_S,
    OUTBOUND_DISTANCE_MM,
    RETURN_DISTANCE_MM,
    TURN_HEADING_RAD,
)
from course_setup import make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import MotionCommand, StraightLineController, wrap_angle_rad


def maximum_steps(duration_s):
    return max(1, int(duration_s * 1000.0 / ROBOT_CONFIG.sample_period_ms))


def drive_straight(robot, state, distance_mm, phase_name):
    # Drive one measured distance and return the updated RobotState.
    print("Phase started:", phase_name)
    controller = StraightLineController(NAVIGATION_CONFIG)
    controller.start(state.measurements, distance_mm)
    step_count = 0
    while not controller.is_complete():
        if step_count >= maximum_steps(MAX_STRAIGHT_TIME_S):
            message = "Challenge 2 stopped: {} did not complete within {} s".format(
                phase_name,
                MAX_STRAIGHT_TIME_S,
            )
            print(message)
            raise RuntimeError(message)
        state = robot.step(controller.update(state.measurements))
        step_count += 1
    print("Phase complete:", phase_name)
    return state


def turn_to_heading(robot, state, target_heading_rad, phase_name):
    # Turn in place toward one world heading and return the updated state.
    print("Phase started:", phase_name)
    heading_error = wrap_angle_rad(target_heading_rad - state.pose.heading_rad)
    step_count = 0
    while abs(heading_error) > NAVIGATION_CONFIG.heading_tolerance_rad:
        if step_count >= maximum_steps(MAX_TURN_TIME_S):
            message = "Challenge 2 stopped: {} did not complete within {} s".format(
                phase_name,
                MAX_TURN_TIME_S,
            )
            print(message)
            raise RuntimeError(message)
        turn_rate = (
            NAVIGATION_CONFIG.turn_rate_rad_s
            if heading_error > 0
            else -NAVIGATION_CONFIG.turn_rate_rad_s
        )
        state = robot.step(MotionCommand(0.0, turn_rate))
        step_count += 1
        heading_error = wrap_angle_rad(target_heading_rad - state.pose.heading_rad)
    print("Phase complete:", phase_name)
    return state


def run_challenge():
    # Run the out-turn-return sequence and return the final RobotState.
    robot = make_robot(ROBOT_CONFIG)
    try:
        state = robot.start(INITIAL_POSE)
        state = drive_straight(
            robot,
            state,
            OUTBOUND_DISTANCE_MM,
            "outbound travel",
        )
        state = turn_to_heading(
            robot,
            state,
            TURN_HEADING_RAD,
            "turnaround",
        )
        state = drive_straight(
            robot,
            state,
            RETURN_DISTANCE_MM,
            "return travel",
        )
        state = turn_to_heading(
            robot,
            state,
            FINAL_HEADING_RAD,
            "final heading",
        )
        x_error_mm = state.pose.x_mm - INITIAL_POSE.x_mm
        y_error_mm = state.pose.y_mm - INITIAL_POSE.y_mm
        print("Challenge 2 complete")
        print("final_pose:", state.pose)
        print(
            "estimated_return_position_error_mm:",
            sqrt(x_error_mm * x_error_mm + y_error_mm * y_error_mm),
        )
        print(
            "estimated_return_heading_error_rad:",
            wrap_angle_rad(state.pose.heading_rad - FINAL_HEADING_RAD),
        )
        return state
    # Always stop the motors, including when an error ends the program.
    finally:
        robot.stop()


run_challenge()
