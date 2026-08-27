"""Run concrete, hardware-free examples of Challenge 5 student classes.

Select Test components in the IDE. PASS means an example produced its expected
result. An unfinished method is identified separately. FAIL names the behavior
and received result to inspect. The range option adds ultrasonic examples.
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
