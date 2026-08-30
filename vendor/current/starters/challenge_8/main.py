# Challenge 8: choose and execute a least-cost multi-stop service route.

from challenge import (
    ARENA_MAP,
    CLEARANCE_MM,
    FINISH_NODE_INDEX,
    GRID_RESOLUTION_MM,
    INITIAL_POSE,
    NODE_GOALS,
    NODE_NAMES,
    REQUIRED_NODE_INDICES,
    START_NODE_INDEX,
)
from course_setup import (
    make_navigation_controller,
    make_robot,
    make_route_cost_grid_planner,
    make_visit_order_planner,
)
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import OccupancyGrid, distance_to_goal, wrap_angle_rad


def build_pairwise_paths(grid):
    planner = make_route_cost_grid_planner()
    cells = tuple(
        grid.world_to_cell(goal.x_mm, goal.y_mm) for goal in NODE_GOALS
    )
    paths = {}
    costs = []
    for start_index in range(len(NODE_GOALS)):
        row = []
        for finish_index in range(len(NODE_GOALS)):
            path = planner.plan(grid, cells[start_index], cells[finish_index])
            paths[(start_index, finish_index)] = path
            row.append(None if path is None else len(path.cells) - 1)
        costs.append(tuple(row))
    return tuple(costs), paths


def validate_order(order):
    if not isinstance(order, (tuple, list)):
        raise RuntimeError("VisitOrderPlanner must return a tuple, list, or None")
    order = tuple(order)
    if len(order) != len(REQUIRED_NODE_INDICES) + 2:
        raise RuntimeError("VisitOrderPlanner returned the wrong number of nodes")
    if order[0] != START_NODE_INDEX or order[-1] != FINISH_NODE_INDEX:
        raise RuntimeError("VisitOrderPlanner changed the start or finish node")
    services = order[1:-1]
    if len(set(services)) != len(services) or set(services) != set(
        REQUIRED_NODE_INDICES
    ):
        raise RuntimeError("VisitOrderPlanner must include each required stop once")
    return order


def goal_is_reached(pose, goal):
    if distance_to_goal(pose, goal) > NAVIGATION_CONFIG.position_tolerance_mm:
        return False
    if goal.heading_rad is None:
        return True
    heading_error = wrap_angle_rad(goal.heading_rad - pose.heading_rad)
    return abs(heading_error) <= NAVIGATION_CONFIG.heading_tolerance_rad


def run_challenge():
    grid = OccupancyGrid.from_arena(ARENA_MAP, GRID_RESOLUTION_MM, CLEARANCE_MM)
    cost_table, paths = build_pairwise_paths(grid)
    order = make_visit_order_planner().plan(
        cost_table,
        START_NODE_INDEX,
        REQUIRED_NODE_INDICES,
        FINISH_NODE_INDEX,
    )
    if order is None:
        print("Challenge 8: result=no_complete_route")
        return None
    order = validate_order(order)

    robot = make_robot(ROBOT_CONFIG)
    navigation = make_navigation_controller(NAVIGATION_CONFIG)
    serviced = []
    planned_transitions = 0
    try:
        state = robot.start(INITIAL_POSE)
        for start_index, finish_index in zip(order, order[1:]):
            path = paths[(start_index, finish_index)]
            if path is None:
                raise RuntimeError("Selected order contains a disconnected segment")
            planned_transitions += len(path.cells) - 1
            goals = list(path.to_goals(grid))
            goals[-1] = NODE_GOALS[finish_index]
            navigation.start(goals)
            while not navigation.is_complete():
                state = robot.step(navigation.update(state.pose))

            if not goal_is_reached(state.pose, NODE_GOALS[finish_index]):
                print(
                    "Challenge 8: result=endpoint_not_reached endpoint={} "
                    "final_pose={}".format(
                        NODE_NAMES[finish_index], state.pose
                    )
                )
                raise RuntimeError(
                    "Navigation finished before the route endpoint was reached"
                )
            if finish_index in REQUIRED_NODE_INDICES:
                serviced.append(NODE_NAMES[finish_index])

        expected_services = tuple(NODE_NAMES[index] for index in order[1:-1])
        if tuple(serviced) != expected_services:
            raise RuntimeError(
                "Recorded service stops do not match the planned order"
            )
        print(
            "Challenge 8: result=complete visit_order={} serviced={} "
            "planned_cell_transitions={} final_pose={}".format(
                tuple(NODE_NAMES[index] for index in order),
                tuple(serviced),
                planned_transitions,
                state.pose,
            )
        )
        return state
    finally:
        robot.stop()


run_challenge()
