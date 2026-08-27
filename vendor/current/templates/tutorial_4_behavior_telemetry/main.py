"""Run the Tutorial 4 measured behavior with live telemetry."""

from math import pi

from course_setup import make_robot
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
from ucsb_xrp import Pose, wrap_angle_rad


MAX_STEPS = 500


def run_behavior():
    robot = make_robot(ROBOT_CONFIG)
    state = robot.start(Pose(0.0, 0.0, 0.0))
    phase = APPROACH
    turn_start_heading_rad = state.pose.heading_rad
    try:
        for _ in range(MAX_STEPS):
            if not RUN_BEHAVIOR.value:
                phase = DONE

            turned_rad = abs(
                wrap_angle_rad(state.pose.heading_rad - turn_start_heading_rad)
            )
            previous_phase = phase
            phase = next_phase(
                phase,
                state.measurements.range_mm,
                STOP_DISTANCE.value,
                turned_rad >= pi / 2.0,
            )
            if previous_phase != TURN and phase == TURN:
                turn_start_heading_rad = state.pose.heading_rad

            command = command_for_phase(
                phase,
                FORWARD_SPEED.value,
                TURN_RATE.value,
                TURN_DIRECTION.value,
            )
            publish_telemetry(state, phase)
            if phase == DONE:
                break
            state = robot.step(command, read_range=phase == APPROACH)
        else:
            raise RuntimeError("Behavior did not finish within the sample limit")
    finally:
        robot.stop()
    print("Tutorial 4 behavior complete")
    print("final_pose:", state.pose)


try:
    run_behavior()
except NotImplementedError as error:
    print("NOT COMPLETED ·", error)
