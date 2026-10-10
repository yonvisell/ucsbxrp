# Hardware-free checks call student classes directly, regardless of Run selectors.
from sensor_processor import SensorProcessor
from wheel_speed_controller import WheelSpeedController
from differential_drive import DifferentialDrive
from odometry import Odometry
from navigation_controller import NavigationController
from grid_planner import GridPlanner
from visit_order_planner import VisitOrderPlanner
from ucsb_xrp.component_checks import run_component_checks


def check_visit_order_planner():
    run_component_checks(visit_order_planner=VisitOrderPlanner)


run_component_checks(
    SensorProcessor, WheelSpeedController, DifferentialDrive, Odometry,
    NavigationController, GridPlanner, VisitOrderPlanner, include_range=True,
)
