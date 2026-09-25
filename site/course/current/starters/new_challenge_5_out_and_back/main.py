# Follow a known outbound corridor, observe, then plan the return.
from challenge import INITIAL_POSE, OUTBOUND_ROUTE, HOME
from challenge import STATIONARY_DURATION_S, STATIONARY_SPEED_MM_S, MAXIMUM_STOP_WAIT_S
from challenge import RANGE_SAMPLE_COUNT, MINIMUM_USABLE_RANGE_COUNT, RANGE_COLLECTION_TIMEOUT_S
from challenge import BLOCKED_RANGE_THRESHOLD_MM, GATE_FEATURE
from challenge import MISSION_MAP, GRID_RESOLUTION_MM, CLEARANCE_MM, MAXIMUM_GRID_CELLS
from course_setup import make_grid_planner, make_navigation_controller, make_robot
from live_variables import publish_phase, publish_result, publish_return_path_cells
from mission_policy import observed_gate
from mission_steps import follow_route, valid_path
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import OccupancyGrid, STOP_COMMAND, elapsed_time_s

# Report each route or observation result through one named output path.
def report(result):
    publish_result(result)
    print("Out-and-Back: result=" + result)


# The same selected sensing, navigation, and planning components serve both legs.
robot = make_robot(ROBOT_CONFIG)
navigation = make_navigation_controller(NAVIGATION_CONFIG)
try:
    # World pose initializes odometry; the outbound route is known in advance.
    state = robot.start(INITIAL_POSE)
    publish_phase("outbound")
    state, result = follow_route(robot, navigation, state, OUTBOUND_ROUTE)
    robot.stop()
    if result != "arrived":
        report("outbound_" + result)
    else:
        publish_phase("stopping")
        # Require continuous low wheel speed before taking a range observation.
        stationary_s = 0.0
        waiting_for_stop_start_ms = state.measurements.time_ms
        while stationary_s < STATIONARY_DURATION_S and elapsed_time_s(
            state.measurements.time_ms, waiting_for_stop_start_ms
        ) <= MAXIMUM_STOP_WAIT_S:
            state = robot.step(STOP_COMMAND)
            speeds = state.measurements.wheel_speeds
            if max(abs(speeds.left_mm_s), abs(speeds.right_mm_s)) <= STATIONARY_SPEED_MM_S:
                stationary_s += state.measurements.dt_s
            else:
                stationary_s = 0.0
        if stationary_s < STATIONARY_DURATION_S:
            report("failed_stationary_check")
        else:
            publish_phase("observe")
            # Distinct range attempts are combined only after the robot stops.
            samples = robot.collect_range_samples(RANGE_SAMPLE_COUNT, timeout_s=RANGE_COLLECTION_TIMEOUT_S)
            state = robot.state
            estimate_mm = robot.estimate_range(samples, MINIMUM_USABLE_RANGE_COUNT)
            blocked = observed_gate(estimate_mm, BLOCKED_RANGE_THRESHOLD_MM)
            print("stationary_range_samples_mm:", samples)
            print("range_estimate_mm:", estimate_mm)
            if blocked is None:
                report("unusable_range")
            else:
                publish_phase("plan_return")
                robot.stop()
                # Only the named gate changes in the known return map.
                arena = MISSION_MAP.with_feature_blocked(GATE_FEATURE, blocked)
                # Convert arena geometry to clearance-aware cells before planning.
                grid = OccupancyGrid.from_arena(arena, GRID_RESOLUTION_MM, CLEARANCE_MM)
                if grid.column_count * grid.row_count > MAXIMUM_GRID_CELLS:
                    raise ValueError("Use at most {} cells for the return map".format(MAXIMUM_GRID_CELLS))
                # Plan from the estimated stopped pose to the fixed home marker.
                start = grid.world_to_cell(state.pose.x_mm, state.pose.y_mm)
                goal = grid.world_to_cell(HOME.x_mm, HOME.y_mm)
                path = make_grid_planner().plan(grid, start, goal)
                if path is None:
                    report("no_route")
                elif not valid_path(grid, start, goal, path):
                    report("invalid_path")
                else:
                    print("gate_blocked:", blocked, "return_path_cells:", len(path.cells))
                    publish_return_path_cells(len(path.cells))
                    # Replace the last cell center with the exact home goal.
                    goals = list(path.to_goals(grid))
                    goals[-1] = HOME
                    publish_phase("return")
                    return_start_ms = state.measurements.time_ms
                    state, result = follow_route(robot, navigation, state, goals)
                    robot.stop()
                    report("complete" if result == "arrived" else "return_" + result)
                    print("return_time_s:", elapsed_time_s(state.measurements.time_ms, return_start_ms))
                    print("estimated_final_pose:", state.pose)
finally:  # Stop the motors on completion, a Python error, or cooperative Stop.
    robot.stop()
