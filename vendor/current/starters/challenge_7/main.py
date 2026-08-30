# Challenge 7: correct planar position with two known-wall range observations.

from challenge import (
    DESTINATION,
    MINIMUM_USABLE_RANGE_COUNT,
    ODOMETRY_INITIAL_POSE,
    RANGE_SAMPLE_COUNT,
    SENSOR_FORWARD_OFFSET_MM,
    STOPPED_SPEED_MM_S,
    WALL_OBSERVATION_HEADING_TOLERANCE_RAD,
    X_SCAN_HEADING_RAD,
    X_WALL_IS_POSITIVE,
    X_WALL_MM,
    Y_SCAN_HEADING_RAD,
    Y_WALL_IS_POSITIVE,
    Y_WALL_MM,
)
from course_setup import make_navigation_controller, make_pose_corrector, make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import (
    MotionCommand,
    STOP_COMMAND,
    distance_to_goal,
    wrap_angle_rad,
)


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
    while True:
        error = wrap_angle_rad(target_heading_rad - state.pose.heading_rad)
        if abs(error) <= NAVIGATION_CONFIG.heading_tolerance_rad:
            return state
        direction = 1.0 if error > 0.0 else -1.0
        state = robot.step(
            MotionCommand(0.0, direction * NAVIGATION_CONFIG.turn_rate_rad_s)
        )


def settle(robot, state):
    while not wheels_are_stopped(state):
        state = robot.step(STOP_COMMAND)
    return state


def destination_is_reached(corrected_pose, raw_pose):
    if (
        distance_to_goal(corrected_pose, DESTINATION)
        > NAVIGATION_CONFIG.position_tolerance_mm
    ):
        return False
    if DESTINATION.heading_rad is None:
        return True
    heading_error = wrap_angle_rad(
        DESTINATION.heading_rad - raw_pose.heading_rad
    )
    return abs(heading_error) <= NAVIGATION_CONFIG.heading_tolerance_rad


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
        corrector.observe_x(
            state.pose, x_range_mm, X_WALL_MM, X_WALL_IS_POSITIVE
        )

        state = turn_to_heading(robot, state, Y_SCAN_HEADING_RAD)
        state = settle(robot, state)
        state, y_range_mm = collect_stationary_range(
            robot, state, Y_SCAN_HEADING_RAD
        )
        if y_range_mm is None:
            raise RuntimeError("No usable y-wall range observation")
        corrector.observe_y(
            state.pose, y_range_mm, Y_WALL_MM, Y_WALL_IS_POSITIVE
        )

        navigation.start((DESTINATION,))
        while not navigation.is_complete():
            corrected = corrector.corrected_pose(state.pose)
            state = robot.step(navigation.update(corrected))

        corrected_final_pose = corrector.corrected_pose(state.pose)
        result = (
            "complete"
            if destination_is_reached(corrected_final_pose, state.pose)
            else "destination_not_reached"
        )
        print(
            "Challenge 7: result={} x_range_mm={} y_range_mm={} "
            "corrected_residual_mm={} raw_final_pose={} "
            "corrected_final_pose={}".format(
                result,
                x_range_mm,
                y_range_mm,
                distance_to_goal(corrected_final_pose, DESTINATION),
                state.pose,
                corrected_final_pose,
            )
        )
        if result != "complete":
            raise RuntimeError("Corrected navigation did not reach the destination")
        return state
    finally:
        robot.stop()


run_challenge()
