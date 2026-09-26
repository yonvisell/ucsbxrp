# Print ten stationary pairs of floor-sensor readings.

from challenge import INITIAL_POSE
from robot_setup import make_robot, ROBOT_CONFIG
from ucsb_xrp import STOP_COMMAND


robot = make_robot(ROBOT_CONFIG)
try:  # Run this block, then stop the motors in finally.
    robot.start(INITIAL_POSE, read_reflectance=True)  # Initialize estimated pose; reset measurements; read floor sensors.
    for _ in range(10):  # Collect ten left/right readings at the same position.
        state = robot.step(STOP_COMMAND, read_reflectance=True)  # Request zero motion and read both floor sensors.
        print(state.measurements.reflectance)
finally:
    robot.stop()  # Stop after the readings or an exception.
