# Print ten stationary pairs of floor-sensor readings.

from challenge import INITIAL_POSE
from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from ucsb_xrp import STOP_COMMAND


robot = make_robot(ROBOT_CONFIG)
try:
    robot.start(INITIAL_POSE, read_reflectance=True)
    for _ in range(10):
        state = robot.step(STOP_COMMAND, read_reflectance=True)
        print(state.measurements.reflectance)
finally:
    robot.stop()
