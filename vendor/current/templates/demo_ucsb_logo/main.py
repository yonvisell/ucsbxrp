# Trace a block-letter UCSB route from ordered world waypoints.

from course_setup import make_navigation_controller, make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import live, load_world


WORLD = load_world()
# ProjectWorld.waypoints() returns NavigationGoal values in marker-file order.
ROUTE = WORLD.waypoints()
MAXIMUM_WHEEL_TRAVEL_MM = 13000.0
MAXIMUM_SAMPLES = 8000


def wheel_travel_mm(state):
    measurements = state.measurements
    return (
        abs(measurements.left_increment_mm)
        + abs(measurements.right_increment_mm)
    ) / 2.0


def run_demo():
    if not ROUTE:
        raise RuntimeError("world.json must define at least one waypoint")

    robot = make_robot(ROBOT_CONFIG)
    navigation = make_navigation_controller(NAVIGATION_CONFIG)
    try:
        state = robot.start(WORLD.initial_pose)
        navigation.start(ROUTE)
        total_travel_mm = 0.0
        samples = 0

        while (
            not navigation.is_complete()
            and total_travel_mm < MAXIMUM_WHEEL_TRAVEL_MM
            and samples < MAXIMUM_SAMPLES
        ):
            state = robot.step(navigation.update(state.pose))
            total_travel_mm += wheel_travel_mm(state)
            samples += 1
            live.watch("travel_mm", total_travel_mm, unit="mm")

        if navigation.is_complete():
            result = "UCSB logo complete"
        elif total_travel_mm >= MAXIMUM_WHEEL_TRAVEL_MM:
            result = "UCSB logo wheel-travel limit reached"
        else:
            result = "UCSB logo sample limit reached"

        live.watch("phase", "complete")
        print(result)
        print("waypoints:", len(ROUTE))
        print("final_pose:", state.pose)
        return state
    finally:
        robot.stop()


run_demo()
