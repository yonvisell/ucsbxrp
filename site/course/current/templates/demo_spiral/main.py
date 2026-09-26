# Drive an expanding spiral and stop before a nearby obstacle.

from math import pi

from challenge import INITIAL_POSE, OBSTACLE_STOP_MM, SPIRAL_EXPANSION_MM
from robot_setup import make_robot
from live_variables import FORWARD_SPEED, WINDING_RATE, publish_spiral_values
from robot_setup import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND


robot = make_robot(ROBOT_CONFIG)
try:  # Ensure finally stops motors on exit.
    state = robot.start(INITIAL_POSE)  # Initialize estimated pose; reset measurements.

    state = robot.step(STOP_COMMAND, read_range=True)  # Check range before motion.
    travel_mm = 0.0

    while True:  # Update motion until an obstacle or Stop ends the run.
        range_mm = state.measurements.range_mm
        if range_mm is not None and range_mm <= OBSTACLE_STOP_MM:  # Ignore missing echoes.
            result = "Obstacle detected; spiral stopped"
            break

        speed_mm_s = FORWARD_SPEED.value
        revolutions_per_mm = WINDING_RATE.value / 1000.0  # Convert turns/m to turns/mm.
        expansion = 1.0 + travel_mm / SPIRAL_EXPANSION_MM  # Reduce curvature as travel increases.
        turn_rate_rad_s = 2.0 * pi * speed_mm_s * revolutions_per_mm / expansion  # rad/s

        publish_spiral_values(travel_mm, turn_rate_rad_s)

        state = robot.step(MotionCommand(speed_mm_s, turn_rate_rad_s), read_range=True)
        measurements = state.measurements
        travel_mm += abs((measurements.left_increment_mm + measurements.right_increment_mm) / 2.0)  # Axle-center travel.
finally:
    robot.stop()
print(result)
print("final_pose:", state.pose)
