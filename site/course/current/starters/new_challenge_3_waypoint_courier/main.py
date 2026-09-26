# Challenge 3: follow the ordered waypoint route.

from challenge import INITIAL_POSE, ROUTE
from robot_setup import make_navigation_controller, make_robot
from live_variables import publish_goal_count, publish_heading
from robot_setup import NAVIGATION_CONFIG, ROBOT_CONFIG, apply_navigation_controls
from route_progress import count_reached_goals


robot = make_robot(ROBOT_CONFIG)  # Create the robot instance.
navigation = make_navigation_controller(NAVIGATION_CONFIG)  # Create the route controller.
step_count = 0
reached_count = 0
try:  # Run this block, then stop the motors in finally.
    state = robot.start(INITIAL_POSE)  # Initialize estimated pose; reset measurements.
    reached_count = count_reached_goals(state.pose, ROUTE, reached_count, navigation.config)
    navigation.start(ROUTE)  # Load the ordered waypoints and start at the first.
    while not navigation.is_complete():  # Update motion until the controller finishes the route.
        publish_goal_count(reached_count)
        apply_navigation_controls(navigation)
        state = robot.step(navigation.update(state.pose))  # Calculate motion from pose; apply it and read new measurements.
        publish_heading(state.pose)
        step_count += 1
        reached_count = count_reached_goals(state.pose, ROUTE, reached_count, navigation.config)

    # Confirm waypoint arrivals independently of controller completion.
    result = "complete" if reached_count == len(ROUTE) else "route_incomplete"
    print(
        "Challenge 3: result={} goals_reached={}/{} navigation_steps={} "
        "final_pose={}".format(
            result, reached_count, len(ROUTE), step_count, state.pose
        )
    )
    if result != "complete":
        raise RuntimeError("Navigation finished before every waypoint was observed in order")
finally:
    robot.stop()  # Stop after route completion or an exception.
