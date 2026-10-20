# Drive one circle using differential-drive kinematics.

from math import pi

from challenge import CIRCLE_DIAMETER_MM, FORWARD_SPEED_MM_S, INITIAL_POSE
from robot_setup import ROBOT_CONFIG, make_robot
from ucsb_xrp import MotionCommand


robot = make_robot(ROBOT_CONFIG)
command = MotionCommand(FORWARD_SPEED_MM_S, 2.0 * FORWARD_SPEED_MM_S / CIRCLE_DIAMETER_MM)
travel_mm = 0.0

try:
    state = robot.start(INITIAL_POSE)
    while travel_mm < pi * CIRCLE_DIAMETER_MM:
        state = robot.step(command)
        measurements = state.measurements
        travel_mm += (measurements.left_increment_mm + measurements.right_increment_mm) / 2.0
finally:
    robot.stop()

print("Circle complete")
print("axle_travel_mm:", travel_mm)
