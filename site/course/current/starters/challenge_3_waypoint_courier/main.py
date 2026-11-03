# Supplied program: acquire camera based gps, then execute the five-goal route.

from challenge import INITIAL_POSE, ROUTE
from live_variables import (
    publish_goal_count, publish_heading, publish_navigation, publish_route_time,
)
from robot_setup import (
    NAVIGATION_CONFIG, ROBOT_CONFIG, apply_navigation_controls,
    make_navigation_controller, make_robot,
)
from route_progress import count_reached_goals
from ucsb_xrp import elapsed_time_s


robot = make_robot(ROBOT_CONFIG)
navigation = make_navigation_controller(NAVIGATION_CONFIG)
step_count = 0
reached_count = 0
route_time_s = 0.0
try:
    state = robot.start(INITIAL_POSE)
    state = robot.wait_for_gps()  # Acquire the world pose before starting navigation.
    start_ms = state.measurements.time_ms  # Route time excludes this initial wait.
    reached_count = count_reached_goals(state.pose, ROUTE, reached_count)
    navigation.start(ROUTE)
    active_goal_number = 1
    while not navigation.is_complete():
        publish_goal_count(reached_count)
        publish_route_time(route_time_s)
        apply_navigation_controls(navigation)
        # The active behavior converts the current pose and goal into a command.
        command_goal = navigation.current_goal()
        command = navigation.update(state.pose)
        publish_navigation(state.pose, command_goal, active_goal_number, navigation.config)
        # Apply the command; update pose from wheel travel and available camera based gps.
        # The returned state supplies the pose for the next navigation command.
        state = robot.step(command)
        if navigation.current_goal() is not command_goal:
            active_goal_number += 1
        publish_heading(state.pose)
        step_count += 1
        # Count arrivals from the new pose. Retain the time of the first sample
        # that reaches all goals, including the final orientation.
        if reached_count < len(ROUTE):
            route_time_s = elapsed_time_s(state.measurements.time_ms, start_ms)
        reached_count = count_reached_goals(state.pose, ROUTE, reached_count)

    publish_navigation(state.pose, None, 0, navigation.config)
    publish_goal_count(reached_count)
    publish_route_time(route_time_s)
    # Confirm waypoint arrivals independently of controller completion.
    result = "complete" if reached_count == len(ROUTE) else "route_incomplete"
    print(
        "Challenge 3: result={} goals_reached={}/{} elapsed_s={} navigation_steps={} "
        "final_pose={}".format(
            result, reached_count, len(ROUTE), route_time_s, step_count, state.pose
        )
    )
    if result != "complete":
        raise RuntimeError("Navigation finished before every waypoint was observed in order")
finally:
    robot.stop()
