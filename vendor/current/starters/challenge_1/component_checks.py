"""Run concrete, hardware-free examples for the Challenge 1 components.

Select Test components in the IDE. PASS means the example result is correct,
PENDING means a method still raises NotImplementedError, and FAIL includes the
specific behavior to inspect. These checks do not start the virtual or physical robot.
"""

from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks


run_component_checks(SensorModel, WheelSpeedController)
