# Approach a measured wall, turn through an estimated quarter-turn, and stop.

from math import pi

from course_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_config import ROBOT_CONFIG
from student_work import (
    APPROACH,
    DONE,
    FORWARD_SPEED,
    RUN_BEHAVIOR,
    STOP_DISTANCE,
    TURN,
    TURN_DIRECTION,
    TURN_RATE,
    command_for_phase,
    next_phase,
    publish_telemetry,
)
from ucsb_xrp import elapsed_time_s, load_world, wrap_angle_rad


MAXIMUM_APPROACH_TRAVEL_MM = 500.0  # Fault stop before the practice wall.
MAXIMUM_MISSING_RANGE_SAMPLES = 6  # Fault stop if range sensing is unavailable.
MAXIMUM_TURN_TIME_S = 5.0  # Fault stop if heading feedback does not progress.


# Check local examples before reporting results or starting motion.
if not run_exercise_checks():
    print("Restore the runnable example before starting the robot")
else:
    robot = make_robot(ROBOT_CONFIG)
    try:  # Ensure finally stops motors on exit.
        state = robot.start(load_world().initial_pose)  # Initialize estimated pose; reset measurements.
        phase = APPROACH
        start_mean_mm = (
            state.measurements.left_position_mm + state.measurements.right_position_mm
        ) / 2.0
        turn_start_heading_rad = state.pose.heading_rad
        turn_start_ms = state.measurements.time_ms
        missing_range_samples = 0
        # Range selects the turn; estimated heading determines when it ends.
        while phase != DONE:
            if not RUN_BEHAVIOR.value:
                phase = DONE

            turned_rad = abs(wrap_angle_rad(state.pose.heading_rad - turn_start_heading_rad))
            previous_phase = phase
            phase = next_phase(
                phase,
                state.measurements.range_mm,
                STOP_DISTANCE.value,
                turned_rad >= pi / 2.0,
            )
            if previous_phase != TURN and phase == TURN:
                # Measure the quarter-turn from the pose at the phase transition.
                turn_start_heading_rad = state.pose.heading_rad
                turn_start_ms = state.measurements.time_ms

            if phase == APPROACH:
                # Consecutive absent echoes and forward wheel travel bound the approach.
                missing_range_samples = (
                    missing_range_samples + 1
                    if state.measurements.range_mm is None else 0
                )
                mean_mm = (
                    state.measurements.left_position_mm + state.measurements.right_position_mm
                ) / 2.0
                if missing_range_samples >= MAXIMUM_MISSING_RANGE_SAMPLES:
                    raise RuntimeError("Range sensing unavailable during approach")
                if mean_mm - start_mean_mm >= MAXIMUM_APPROACH_TRAVEL_MM:
                    raise RuntimeError("Approach exceeded the practice-area travel bound")
            if phase == TURN and elapsed_time_s(
                state.measurements.time_ms, turn_start_ms
            ) >= MAXIMUM_TURN_TIME_S:
                raise RuntimeError("Turn heading did not reach the target")

            command = command_for_phase(
                phase, FORWARD_SPEED.value, TURN_RATE.value, TURN_DIRECTION.value
            )
            publish_telemetry(state, phase)
            if phase == DONE:
                break
            state = robot.step(command, read_range=phase == APPROACH)
    finally:
        robot.stop()
    print("Tutorial 4 behavior complete")
    print("final_pose:", state.pose)
