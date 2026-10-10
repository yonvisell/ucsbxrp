# Hardware-free checks call student classes directly, regardless of Run selectors.
from sensor_processor import SensorProcessor
from wheel_speed_controller import WheelSpeedController
from differential_drive import DifferentialDrive
from odometry import Odometry
from navigation_controller import NavigationController
from grid_planner import GridPlanner
from pose_corrector import PoseCorrector
from ucsb_xrp.component_checks import run_component_checks


def check_pose_corrector():
    run_component_checks(pose_corrector=PoseCorrector)


run_component_checks(
    SensorProcessor, WheelSpeedController, DifferentialDrive, Odometry,
    NavigationController, GridPlanner, PoseCorrector, include_range=True,
)
