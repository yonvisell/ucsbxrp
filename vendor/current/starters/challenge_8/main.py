# Challenge 8: choose and execute a least-cost multi-stop service route.

from challenge import (
    ARENA_MAP,
    CLEARANCE_MM,
    GRID_RESOLUTION_MM,
    INITIAL_POSE,
    MAXIMUM_NAVIGATION_STEPS,
    NODE_NAMES,
    SERVICE_STOPS,
)
from course_setup import (
    make_navigation_controller,
    make_robot,
    make_route_cost_grid_planner,
    make_visit_order_planner,
)
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import NavigationGoal, OccupancyGrid


def build_pairwise_paths(grid, goals):
    planner = make_route_cost_grid_planner()
    cells = tuple(grid.world_to_cell(goal.x_mm, goal.y_mm) for goal in goals)
    paths = {}
    costs = []
    for start_index in range(len(goals)):
        row = []
        for finish_index in range(len(goals)):
            path = planner.plan(grid, cells[start_index], cells[finish_index])
            paths[(start_index, finish_index)] = path
            row.append(None if path is None else len(path.cells) - 1)
        costs.append(tuple(row))
    return tuple(costs), paths


class RouteSegment:
    """One endpoint-to-endpoint path with retained service metadata."""

    __slots__ = (
        "route_position",
        "start_index",
        "finish_index",
        "start_name",
        "finish_name",
        "path",
        "planned_transitions",
        "service_name",
    )

    def __init__(
        self,
        route_position,
        start_index,
        finish_index,
        path,
        required_indices,
    ):
        self.route_position = route_position
        self.start_index = start_index
        self.finish_index = finish_index
        self.start_name = NODE_NAMES[start_index]
        self.finish_name = NODE_NAMES[finish_index]
        self.path = path
        self.planned_transitions = len(path.cells) - 1
        self.service_name = (
            self.finish_name if finish_index in required_indices else None
        )


class ServiceArrival:
    """An explicit service event emitted after its route segment completes."""

    __slots__ = ("name", "node_index", "route_position", "pose")

    def __init__(self, segment, pose):
        self.name = segment.service_name
        self.node_index = segment.finish_index
        self.route_position = segment.route_position
        self.pose = pose


def validate_order(order, start_index, required_indices, finish_index):
    if not isinstance(order, (tuple, list)):
        raise RuntimeError("VisitOrderPlanner must return a tuple, list, or None")
    order = tuple(order)
    if len(order) != len(required_indices) + 2:
        raise RuntimeError("VisitOrderPlanner returned the wrong number of nodes")
    if order[0] != start_index or order[-1] != finish_index:
        raise RuntimeError("VisitOrderPlanner changed the start or finish node")
    planned_services = order[1:-1]
    if (
        len(set(planned_services)) != len(planned_services)
        or set(planned_services) != set(required_indices)
    ):
        raise RuntimeError("VisitOrderPlanner must include each required stop once")
    return order


def build_route_segments(order, paths, required_indices):
    segments = []
    for route_position in range(len(order) - 1):
        start_index = order[route_position]
        finish_index = order[route_position + 1]
        path = paths[(start_index, finish_index)]
        if path is None:
            raise RuntimeError("Selected order contains a disconnected segment")
        segments.append(
            RouteSegment(
                route_position,
                start_index,
                finish_index,
                path,
                required_indices,
            )
        )
    return tuple(segments)


def assert_service_arrivals(arrivals, planned_service_indices):
    observed = tuple(arrival.node_index for arrival in arrivals)
    if observed != tuple(planned_service_indices):
        raise RuntimeError("Service arrival events do not match the planned order")
    for required_index in planned_service_indices:
        if observed.count(required_index) != 1:
            raise RuntimeError("Each required stop must be serviced exactly once")


def run_challenge():
    grid = OccupancyGrid.from_arena(ARENA_MAP, GRID_RESOLUTION_MM, CLEARANCE_MM)
    goals = (
        NavigationGoal(INITIAL_POSE.x_mm, INITIAL_POSE.y_mm),
    ) + SERVICE_STOPS
    cost_table, paths = build_pairwise_paths(grid, goals)
    required_indices = (1, 2, 3)
    order = make_visit_order_planner().plan(cost_table, 0, required_indices, 0)
    if order is None:
        print("Challenge 8 result: no complete service route")
        return None

    order = validate_order(order, 0, required_indices, 0)
    segments = build_route_segments(order, paths, required_indices)
    planned_transitions = sum(
        segment.planned_transitions for segment in segments
    )
    planned_service_indices = order[1:-1]
    print(
        "planned_service_order:",
        tuple(NODE_NAMES[index] for index in planned_service_indices),
    )
    navigation = make_navigation_controller(NAVIGATION_CONFIG)
    robot = make_robot(ROBOT_CONFIG)
    arrivals = []
    remaining_steps = MAXIMUM_NAVIGATION_STEPS
    try:
        state = robot.start(INITIAL_POSE)
        for segment_index, segment in enumerate(segments):
            final_heading = (
                INITIAL_POSE.heading_rad
                if segment_index == len(segments) - 1
                else None
            )
            navigation.start(segment.path.to_goals(grid, final_heading))
            while not navigation.is_complete():
                if remaining_steps <= 0:
                    raise RuntimeError(
                        "Multi-stop navigation exceeded its step limit"
                    )
                state = robot.step(navigation.update(state.pose))
                remaining_steps -= 1

            # Service is this explicit endpoint-arrival event. Passing through
            # another stop's grid cell inside the segment does not service it.
            if segment.service_name is not None:
                arrival = ServiceArrival(segment, state.pose)
                arrivals.append(arrival)
                print("service_arrival:", arrival.name)

        assert_service_arrivals(arrivals, planned_service_indices)
        print("Challenge 8 complete")
        print("visit_order:", tuple(NODE_NAMES[index] for index in order))
        print("service_arrivals:", tuple(arrival.name for arrival in arrivals))
        print("planned_cell_transitions:", planned_transitions)
        print("final_pose:", state.pose)
        return state
    finally:
        robot.stop()


run_challenge()
