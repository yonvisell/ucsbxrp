"""Robot Curling: measure travel, stop, and observe stationary completion."""
from challenge import (
    FINISH,
    INITIAL_POSE,
    MAXIMUM_RUN_TIME_S,
    MINIMUM_TIME_S,
    STATIONARY_DURATION_S,
    STATIONARY_SPEED_MM_S,
    TRAVEL_DISTANCE_MM,
)
from course_setup import make_robot
from distance_policy import distance_command
from robot_config import ROBOT_CONFIG, STRAIGHT_CONFIG
from ucsb_xrp import MotionCommand, StraightLineController, distance_to_goal, elapsed_time_s, live

USE_SUPPLIED_DISTANCE_POLICY = False

def mean_position(measurements):
    return (measurements.left_position_mm + measurements.right_position_mm) / 2.0

def run_challenge():
    robot = make_robot(ROBOT_CONFIG)
    supplied = StraightLineController(STRAIGHT_CONFIG)
    stopped = False
    stationary_s = 0.0
    result = "timeout"
    try:
        state = robot.start(INITIAL_POSE)
        initial_position_mm = mean_position(state.measurements)
        start_ms = state.measurements.time_ms
        supplied.start(state.measurements, TRAVEL_DISTANCE_MM)
        while elapsed_time_s(state.measurements.time_ms, start_ms) < MAXIMUM_RUN_TIME_S:
            travel_mm = mean_position(state.measurements) - initial_position_mm
            remaining_mm = TRAVEL_DISTANCE_MM - travel_mm
            if abs(travel_mm) > TRAVEL_DISTANCE_MM * 1.5 + 100.0:
                result = "travel_limit"
                break
            if stopped:
                command = MotionCommand(0.0, 0.0)
            elif USE_SUPPLIED_DISTANCE_POLICY:
                command = supplied.update(state.measurements)
                stopped = supplied.is_complete()
            else:
                command = distance_command(remaining_mm)
                stopped = command.forward_speed_mm_s == 0.0
            state = robot.step(command)
            speeds = state.measurements.wheel_speeds
            maximum_speed_mm_s = max(abs(speeds.left_mm_s), abs(speeds.right_mm_s))
            if stopped and maximum_speed_mm_s <= STATIONARY_SPEED_MM_S:
                stationary_s += state.measurements.dt_s
            else:
                stationary_s = 0.0
            live.plot("remaining_mm", remaining_mm)
            live.plot("requested_speed_mm_s", command.forward_speed_mm_s)
            live.watch("phase", "settling" if stopped else "approach")
            if stationary_s >= STATIONARY_DURATION_S:
                result = "stationary"
                break
        elapsed_s = elapsed_time_s(state.measurements.time_ms, start_ms)
        print("Curling: result={} elapsed_s={} minimum_time_met={}".format(
            result, elapsed_s, elapsed_s >= MINIMUM_TIME_S,
        ))
        print("estimated_axle_error_mm:", distance_to_goal(state.pose, FINISH))
        print("estimated_final_pose:", state.pose)
        print("Physical score uses the marked axle-center reference after rest;")
        print("odometry is supporting evidence.")
        return state
    finally:  # Stop the motors after normal completion or a Python exception.
        robot.stop()

run_challenge()
