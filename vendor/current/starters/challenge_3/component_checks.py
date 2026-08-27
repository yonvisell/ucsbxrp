"""Check the Challenge 3 student-owned component classes without moving a robot.

Select Test components in the IDE. PASS means an example produced its expected
result. NOT IMPLEMENTED means a method still raises NotImplementedError. FAIL
names the behavior and received result to inspect.

The imports below are the classes in this project. The supplied checker calls
each class with small labeled input examples and prints the expected and
observed values.
"""

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
