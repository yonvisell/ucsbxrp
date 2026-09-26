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
        state = robot.start(initial_pose)  # Initialize estimated pose; reset measurements.
        navigation.start(goals)  # Load the route and select its first goal.
        while not navigation.is_complete():  # Update motion until the controller finishes the route.
            publish_navigation_steps(step_count)
            apply_navigation_controls(navigation)
            state = robot.step(navigation.update(state.pose))  # Apply the pose-based motion request; read the next sample.
            step_count += 1

        # Check final position and required heading against their tolerances.
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
    finally:
        robot.stop()  # Stop after route completion or an exception.
