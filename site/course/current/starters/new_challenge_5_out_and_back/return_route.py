# Construct a return route using the measured gate decision and known map.

from challenge import HOME, GATE_FEATURE, MISSION_MAP
from challenge import GRID_RESOLUTION_MM, CLEARANCE_MM, MAXIMUM_GRID_CELLS
from ucsb_xrp import GridPath, OccupancyGrid


# Inputs: OccupancyGrid, endpoint GridCell values, proposed GridPath.
# Returns: True only for free, adjacent cells from start through goal.
def valid_path(grid, start, goal, path):
    if not isinstance(path, GridPath) or path.cells[0] != start or path.cells[-1] != goal:
        return False
    if any(grid.is_blocked(cell) for cell in path.cells):
        return False
    return all(second in grid.neighbors(first) for first, second in zip(path.cells, path.cells[1:]))


# Inputs: selected GridPlanner, stopped estimated Pose, Boolean gate decision.
# Returns: ordered goals, path cell count, and error text (None on success).
# On failure, goals is None and the error is "no_route" or "invalid_path".
def plan_return(planner, pose, blocked):
    arena = MISSION_MAP.with_feature_blocked(GATE_FEATURE, blocked)  # Update the gate in a copy of the known map.
    grid = OccupancyGrid.from_arena(arena, GRID_RESOLUTION_MM, CLEARANCE_MM)  # Mark cells blocked by expanded obstacles.
    if grid.column_count * grid.row_count > MAXIMUM_GRID_CELLS:
        raise ValueError("Use at most {} cells for the return map".format(MAXIMUM_GRID_CELLS))
    start = grid.world_to_cell(pose.x_mm, pose.y_mm)
    goal = grid.world_to_cell(HOME.x_mm, HOME.y_mm)
    path = planner.plan(grid, start, goal)
    if path is None:
        return None, 0, "no_route"
    if not valid_path(grid, start, goal, path):
        return None, 0, "invalid_path"
    goals = list(path.to_goals(grid))  # Convert grid-cell centers to navigation goals.
    goals[-1] = HOME  # Finish at the exact home pose, not its grid-cell center.
    return goals, len(path.cells), None
