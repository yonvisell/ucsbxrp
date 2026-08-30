# Challenge 5: observe the gate, plan, and complete the delivery.

from challenge import DELIVERY_TASK, MAXIMUM_NAVIGATION_STEPS
from course_setup import make_grid_planner, make_navigation_controller, make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import DeliveryMission, OccupancyGrid, wrap_angle_rad


def delivery_evidence_error(state):
    """Check mission completion independently of the navigator's flag."""
    grid = OccupancyGrid.from_arena(
        DELIVERY_TASK.arena,
        DELIVERY_TASK.grid_resolution_mm,
        DELIVERY_TASK.clearance_mm,
    )
    destination_cell = grid.world_to_cell(
        DELIVERY_TASK.destination.x_mm,
        DELIVERY_TASK.destination.y_mm,
    )
    final_cell = grid.world_to_cell(state.pose.x_mm, state.pose.y_mm)
    if final_cell != destination_cell:
        return "final pose is outside the destination grid cell"
    requested_heading = DELIVERY_TASK.destination.heading_rad
    if requested_heading is not None:
        heading_error = wrap_angle_rad(requested_heading - state.pose.heading_rad)
        if abs(heading_error) > NAVIGATION_CONFIG.heading_tolerance_rad:
            return "final heading is outside the configured tolerance"
    return None


def run_challenge():
    # Run the observed-map delivery and return its final RobotState.
    mission = DeliveryMission(
        DELIVERY_TASK,
        make_navigation_controller(NAVIGATION_CONFIG),
        make_grid_planner(),
        maximum_navigation_steps=MAXIMUM_NAVIGATION_STEPS,
    )
    state = mission.run(make_robot(ROBOT_CONFIG))
    print("range_estimate_mm:", mission.range_estimate_mm)
    print(
        "map_decision:",
        "{}={}".format(
            DELIVERY_TASK.observed_feature_name,
            "blocked" if mission.feature_blocked else "open",
        ),
    )
    print(
        "planned_path_cells:",
        None if mission.planned_path is None else len(mission.planned_path.cells),
    )
    print(
        "navigation_steps: {}/{}".format(
            mission.navigation_step_count,
            mission.maximum_navigation_steps,
        )
    )

    invalid_reason = None
    if mission.result == "delivered":
        invalid_reason = delivery_evidence_error(state)
        if invalid_reason is None:
            print("delivery_evidence: destination cell and final heading reached")
    result = "delivery_incomplete" if invalid_reason is not None else mission.result
    print("Challenge 5 result:", result)
    if invalid_reason is not None:
        print("delivery_evidence:", invalid_reason)
    print("final_pose:", state.pose)
    if invalid_reason is not None:
        raise RuntimeError(
            "DeliveryMission reported delivery without destination evidence"
        )
    return state


run_challenge()
