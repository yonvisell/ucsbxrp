# Challenge 4: plan and follow a route around known obstacles.

from challenge import WORLD, ARENA_MAP, INITIAL_POSE, DESTINATION
from challenge import GRID_RESOLUTION_MM, CLEARANCE_MM, MAXIMUM_GRID_CELLS
from challenge import EXECUTE_ROUTE
from course_setup import make_grid_planner, make_navigation_controller, make_robot
from grid_display import print_grid
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from route_runner import run_route
from route_validation import path_error
from ucsb_xrp import OccupancyGrid


print("World:", WORLD.label)
grid = OccupancyGrid.from_arena(ARENA_MAP, GRID_RESOLUTION_MM, CLEARANCE_MM)  # Mark cells blocked by expanded obstacles.
if grid.column_count * grid.row_count > MAXIMUM_GRID_CELLS:
    raise ValueError("The map exceeds {} cells. Increase GRID_RESOLUTION_MM in challenge.py.".format(MAXIMUM_GRID_CELLS))
start = grid.world_to_cell(INITIAL_POSE.x_mm, INITIAL_POSE.y_mm)  # Convert position to a grid column and row.
goal = grid.world_to_cell(DESTINATION.x_mm, DESTINATION.y_mm)
path = make_grid_planner().plan(grid, start, goal)
if path is None:
    print_grid(grid, start, goal)
    print("Challenge 4: result=no_path")
else:
    invalid_reason = path_error(grid, start, goal, path)  # Check endpoints, free cells, and adjacency.
    if invalid_reason is not None:
        print_grid(grid, start, goal)
        print("Challenge 4: result=invalid_path reason={}".format(invalid_reason))
    else:
        print_grid(grid, start, goal, path)
        print("Mapped Route: result=valid_path path_cells={}".format(len(path.cells)))
        print("path:", [(cell.column, cell.row) for cell in path.cells])
        if not EXECUTE_ROUTE:
            print("Path checked. Set EXECUTE_ROUTE = True in challenge.py to drive the route.")
        else:
            goals = list(path.to_goals(grid))  # Convert grid-cell centers to navigation goals.
            goals[-1] = DESTINATION  # Replace the last cell center with the exact destination.
            robot = make_robot(ROBOT_CONFIG)
            navigation = make_navigation_controller(NAVIGATION_CONFIG)
            run_route(robot, navigation, INITIAL_POSE, goals, DESTINATION, len(path.cells))
