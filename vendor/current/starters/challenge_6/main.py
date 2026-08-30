# Challenge 6: approach a wall using the student's range-speed controller.

from math import isfinite

from challenge import (
    INITIAL_POSE,
    INITIAL_RANGE_SAMPLE_COUNT,
    MAXIMUM_SAFE_SPEED_MM_S,
    MINIMUM_DECELERATION_MM_S2,
    MINIMUM_USABLE_RANGE_COUNT,
    NOMINAL_FORWARD_SPEED_MM_S,
    RANGE_WINDOW_SIZE,
    RESPONSE_TIME_S,
    STOP_MARGIN_MM,
    STOPPED_SPEED_MM_S,
    SUCCESS_MAXIMUM_RANGE_MM,
    SUCCESS_MINIMUM_RANGE_MM,
)
from course_setup import make_range_safety_controller, make_robot
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND, live


def mean_forward_speed(state):
    return (
        state.measurements.left_speed_mm_s
        + state.measurements.right_speed_mm_s
    ) / 2.0


def wheels_are_stopped(state):
    return (
        abs(state.measurements.left_speed_mm_s) <= STOPPED_SPEED_MM_S
        and abs(state.measurements.right_speed_mm_s) <= STOPPED_SPEED_MM_S
    )


def valid_student_speed(
    value,
    requested_speed_mm_s,
    maximum_speed_mm_s,
    range_mm,
):
    if (
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not isfinite(value)
    ):
        raise RuntimeError("RangeSafetyController must return a finite number")
    speed_mm_s = float(value)
    if speed_mm_s < 0.0:
        raise RuntimeError("RangeSafetyController must not command reverse motion")
    if speed_mm_s > requested_speed_mm_s or speed_mm_s > maximum_speed_mm_s:
        raise RuntimeError(
            "RangeSafetyController exceeded the request or configured maximum"
        )
    if range_mm is None and speed_mm_s != 0.0:
        raise RuntimeError("RangeSafetyController must stop when range is unavailable")
    return speed_mm_s


def run_challenge():
    robot = make_robot(ROBOT_CONFIG)
    controller = make_range_safety_controller(
        RESPONSE_TIME_S,
        MINIMUM_DECELERATION_MM_S2,
        STOP_MARGIN_MM,
        MAXIMUM_SAFE_SPEED_MM_S,
    )
    samples = []
    try:
        state = robot.start(INITIAL_POSE)
        for _ in range(INITIAL_RANGE_SAMPLE_COUNT):
            state = robot.step(STOP_COMMAND, read_range=True)
            samples.append(state.measurements.range_mm)
        samples = samples[-RANGE_WINDOW_SIZE:]

        while True:
            estimate = robot.estimate_range(samples, MINIMUM_USABLE_RANGE_COUNT)
            speed_mm_s = valid_student_speed(
                controller.update(
                    NOMINAL_FORWARD_SPEED_MM_S,
                    mean_forward_speed(state),
                    estimate,
                ),
                NOMINAL_FORWARD_SPEED_MM_S,
                MAXIMUM_SAFE_SPEED_MM_S,
                estimate,
            )
            live.watch(
                "range_estimate_mm",
                estimate if estimate is not None else "—",
                unit="mm",
                label="Filtered range",
            )
            live.watch(
                "student_speed_mm_s",
                speed_mm_s,
                unit="mm/s",
                label="Student controller output",
            )
            live.plot(
                "student_speed_mm_s",
                speed_mm_s,
                unit="mm/s",
                label="Student controller output",
            )
            if speed_mm_s == 0.0:
                break
            state = robot.step(MotionCommand(speed_mm_s, 0.0), read_range=True)
            samples.append(state.measurements.range_mm)
            samples = samples[-RANGE_WINDOW_SIZE:]

        while not wheels_are_stopped(state):
            state = robot.step(STOP_COMMAND, read_range=True)
            samples.append(state.measurements.range_mm)
            samples = samples[-RANGE_WINDOW_SIZE:]

        final_range_mm = robot.estimate_range(samples, MINIMUM_USABLE_RANGE_COUNT)
        if final_range_mm is None:
            result = "range_unavailable"
        elif final_range_mm > SUCCESS_MAXIMUM_RANGE_MM:
            result = "early_stop"
        elif final_range_mm < SUCCESS_MINIMUM_RANGE_MM:
            result = "stopped_too_close"
        else:
            result = "complete"
        print(
            "Challenge 6: result={} final_range_mm={} final_pose={}".format(
                result, final_range_mm, state.pose
            )
        )
        return state
    finally:
        robot.stop()


run_challenge()
