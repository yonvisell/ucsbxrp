"""Run concrete, hardware-free examples of Challenge 1 student classes.

Select Test components in the IDE. PASS means an example produced its expected
result. NOT IMPLEMENTED means a method still raises NotImplementedError. FAIL
names the behavior and received result to inspect.
These checks do not start the virtual or physical robot.
"""

from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks


run_component_checks(SensorModel, WheelSpeedController)
