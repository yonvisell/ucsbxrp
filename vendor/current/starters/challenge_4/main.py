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
from ucsb_xrp import OccupancyGrid


def run_challenge():
    # Plan and follow the mapped route, or report that no route exists.
    # The occupancy grid accounts for the robot clearance around each obstacle.
    grid = OccupancyGrid.from_arena(ARENA_MAP, GRID_RESOLUTION_MM, CLEARANCE_MM)
    path = make_grid_planner().plan(
        grid,
        grid.world_to_cell(INITIAL_POSE.x_mm, INITIAL_POSE.y_mm),
        grid.world_to_cell(DESTINATION.x_mm, DESTINATION.y_mm),
    )
    if path is None:
        print("No route to the destination")
        return None

    robot = make_robot(ROBOT_CONFIG)
    navigation = make_navigation_controller(NAVIGATION_CONFIG)
    try:
        state = robot.start(INITIAL_POSE)
        navigation.start(path.to_goals(grid, DESTINATION.heading_rad))
        while not navigation.is_complete():
            state = robot.step(navigation.update(state.pose))
        print("Challenge 4 complete")
        print("path_cells:", len(path.cells))
        print("final_pose:", state.pose)
        return state
    # Always stop the motors, including when an error ends the program.
    finally:
        robot.stop()


run_challenge()
