"""Challenge 3: follow the ordered world-coordinate route."""

from challenge import INITIAL_POSE, ROUTE
from course_setup import make_navigation_controller, make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG


robot = make_robot(ROBOT_CONFIG)
navigation = make_navigation_controller(NAVIGATION_CONFIG)
try:
    print("Press and release USER to start Challenge 3")
    state = robot.start(INITIAL_POSE)
    navigation.start(ROUTE)
    while not navigation.is_complete():
        state = robot.step(navigation.update(state.pose))
    print("Challenge 3 complete")
    print("final_pose:", state.pose)
finally:
    robot.stop()
