# Challenge 4: plan and follow a route around known obstacles.

from challenge import (
    ARENA_MAP,
    CLEARANCE_MM,
    DESTINATION,
    GRID_RESOLUTION_MM,
    INITIAL_POSE,
)
from course_setup import make_grid_planner, make_navigation_controller, make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import GridPath, OccupancyGrid, distance_to_goal, wrap_angle_rad


def path_error(grid, start, goal, path):
    """Return a readable reason when a planned path is unsafe to execute."""
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


def goal_is_reached(pose, goal):
    if distance_to_goal(pose, goal) > NAVIGATION_CONFIG.position_tolerance_mm:
        return False
    if goal.heading_rad is None:
        return True
    heading_error = wrap_angle_rad(goal.heading_rad - pose.heading_rad)
    return abs(heading_error) <= NAVIGATION_CONFIG.heading_tolerance_rad


def run_challenge():
    # Plan and follow the mapped route, or report that no route exists.
    # The occupancy grid accounts for the robot clearance around each obstacle.
    grid = OccupancyGrid.from_arena(ARENA_MAP, GRID_RESOLUTION_MM, CLEARANCE_MM)
    start = grid.world_to_cell(INITIAL_POSE.x_mm, INITIAL_POSE.y_mm)
    goal = grid.world_to_cell(DESTINATION.x_mm, DESTINATION.y_mm)
    path = make_grid_planner().plan(grid, start, goal)
    if path is None:
        print("Challenge 4: result=no_path")
        return None
    invalid_reason = path_error(grid, start, goal, path)
    if invalid_reason is not None:
        print("Challenge 4: result=invalid_path reason={}".format(invalid_reason))
        return None

    goals = list(path.to_goals(grid))
    goals[-1] = DESTINATION

    robot = make_robot(ROBOT_CONFIG)
    navigation = make_navigation_controller(NAVIGATION_CONFIG)
    step_count = 0
    try:
        state = robot.start(INITIAL_POSE)
        navigation.start(goals)
        while not navigation.is_complete():
            state = robot.step(navigation.update(state.pose))
            step_count += 1

        result = (
            "complete"
            if goal_is_reached(state.pose, DESTINATION)
            else "destination_not_reached"
        )
        print(
            "Challenge 4: result={} path_cells={} navigation_steps={} "
            "final_pose={}".format(
                result, len(path.cells), step_count, state.pose
            )
        )
        if result != "complete":
            raise RuntimeError(
                "Navigation finished before the destination was reached"
            )
        return state
    finally:
        robot.stop()


run_challenge()
