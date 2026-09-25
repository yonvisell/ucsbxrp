# Challenge 4: plan and follow a route around known obstacles.

from challenge import WORLD, ARENA_MAP, INITIAL_POSE, DESTINATION
from challenge import GRID_RESOLUTION_MM, CLEARANCE_MM, MAXIMUM_GRID_CELLS
from challenge import EXECUTE_ROUTE
from course_setup import make_grid_planner, make_navigation_controller, make_robot
from grid_display import print_grid
from live_variables import publish_navigation_steps
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG, apply_navigation_controls
from route_validation import goal_is_reached, path_error
from ucsb_xrp import OccupancyGrid


print("World:", WORLD.label)
# Convert arena geometry to clearance-aware cells before planning.
grid = OccupancyGrid.from_arena(ARENA_MAP, GRID_RESOLUTION_MM, CLEARANCE_MM)
if grid.column_count * grid.row_count > MAXIMUM_GRID_CELLS:
    raise ValueError("The map exceeds {} cells. Increase GRID_RESOLUTION_MM in challenge.py.".format(MAXIMUM_GRID_CELLS))
# Planner endpoints are cells; the route execution later uses world coordinates.
start = grid.world_to_cell(INITIAL_POSE.x_mm, INITIAL_POSE.y_mm)
goal = grid.world_to_cell(DESTINATION.x_mm, DESTINATION.y_mm)
path = make_grid_planner().plan(grid, start, goal)
if path is None:
    print_grid(grid, start, goal)
    print("Challenge 4: result=no_path")
else:
    # Reject an unconnected, blocked, or misplaced path before motion is enabled.
    invalid_reason = path_error(grid, start, goal, path)
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
            # Use cell centers along the route but the exact destination marker.
            goals = list(path.to_goals(grid))
            goals[-1] = DESTINATION

            # Construct the robot from this project's configured components.
            robot = make_robot(ROBOT_CONFIG)
            navigation = make_navigation_controller(NAVIGATION_CONFIG)
            step_count = 0
            try:
                # Start establishes the initial pose and encoder/time measurement origins.
                state = robot.start(INITIAL_POSE)
                navigation.start(goals)
                # Recompute the motion request from each new odometry pose.
                while not navigation.is_complete():
                    publish_navigation_steps(step_count)
                    apply_navigation_controls(navigation)
                    state = robot.step(navigation.update(state.pose))
                    step_count += 1

                # Verify destination tolerance separately from controller status.
                result = (
                    "complete"
                    if goal_is_reached(state.pose, DESTINATION, navigation.config)
                    else "destination_not_reached"
                )
                print(
                    "Challenge 4: result={} path_cells={} navigation_steps={} "
                    "final_pose={}".format(
                        result, len(path.cells), step_count, state.pose
                    )
                )
                if result != "complete":
                    raise RuntimeError("Navigation finished before the destination was reached")
            finally:  # Stop the motors whenever route execution exits.
                robot.stop()
