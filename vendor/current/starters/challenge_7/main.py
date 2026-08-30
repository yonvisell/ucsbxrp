# Challenge 7: correct planar position with two known-wall range observations.

from math import sqrt

from challenge import (
    DESTINATION,
    MAXIMUM_NAVIGATION_STEPS,
    MAXIMUM_SETTLE_STEPS,
    MAXIMUM_TURN_STEPS,
    MINIMUM_USABLE_RANGE_COUNT,
    ODOMETRY_INITIAL_POSE,
    RANGE_SAMPLE_COUNT,
    SENSOR_FORWARD_OFFSET_MM,
    STOPPED_SPEED_MM_S,
    WALL_OBSERVATION_HEADING_TOLERANCE_RAD,
    X_WALL_MM,
    X_SCAN_HEADING_RAD,
    Y_SCAN_HEADING_RAD,
    Y_WALL_MM,
)
from course_setup import make_navigation_controller, make_pose_corrector, make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND, wrap_angle_rad


def wheels_are_stopped(state):
    return (
        abs(state.measurements.left_speed_mm_s) <= STOPPED_SPEED_MM_S
        and abs(state.measurements.right_speed_mm_s) <= STOPPED_SPEED_MM_S
    )


def require_cardinal_observation(state, expected_heading_rad):
    if not wheels_are_stopped(state):
        raise RuntimeError(
            "Wall observation rejected: both wheel speeds must be stationary"
        )
    heading_error = wrap_angle_rad(expected_heading_rad - state.pose.heading_rad)
    if abs(heading_error) > WALL_OBSERVATION_HEADING_TOLERANCE_RAD:
        raise RuntimeError(
            "Wall observation rejected: heading is outside the cardinal tolerance"
        )


def collect_stationary_range(robot, state, expected_heading_rad):
    samples = []
    require_cardinal_observation(state, expected_heading_rad)
    for _ in range(RANGE_SAMPLE_COUNT):
        state = robot.step(STOP_COMMAND, read_range=True)
        require_cardinal_observation(state, expected_heading_rad)
        samples.append(state.measurements.range_mm)
    return state, robot.estimate_range(samples, MINIMUM_USABLE_RANGE_COUNT)


def turn_to_heading(robot, state, target_heading_rad):
    for _ in range(MAXIMUM_TURN_STEPS):
        error = wrap_angle_rad(target_heading_rad - state.pose.heading_rad)
        if abs(error) <= NAVIGATION_CONFIG.heading_tolerance_rad:
            return state
        direction = 1.0 if error > 0.0 else -1.0
        state = robot.step(
            MotionCommand(0.0, direction * NAVIGATION_CONFIG.turn_rate_rad_s)
        )
    raise RuntimeError("The localization scan turn exceeded its step limit")


def settle(robot, state):
    for _ in range(MAXIMUM_SETTLE_STEPS):
        state = robot.step(STOP_COMMAND)
        if wheels_are_stopped(state):
            return state
    raise RuntimeError("The drivetrain did not settle at the localization station")


def position_residual_mm(pose, goal):
    dx_mm = pose.x_mm - goal.x_mm
    dy_mm = pose.y_mm - goal.y_mm
    return sqrt(dx_mm * dx_mm + dy_mm * dy_mm)


def run_challenge():
    robot = make_robot(ROBOT_CONFIG)
    corrector = make_pose_corrector(SENSOR_FORWARD_OFFSET_MM)
    navigation = make_navigation_controller(NAVIGATION_CONFIG)
    try:
        state = robot.start(ODOMETRY_INITIAL_POSE)
        corrector.reset(state.pose)

        state = turn_to_heading(robot, state, X_SCAN_HEADING_RAD)
        state = settle(robot, state)
        state, x_range_mm = collect_stationary_range(
            robot, state, X_SCAN_HEADING_RAD
        )
        if x_range_mm is None:
            raise RuntimeError("No usable x-wall range observation")
        x_corrected = corrector.observe_x(state.pose, x_range_mm, X_WALL_MM, True)
        print("x_corrected_pose:", x_corrected)

        state = turn_to_heading(robot, state, Y_SCAN_HEADING_RAD)
        state = settle(robot, state)
        state, y_range_mm = collect_stationary_range(
            robot, state, Y_SCAN_HEADING_RAD
        )
        if y_range_mm is None:
            raise RuntimeError("No usable y-wall range observation")
        corrected = corrector.observe_y(state.pose, y_range_mm, Y_WALL_MM, True)
        print("xy_corrected_pose:", corrected)

        navigation.start((DESTINATION,))
        for _ in range(MAXIMUM_NAVIGATION_STEPS):
            corrected = corrector.corrected_pose(state.pose)
            state = robot.step(navigation.update(corrected))
            if navigation.is_complete():
                break
        else:
            raise RuntimeError("Corrected-pose navigation exceeded its step limit")

        print("Challenge 7 complete")
        print("raw_final_pose:", state.pose)
        corrected_final_pose = corrector.corrected_pose(state.pose)
        print("corrected_final_pose:", corrected_final_pose)
        print(
            "raw_odometry_goal_residual_mm:",
            position_residual_mm(state.pose, DESTINATION),
        )
        print(
            "corrected_goal_residual_mm:",
            position_residual_mm(corrected_final_pose, DESTINATION),
        )
        return state
    finally:
        robot.stop()


run_challenge()
