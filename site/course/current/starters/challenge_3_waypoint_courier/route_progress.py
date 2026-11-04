# Count goals reached in order

from challenge import POSITION_TOLERANCE_MM, HEADING_TOLERANCE_RAD
from ucsb_xrp import distance_to_goal, wrap_angle_rad


# Return True if position and required heading meet goal tolerances
def goal_is_reached(pose, goal):
    if distance_to_goal(pose, goal) > POSITION_TOLERANCE_MM:
        return False
    if goal.heading_rad is None:
        return True
    heading_error = wrap_angle_rad(goal.heading_rad - pose.heading_rad)
    return abs(heading_error) <= HEADING_TOLERANCE_RAD


# Continue counting from the next unmet goal
def count_reached_goals(pose, route, reached_count):
    while reached_count < len(route) and goal_is_reached(pose, route[reached_count]):
        reached_count += 1
    return reached_count
