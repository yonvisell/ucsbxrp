# Test the Challenge 3 component classes without starting either robot.
# In the IDE, select Test components. Each check states the component's use,
# example input, required result, and observed result.
# PASS means the example matched. NOT IMPLEMENTED means a named method still
# needs code. FAIL means the method ran but its result was incorrect.

from differential_drive import DifferentialDrive
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
)
