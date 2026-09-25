# Challenge 3: follow the ordered waypoint route.

from challenge import INITIAL_POSE, ROUTE
from course_setup import make_navigation_controller, make_robot
from live_variables import publish_goal_count, publish_heading
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG, apply_navigation_controls
from route_progress import count_reached_goals


# Keep robot sampling/odometry and route decisions in their selected components.
robot = make_robot(ROBOT_CONFIG)
navigation = make_navigation_controller(NAVIGATION_CONFIG)
step_count = 0
reached_count = 0
try:
    # The world pose initializes odometry; observed goal count starts there.
    state = robot.start(INITIAL_POSE)
    reached_count = count_reached_goals(state.pose, ROUTE, reached_count, navigation.config)
    navigation.start(ROUTE)
    # One measured pose produces one navigation request and one robot sample.
    while not navigation.is_complete():
        publish_goal_count(reached_count)
        apply_navigation_controls(navigation)
        state = robot.step(navigation.update(state.pose))
        publish_heading(state.pose)
        step_count += 1
        reached_count = count_reached_goals(state.pose, ROUTE, reached_count, navigation.config)

    # Controller completion alone does not establish that each goal was observed.
    result = "complete" if reached_count == len(ROUTE) else "route_incomplete"
    print(
        "Challenge 3: result={} goals_reached={}/{} navigation_steps={} "
        "final_pose={}".format(
            result, reached_count, len(ROUTE), step_count, state.pose
        )
    )
    if result != "complete":
        raise RuntimeError("Navigation finished before every waypoint was observed in order")
finally:  # Stop the motors after normal completion or a Python exception.
    robot.stop()
