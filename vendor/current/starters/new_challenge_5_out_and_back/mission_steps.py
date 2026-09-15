"""Supplied, bounded route execution and validation."""
from ucsb_xrp import GridPath, distance_to_goal, elapsed_time_s, live, wrap_angle_rad

def reached(pose, goal, config):
    if distance_to_goal(pose, goal) > config.position_tolerance_mm:
        return False
    if goal.heading_rad is None:
        return True
    heading_error_rad = wrap_angle_rad(goal.heading_rad - pose.heading_rad)
    return abs(heading_error_rad) <= config.heading_tolerance_rad

def follow_route(robot, navigation, state, goals, maximum_time_s):
    navigation.start(goals)
    start_ms = state.measurements.time_ms
    reached_count = 0
    while True:
        while reached_count < len(goals) and reached(
            state.pose, goals[reached_count], navigation.config,
        ):
            reached_count += 1
        live.watch("goals_reached", reached_count)
        if navigation.is_complete():
            return state, "arrived" if reached_count == len(goals) else "failed_arrival"
        if elapsed_time_s(state.measurements.time_ms, start_ms) >= maximum_time_s:
            return state, "timeout"
        state = robot.step(navigation.update(state.pose))

def valid_path(grid, start, goal, path):
    if not isinstance(path, GridPath) or path.cells[0] != start or path.cells[-1] != goal:
        return False
    if any(grid.is_blocked(cell) for cell in path.cells):
        return False
    return all(second in grid.neighbors(first) for first, second in zip(path.cells, path.cells[1:]))
