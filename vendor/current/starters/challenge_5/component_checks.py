# Check the Challenge 5 student-owned component classes without moving the robot.
# In the IDE, select Test components. PASS means the example returned the
# expected result. NOT IMPLEMENTED identifies a method you still need to write.
# FAIL prints the expected and observed values for you to compare. This check
# also includes ultrasonic range examples.
# The imports below are the classes from this project that will be checked.
# The checker supplies labeled input examples; it does not run either robot.

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
