# Supplied circle trial. Change the task in challenge.py and the selected classes in robot_setup.py.

from math import pi

from challenge import CIRCLE_DIAMETER_MM, FORWARD_SPEED_MM_S, INITIAL_POSE, TURN_RATE_RAD_S
from robot_setup import ROBOT_CONFIG, make_robot
from ucsb_xrp import MotionCommand


robot = make_robot(ROBOT_CONFIG)  # Assemble the selected sensor and differential-drive classes with supplied wheel control.
command = MotionCommand(FORWARD_SPEED_MM_S, TURN_RATE_RAD_S)  # Request constant axle-midpoint speed [mm/s] and turn rate [rad/s].
travel_mm = 0.0  # Accumulate the axle midpoint's travel from the mean of the two wheel increments [mm].

try:
    robot.start(INITIAL_POSE)  # Reset encoder measurements and the supplied pose estimate at the start of this run.
    while travel_mm < pi * CIRCLE_DIAMETER_MM:  # End when the encoders report one requested circumference [mm].
        state = robot.step(command)  # Measure wheel motion and apply this sample's left/right speed requests.
        measurements = state.measurements
        travel_mm += (measurements.left_increment_mm + measurements.right_increment_mm) / 2.0  # Average wheel travel to obtain axle-midpoint travel [mm].
finally:
    robot.stop()  # Remove both motor efforts after completion, Stop, or a program error.

print("Circle complete")
print("axle_travel_mm:", travel_mm)
