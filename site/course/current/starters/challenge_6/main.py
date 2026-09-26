# Challenge 6: approach a wall using the student's range-speed controller.

from math import isfinite

from challenge import (
    INITIAL_POSE,
    INITIAL_RANGE_SAMPLE_COUNT,
    MAXIMUM_SAFE_SPEED_MM_S,
    MAXIMUM_RANGE_SAMPLE_AGE_S,
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
from live_variables import publish_range_decision
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND, elapsed_time_s


def mean_forward_speed(state):
    # Wheel-speed mean estimates axle-center forward speed in mm/s.
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
        raise RuntimeError("RangeSafetyController exceeded the request or configured maximum")
    if range_mm is None and speed_mm_s != 0.0:
        raise RuntimeError("RangeSafetyController must stop when range is unavailable")
    return speed_mm_s


def remember_range(robot, state, observations, previous_seq):
    sequence = robot.range_sample_seq
    if sequence is not None and sequence != previous_seq:
        # Keep the actual attempt's age; repeated control steps are not samples.
        observations.append((state.measurements.range_mm, state.measurements.time_ms, robot.range_sample_age_s))
        del observations[:-RANGE_WINDOW_SIZE]
    return sequence


def current_range_estimate(robot, state, observations):
    latest_age_s = robot.range_sample_age_s
    if state.measurements.range_mm is None or latest_age_s is None or latest_age_s > MAXIMUM_RANGE_SAMPLE_AGE_S:
        return None  # A missing or stale latest reading cannot authorize motion.
    # Retain only samples whose collection age plus elapsed time is acceptable.
    current = []
    for distance_mm, observed_ms, initial_age_s in observations:
        age_s = initial_age_s + elapsed_time_s(state.measurements.time_ms, observed_ms)
        if age_s <= MAXIMUM_RANGE_SAMPLE_AGE_S:
            current.append(distance_mm)
    return robot.estimate_range(current, MINIMUM_USABLE_RANGE_COUNT)


def run_challenge():
    # Construct Robot with the drive components selected in course_setup.
    robot = make_robot(ROBOT_CONFIG)
    controller = make_range_safety_controller(
        RESPONSE_TIME_S,
        MINIMUM_DECELERATION_MM_S2,
        STOP_MARGIN_MM,
        MAXIMUM_SAFE_SPEED_MM_S,
    )
    observations = []
    previous_seq = None
    try:
        # Reset measurements, pose, and sample timing at INITIAL_POSE.
        state = robot.start(INITIAL_POSE)
        for _ in range(INITIAL_RANGE_SAMPLE_COUNT):
            robot.collect_range_samples(1)
            state = robot.state
            previous_seq = remember_range(robot, state, observations, previous_seq)

        # Recompute the allowed speed from fresh range and measured wheel speed.
        while True:
            estimate = current_range_estimate(robot, state, observations)
            speed_mm_s = valid_student_speed(
                controller.update(NOMINAL_FORWARD_SPEED_MM_S, mean_forward_speed(state), estimate),
                NOMINAL_FORWARD_SPEED_MM_S,
                MAXIMUM_SAFE_SPEED_MM_S,
                estimate,
            )
            publish_range_decision(estimate, speed_mm_s)
            if speed_mm_s == 0.0:
                break
            state = robot.step(MotionCommand(speed_mm_s, 0.0), read_range=True)
            previous_seq = remember_range(robot, state, observations, previous_seq)

        # A zero request is followed by measured stopping, not assumed stopping.
        while not wheels_are_stopped(state):
            state = robot.step(STOP_COMMAND, read_range=True)
            previous_seq = remember_range(robot, state, observations, previous_seq)

        # Grade stationary observations, not a median retained from the approach.
        final_samples = robot.collect_range_samples(INITIAL_RANGE_SAMPLE_COUNT)
        state = robot.state
        final_range_mm = robot.estimate_range(final_samples, MINIMUM_USABLE_RANGE_COUNT)
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
    finally:  # Stop the motors after normal completion or a Python exception.
        robot.stop()


run_challenge()
