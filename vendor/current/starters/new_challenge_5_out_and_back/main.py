"""Follow a known outbound corridor, observe, then plan the return."""
from challenge import (
    BLOCKED_RANGE_THRESHOLD_MM,
    CLEARANCE_MM,
    GRID_RESOLUTION_MM,
    HOME,
    INITIAL_POSE,
    MAXIMUM_LEG_TIME_S,
    MINIMUM_USABLE_RANGE_COUNT,
    MISSION_MAP,
    OUTBOUND_ROUTE,
    RANGE_SAMPLE_COUNT,
)
from course_setup import make_grid_planner, make_navigation_controller, make_robot
from mission_policy import observed_gate
from mission_steps import follow_route, valid_path
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import MotionCommand, OccupancyGrid, elapsed_time_s, live

STOP = MotionCommand(0.0, 0.0)

def report(result):
    live.watch("mission_result", result)
    print("Out-and-Back: result=" + result)

def run_challenge():
    robot = make_robot(ROBOT_CONFIG)
    navigation = make_navigation_controller(NAVIGATION_CONFIG)
    try:
        state = robot.start(INITIAL_POSE)
        live.watch("mission_phase", "outbound")
        state, result = follow_route(robot, navigation, state, OUTBOUND_ROUTE, MAXIMUM_LEG_TIME_S)
        robot.stop()
        if result != "arrived":
            report("outbound_" + result)
            return state
        live.watch("mission_phase", "settling")
        stationary_s = 0.0
        settling_start_ms = state.measurements.time_ms
        while stationary_s < 0.3:
            state = robot.step(STOP)
            speeds = state.measurements.wheel_speeds
            if max(abs(speeds.left_mm_s), abs(speeds.right_mm_s)) <= 5.0:
                stationary_s += state.measurements.dt_s
            else:
                stationary_s = 0.0
            if elapsed_time_s(state.measurements.time_ms, settling_start_ms) > 3.0:
                report("failed_stationary_check")
                return state
        live.watch("mission_phase", "observe")
        samples = []
        for _ in range(RANGE_SAMPLE_COUNT):
            state = robot.step(STOP, read_range=True)
            samples.append(state.measurements.range_mm)
        estimate_mm = robot.estimate_range(samples, MINIMUM_USABLE_RANGE_COUNT)
        blocked = observed_gate(estimate_mm, BLOCKED_RANGE_THRESHOLD_MM)
        print("stationary_range_samples_mm:", samples)
        print("range_estimate_mm:", estimate_mm)
        if blocked is None:
            report("unusable_range")
            return state
        live.watch("mission_phase", "plan_return")
        robot.stop()
        arena = MISSION_MAP.with_feature_blocked("center_gate", blocked)
        grid = OccupancyGrid.from_arena(arena, GRID_RESOLUTION_MM, CLEARANCE_MM)
        if grid.column_count * grid.row_count > 1024:
            raise ValueError("Use at most 1024 cells for the return map")
        start = grid.world_to_cell(state.pose.x_mm, state.pose.y_mm)
        goal = grid.world_to_cell(HOME.x_mm, HOME.y_mm)
        path = make_grid_planner().plan(grid, start, goal)
        if path is None:
            report("no_route")
            return state
        if not valid_path(grid, start, goal, path):
            report("invalid_path")
            return state
        print("gate_blocked:", blocked, "return_path_cells:", len(path.cells))
        live.watch("return_path_cells", len(path.cells))
        goals = list(path.to_goals(grid))
        goals[-1] = HOME
        live.watch("mission_phase", "return")
        return_start_ms = state.measurements.time_ms
        state, result = follow_route(robot, navigation, state, goals, MAXIMUM_LEG_TIME_S)
        robot.stop()
        report("complete" if result == "arrived" else "return_" + result)
        print("return_time_s:", elapsed_time_s(state.measurements.time_ms, return_start_ms))
        print("estimated_final_pose:", state.pose)
        return state
    finally:  # Stop the motors after normal completion or a Python exception.
        robot.stop()

run_challenge()
