# Test Challenge 8 components without starting either robot.

from differential_drive import DifferentialDrive
from grid_planner import GridPlanner
from navigation_controller import NavigationController
from odometry import Odometry
from sensor_model import SensorModel
from visit_order_planner import VisitOrderPlanner
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks
from ucsb_xrp.student_api import VisitOrderPlannerBase


run_component_checks(
    SensorModel,
    WheelSpeedController,
    DifferentialDrive,
    Odometry,
    NavigationController,
    GridPlanner,
    include_range=True,
)


def check_visit_order_planner():
    print("VisitOrderPlanner.plan")
    asymmetric = (
        (0, 9, 1, 8, 7),
        (6, 0, 5, 7, 4),
        (9, 2, 0, 8, 8),
        (1, 9, 9, 0, 5),
        (8, 9, 9, 1, 0),
    )
    one_reachable_order = (
        (0, None, None, 1, None),
        (None, 0, None, None, None),
        (None, None, 0, None, 1),
        (None, None, None, 0, None),
        (1, None, None, None, 0),
    )
    all_ties = (
        (0, 1, 1, 1, 1),
        (1, 0, 1, 1, 1),
        (1, 1, 0, 1, 1),
        (1, 1, 1, 0, 1),
        (1, 1, 1, 1, 0),
    )
    no_complete_order = (
        (0, 1, None, None),
        (None, 0, 1, None),
        (None, None, 0, None),
        (None, None, None, 0),
    )
    planner = VisitOrderPlanner()
    try:
        if not isinstance(planner, VisitOrderPlannerBase):
            print("FAIL VisitOrderPlanner does not implement its required Base")
            return

        observed = planner.plan(asymmetric, 4, (2, 0, 3), 1)
        print("OBSERVED asymmetric", observed)
        if observed != (4, 3, 0, 2, 1):
            print("FAIL VisitOrderPlanner directed costs or nonzero finish")
            return

        observed = planner.plan(one_reachable_order, 2, (0, 4), 3)
        print("OBSERVED missing segments", observed)
        if observed != (2, 4, 0, 3):
            print("FAIL VisitOrderPlanner skipped the only reachable order")
            return

        observed = planner.plan(all_ties, 4, (3, 1, 2), 0)
        print("OBSERVED tied orders", observed)
        if observed != (4, 1, 2, 3, 0):
            print("FAIL VisitOrderPlanner lexicographic tie break")
            return

        observed = planner.plan(no_complete_order, 0, (1, 2), 3)
        print("OBSERVED disconnected", observed)
        if observed is not None:
            print("FAIL VisitOrderPlanner disconnected result")
            return

        try:
            planner.plan(asymmetric, 4, (2, 2, 3), 1)
        except ValueError:
            pass
        else:
            print("FAIL VisitOrderPlanner accepted duplicate stops")
            return
    except NotImplementedError as error:
        print("NOT IMPLEMENTED", error)
        return
    except Exception as error:
        print("FAIL VisitOrderPlanner", type(error).__name__, error)
        return
    print("PASS VisitOrderPlanner")


check_visit_order_planner()
