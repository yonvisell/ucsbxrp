# Check observed waypoint arrival independently of the navigation controller.
# Inputs: estimated Pose, ordered NavigationGoal values, current NavigationConfig.
# Returns: the number of goals reached in order at this sample.

from ucsb_xrp import distance_to_goal, wrap_angle_rad


# Input: estimated Pose, one NavigationGoal, current NavigationConfig.
# Return: whether both required pose errors are within tolerance.
def goal_is_reached(pose, goal, config):
    if distance_to_goal(pose, goal) > config.position_tolerance_mm:
        return False
    if goal.heading_rad is None:
        return True
    heading_error = wrap_angle_rad(goal.heading_rad - pose.heading_rad)
    return abs(heading_error) <= config.heading_tolerance_rad


# Input: estimated Pose, ordered goals, prior count, current configuration.
# Return: updated observed-arrival count; does not read controller progress.
def count_reached_goals(pose, route, reached_count, config):
    while reached_count < len(route) and goal_is_reached(pose, route[reached_count], config):
        reached_count += 1  # Advance to the next waypoint after confirming this one.
    return reached_count
