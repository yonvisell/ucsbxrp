# Supplied circle trial. Set diameter and direction in challenge.py.

from math import pi

from challenge import CIRCLE_DIAMETER_MM, FORWARD_SPEED_MM_S, INITIAL_POSE, TURN_RATE_RAD_S
from robot_setup import ROBOT_CONFIG, make_robot
from ucsb_xrp import MotionCommand


robot = make_robot(ROBOT_CONFIG)  # Assemble the classes selected in robot_setup.py.
command = MotionCommand(FORWARD_SPEED_MM_S, TURN_RATE_RAD_S)  # Hold forward speed and steering rate constant.
travel_mm = 0.0  # Measure axle-midpoint travel [mm].

try:
    robot.start(INITIAL_POSE)  # Reset wheel travel and start the trial.
    while travel_mm < pi * CIRCLE_DIAMETER_MM:  # Stop after one circumference of measured travel.
        state = robot.step(command)  # Read the sensors and update motor commands.
        measurements = state.measurements
        travel_mm += (measurements.left_increment_mm + measurements.right_increment_mm) / 2.0  # Add the mean wheel increment [mm].
finally:
    robot.stop()  # Stop both motors.

print("Circle complete")
print("axle_travel_mm:", travel_mm)
