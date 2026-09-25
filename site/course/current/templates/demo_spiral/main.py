# Drive an expanding spiral and stop before a nearby obstacle.

from math import pi

from challenge import INITIAL_POSE, OBSTACLE_STOP_MM, SPIRAL_EXPANSION_MM
from course_setup import make_robot
from live_variables import FORWARD_SPEED, WINDING_RATE, publish_spiral_values
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND


# Continue until an obstacle is near or the operator presses Stop.
robot = make_robot(ROBOT_CONFIG)
try:  # Run the motion; the finally block below stops it when this block exits.
    # Start establishes the initial pose and encoder/time measurement origins.
    state = robot.start(INITIAL_POSE)

    # Check the range once before applying a moving command.
    state = robot.step(STOP_COMMAND, read_range=True)
    travel_mm = 0.0

    # Continue the expanding path while the latest range permits motion.
    while True:
        range_mm = state.measurements.range_mm
        # None means no usable echo; it does not mean an obstacle is close.
        if range_mm is not None and range_mm <= OBSTACLE_STOP_MM:
            result = "Obstacle detected; spiral stopped"
            break

        speed_mm_s = FORWARD_SPEED.value
        revolutions_per_mm = WINDING_RATE.value / 1000.0
        expansion = 1.0 + travel_mm / SPIRAL_EXPANSION_MM
        # Convert revolutions per millimeter into yaw rate in radians per second.
        turn_rate_rad_s = 2.0 * pi * speed_mm_s * revolutions_per_mm / expansion

        publish_spiral_values(travel_mm, turn_rate_rad_s)

        state = robot.step(MotionCommand(speed_mm_s, turn_rate_rad_s), read_range=True)
        # The mean signed wheel increment estimates travel of the axle center.
        measurements = state.measurements
        travel_mm += abs((measurements.left_increment_mm + measurements.right_increment_mm) / 2.0)
finally:  # Stop motors whenever this motion block exits.
    robot.stop()
print(result)
print("final_pose:", state.pose)
