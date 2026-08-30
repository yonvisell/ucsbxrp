# Challenge 5: observe the gate, plan, and complete the delivery.

from challenge import DELIVERY_TASK
from course_setup import make_grid_planner, make_navigation_controller, make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import DeliveryMission


def run_challenge():
    mission = DeliveryMission(
        DELIVERY_TASK,
        make_navigation_controller(NAVIGATION_CONFIG),
        make_grid_planner(),
    )
    state = mission.run(make_robot(ROBOT_CONFIG))
    path_cells = (
        None
        if mission.planned_path is None
        else len(getattr(mission.planned_path, "cells", ()))
    )
    if mission.feature_blocked is None:
        map_decision = "unknown"
    elif mission.feature_blocked:
        map_decision = "blocked"
    else:
        map_decision = "open"
    print(
        "Challenge 5: result={} range_mm={} feature={}={} path_cells={} "
        "navigation_steps={} final_pose={}".format(
            mission.result,
            mission.range_estimate_mm,
            DELIVERY_TASK.observed_feature_name,
            map_decision,
            path_cells,
            mission.navigation_step_count,
            state.pose,
        )
    )
    if mission.result in ("invalid_path", "destination_not_reached"):
        raise RuntimeError("Delivery did not produce valid destination evidence")
    return state


run_challenge()
