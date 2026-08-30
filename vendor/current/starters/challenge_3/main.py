# Challenge 3: follow and independently verify the ordered waypoint route.

from challenge import INITIAL_POSE, MAXIMUM_NAVIGATION_STEPS, ROUTE
from course_setup import make_navigation_controller, make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import distance_to_goal, wrap_angle_rad


def goal_is_reached(pose, goal):
    if distance_to_goal(pose, goal) > NAVIGATION_CONFIG.position_tolerance_mm:
        return False
    if goal.heading_rad is None:
        return True
    heading_error = wrap_angle_rad(goal.heading_rad - pose.heading_rad)
    return abs(heading_error) <= NAVIGATION_CONFIG.heading_tolerance_rad


def run_challenge():
    # Follow the ordered route and return the final RobotState.
    robot = make_robot(ROBOT_CONFIG)
    navigation = make_navigation_controller(NAVIGATION_CONFIG)
    reached_count = 0
    step_count = 0
    try:
        state = robot.start(INITIAL_POSE)
        navigation.start(ROUTE)
        while not navigation.is_complete():
            while reached_count < len(ROUTE) and goal_is_reached(
                state.pose, ROUTE[reached_count]
            ):
                reached_count += 1
                print("waypoint_reached: {}/{}".format(reached_count, len(ROUTE)))
            if step_count >= MAXIMUM_NAVIGATION_STEPS:
                print("Challenge 3 result: step_limit")
                print("waypoints_reached: {}/{}".format(reached_count, len(ROUTE)))
                raise RuntimeError("Waypoint route exceeded its visible step limit")
            state = robot.step(navigation.update(state.pose))
            step_count += 1

        # The controller's completion flag is not itself evidence that the
        # assigned route was visited. Check the final sample before accepting it.
        while reached_count < len(ROUTE) and goal_is_reached(
            state.pose, ROUTE[reached_count]
        ):
            reached_count += 1
            print("waypoint_reached: {}/{}".format(reached_count, len(ROUTE)))
        if reached_count != len(ROUTE):
            print("Challenge 3 result: route_incomplete")
            print("waypoints_reached: {}/{}".format(reached_count, len(ROUTE)))
            raise RuntimeError(
                "Navigation reported completion before the ordered route was reached"
            )
        print("Challenge 3 complete")
        print("navigation_steps:", step_count)
        print("final_pose:", state.pose)
        return state
    # Always stop the motors, including when an error ends the program.
    finally:
        robot.stop()


run_challenge()
