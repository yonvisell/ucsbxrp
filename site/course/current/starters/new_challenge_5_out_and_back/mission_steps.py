# Follow ordered route goals and count arrivals from estimated position.

from live_variables import publish_goals_reached
from robot_config import apply_navigation_controls
from ucsb_xrp import distance_to_goal, wrap_angle_rad

# Inputs: estimated Pose, NavigationGoal, NavigationConfig tolerances.
# Returns: True when both required position and heading conditions are met.
def reached(pose, goal, config):
    if distance_to_goal(pose, goal) > config.position_tolerance_mm:
        return False
    if goal.heading_rad is None:
        return True
    heading_error_rad = wrap_angle_rad(goal.heading_rad - pose.heading_rad)
    return abs(heading_error_rad) <= config.heading_tolerance_rad

# Inputs: started Robot, NavigationController, current RobotState, ordered goals.
# Returns: latest RobotState and "arrived" or "failed_arrival"; publishes count.
def follow_route(robot, navigation, state, goals):
    navigation.start(goals)
    reached_count = 0
    # A measured pose advances the independent arrival count before the next
    # navigation command; controller completion exits the loop.
    while True:
        while reached_count < len(goals) and reached(
            state.pose, goals[reached_count], navigation.config,
        ):
            reached_count += 1
        publish_goals_reached(reached_count)
        # Compare observed arrivals with controller completion at the same pose.
        if navigation.is_complete():
            return state, "arrived" if reached_count == len(goals) else "failed_arrival"
        apply_navigation_controls(navigation)
        state = robot.step(navigation.update(state.pose))
