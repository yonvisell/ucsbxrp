# Follow a checked grid path through navigation goals and report arrival.

from live_variables import publish_navigation_steps
from robot_config import apply_navigation_controls
from route_validation import goal_is_reached


# Inputs: selected robot and navigator, starting Pose, checked goals,
# destination, and number of planned grid cells.
# Returns: None after reporting the final pose and result; raises on missed arrival.
# Cleanup: stops the robot after normal completion or an exception.
def run_route(robot, navigation, initial_pose, goals, destination, path_cell_count):
    step_count = 0
    try:
        # Start establishes the initial pose and encoder/time measurement origins.
        state = robot.start(initial_pose)
        navigation.start(goals)
        # Recompute the motion request from each new odometry pose.
        while not navigation.is_complete():
            publish_navigation_steps(step_count)
            apply_navigation_controls(navigation)
            state = robot.step(navigation.update(state.pose))
            step_count += 1

        # Verify destination tolerance separately from controller status.
        result = (
            "complete"
            if goal_is_reached(state.pose, destination, navigation.config)
            else "destination_not_reached"
        )
        print(
            "Challenge 4: result={} path_cells={} navigation_steps={} "
            "final_pose={}".format(
                result, path_cell_count, step_count, state.pose
            )
        )
        if result != "complete":
            raise RuntimeError("Navigation finished before the destination was reached")
    finally:  # Stop the motors whenever route execution exits.
        robot.stop()
