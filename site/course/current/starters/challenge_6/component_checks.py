# Hardware-free checks call student classes directly, regardless of Run selectors.
from sensor_processor import SensorProcessor
from wheel_speed_controller import WheelSpeedController
from differential_drive import DifferentialDrive
from odometry import Odometry
from navigation_controller import NavigationController
from grid_planner import GridPlanner
from range_safety_controller import RangeSafetyController
from ucsb_xrp.component_checks import run_component_checks


def check_range_safety_controller():
    run_component_checks(range_safety_controller=RangeSafetyController)


run_component_checks(
    SensorProcessor, WheelSpeedController, DifferentialDrive, Odometry,
    NavigationController, GridPlanner, RangeSafetyController, include_range=True,
)
