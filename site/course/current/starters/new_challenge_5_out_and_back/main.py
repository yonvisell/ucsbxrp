# Follow a known outbound corridor, observe, then plan the return.
from challenge import INITIAL_POSE, OUTBOUND_ROUTE
from challenge import RANGE_SAMPLE_COUNT, MINIMUM_USABLE_RANGE_COUNT, RANGE_COLLECTION_TIMEOUT_S
from challenge import BLOCKED_RANGE_THRESHOLD_MM
from course_setup import make_grid_planner, make_navigation_controller, make_robot
from live_variables import publish_phase, report_result, publish_return_path_cells
from mission_policy import observed_gate
from mission_steps import follow_route
from return_route import plan_return
from stationary_observation import wait_until_stationary
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import elapsed_time_s

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
        report_result("outbound_" + result)
    else:
        publish_phase("stopping")
        state, stationary = wait_until_stationary(robot, state)
        if not stationary:
            report_result("failed_stationary_check")
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
                report_result("unusable_range")
            else:
                publish_phase("plan_return")
                robot.stop()
                # The stopped pose and gate decision determine the return route.
                goals, path_cell_count, path_error = plan_return(make_grid_planner(), state.pose, blocked)
                if path_error is not None:
                    report_result(path_error)
                else:
                    print("gate_blocked:", blocked, "return_path_cells:", path_cell_count)
                    publish_return_path_cells(path_cell_count)
                    publish_phase("return")
                    return_start_ms = state.measurements.time_ms
                    state, result = follow_route(robot, navigation, state, goals)
                    robot.stop()
                    report_result("complete" if result == "arrived" else "return_" + result)
                    print("return_time_s:", elapsed_time_s(state.measurements.time_ms, return_start_ms))
                    print("estimated_final_pose:", state.pose)
finally:  # Stop the motors on completion, a Python error, or cooperative Stop.
    robot.stop()
