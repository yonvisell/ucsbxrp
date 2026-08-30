# Challenge 3: follow the ordered waypoint route.

from challenge import INITIAL_POSE, ROUTE
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


def count_reached_goals(pose, route, reached_count):
    """Advance only through goals observed at their assigned position in order."""
    while reached_count < len(route) and goal_is_reached(
        pose, route[reached_count]
    ):
        reached_count += 1
    return reached_count


def run_challenge():
    robot = make_robot(ROBOT_CONFIG)
    navigation = make_navigation_controller(NAVIGATION_CONFIG)
    step_count = 0
    reached_count = 0
    try:
        state = robot.start(INITIAL_POSE)
        reached_count = count_reached_goals(state.pose, ROUTE, reached_count)
        navigation.start(ROUTE)
        while not navigation.is_complete():
            state = robot.step(navigation.update(state.pose))
            step_count += 1
            reached_count = count_reached_goals(
                state.pose, ROUTE, reached_count
            )

        result = "complete" if reached_count == len(ROUTE) else "route_incomplete"
        print(
            "Challenge 3: result={} goals_reached={}/{} navigation_steps={} "
            "final_pose={}".format(
                result, reached_count, len(ROUTE), step_count, state.pose
            )
        )
        if result != "complete":
            raise RuntimeError(
                "Navigation finished before every waypoint was observed in order"
            )
        return state
    finally:
        robot.stop()


run_challenge()
