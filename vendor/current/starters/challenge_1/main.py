# Challenge 1: drive the requested straight-line distance.

from challenge import (
    INITIAL_POSE,
    MAX_RUN_TIME_S,
    TARGET_TIME_S,
    TRAVEL_DISTANCE_MM,
)
from course_setup import make_robot
from robot_config import ROBOT_CONFIG, STRAIGHT_CONFIG
from ucsb_xrp import StraightLineController, elapsed_time_s, wrap_angle_rad


def run_challenge():
    # Run the measured straight-line task and return the final RobotState.
    robot = make_robot(ROBOT_CONFIG)
    straight = StraightLineController(STRAIGHT_CONFIG)
    try:
        state = robot.start(INITIAL_POSE)
        start_time_ms = state.measurements.time_ms
        straight.start(state.measurements, TRAVEL_DISTANCE_MM)
        maximum_steps = max(
            1,
            int(MAX_RUN_TIME_S * 1000.0 / ROBOT_CONFIG.sample_period_ms),
        )
        step_count = 0

        while not straight.is_complete():
            if step_count >= maximum_steps:
                message = (
                    "Challenge 1 stopped: measured travel did not reach the "
                    "finish within {} s"
                ).format(MAX_RUN_TIME_S)
                print(message)
                raise RuntimeError(message)
            state = robot.step(straight.update(state.measurements))
            step_count += 1

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
        print("distance_error_mm:", mean_wheel_travel_mm - TRAVEL_DISTANCE_MM)
        print("estimated_final_pose:", state.pose)
        print(
            "estimated_lateral_error_mm:",
            state.pose.y_mm - INITIAL_POSE.y_mm,
        )
        print(
            "estimated_heading_error_rad:",
            wrap_angle_rad(state.pose.heading_rad - INITIAL_POSE.heading_rad),
        )
        print("target_time_s:", TARGET_TIME_S)
        print("measured_elapsed_time_s:", measured_elapsed_time_s)
        time_error_s = measured_elapsed_time_s - TARGET_TIME_S
        print("time_error_s:", time_error_s)
        if time_error_s < 0.0:
            print("timed_result: early (does not satisfy the challenge rule)")
        else:
            print("timed_result: valid (not early)")
        return state
    # Always stop the motors, including when an error ends the program.
    finally:
        robot.stop()


run_challenge()
