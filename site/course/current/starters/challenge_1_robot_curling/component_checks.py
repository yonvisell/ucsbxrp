# Test the Challenge 1 component classes without starting either robot.
# In the IDE, select Run code tests. Each check names the class and method,
# example input, required result, and observed result.
# PASS means the example matched. NOT IMPLEMENTED means a named method still
# needs code. FAIL means the method ran but its result was incorrect.

from sensor_processor import SensorProcessor

from ucsb_xrp.component_checks import run_component_checks


print("COVERAGE · These checks exercise SensorProcessor. They do not check stopping_controller() in stopping_controller.py; evaluate that function through your Virtual XRP stopping trials.")

# Exercise the project classes directly, regardless of Run selectors.
run_component_checks(SensorProcessor)
