# Trace a block-letter UCSB route from ordered world waypoints.

from challenge import WORLD, ROUTE
from course_setup import make_navigation_controller, make_robot
from live_variables import publish_phase, publish_travel
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG



def body_travel_mm(state):
    # In-place rotation has opposite wheel increments and adds no body travel.
    measurements = state.measurements
    return abs((measurements.left_increment_mm + measurements.right_increment_mm) / 2.0)


if not ROUTE:
    raise RuntimeError("world.json must define at least one waypoint")

robot = make_robot(ROBOT_CONFIG)
navigation = make_navigation_controller(NAVIGATION_CONFIG)
try:  # Ensure finally stops motors on exit.
    state = robot.start(WORLD.initial_pose)  # Initialize estimated pose; reset measurements.
    navigation.start(ROUTE)  # Use marker-file waypoint order.
    total_travel_mm = 0.0
    # Recompute one motion request from each newly estimated pose.
    while not navigation.is_complete():
        state = robot.step(navigation.update(state.pose))
        total_travel_mm += body_travel_mm(state)
        publish_travel(total_travel_mm)

    publish_phase("complete")
    print("UCSB logo complete")
    print("waypoints:", len(ROUTE))
    print("final_pose:", state.pose)
finally:
    robot.stop()
