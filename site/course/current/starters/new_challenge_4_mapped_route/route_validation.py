# Validate a planned grid route before constructing or moving the robot.
# Also check the final estimated pose against the active navigation tolerances.

from ucsb_xrp import GridPath, distance_to_goal, wrap_angle_rad


# Inputs: OccupancyGrid, start/goal GridCell values, proposed GridPath or None.
# Returns: None for a free connected path; otherwise a reason string.
def path_error(grid, start, goal, path):
    if not isinstance(path, GridPath):
        return "GridPlanner must return a GridPath or None"
    if path.cells[0] != start or path.cells[-1] != goal:
        return "path endpoints do not match the requested start and destination"
    for cell in path.cells:
        if grid.is_blocked(cell):
            return "path contains a blocked or out-of-grid cell"
    for first, second in zip(path.cells, path.cells[1:]):
        if second not in grid.neighbors(first):
            return "successive path cells do not share a free side"
    return None


# Inputs: final estimated Pose (mm, rad), NavigationGoal, NavigationConfig.
# Returns: True when position and any required heading meet the tolerances.
def goal_is_reached(pose, goal, config):
    if distance_to_goal(pose, goal) > config.position_tolerance_mm:
        return False
    if goal.heading_rad is None:
        return True
    heading_error = wrap_angle_rad(goal.heading_rad - pose.heading_rad)
    return abs(heading_error) <= config.heading_tolerance_rad
