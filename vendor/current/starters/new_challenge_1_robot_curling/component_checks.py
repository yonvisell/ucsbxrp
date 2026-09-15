# Test the Challenge 1 component classes without starting either robot.
# In the IDE, select Test components. Each check names the class and method,
# example input, required result, and observed result.
# PASS means the example matched. NOT IMPLEMENTED means a named method still
# needs code. FAIL means the method ran but its result was incorrect.

from sensor_model import SensorModel
from wheel_speed_controller import WheelSpeedController

from ucsb_xrp.component_checks import run_component_checks


run_component_checks(SensorModel, WheelSpeedController)
