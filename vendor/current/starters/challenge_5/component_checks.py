"""Run concrete, hardware-free examples for the Challenge 5 components.

Select Test components in the IDE. PASS means the example result is correct,
PENDING means a method still raises NotImplementedError, and FAIL includes the
specific behavior to inspect. include_range adds the ultrasound examples.
These checks do not start the virtual or physical robot.
"""

from differential_drive import DifferentialDrive
from grid_planner import GridPlanner
from navigation_controller import NavigationController
from odometry import Odometry
from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks


run_component_checks(
    SensorModel,
    WheelSpeedController,
    DifferentialDrive,
    Odometry,
    NavigationController,
    GridPlanner,
    include_range=True,
)
