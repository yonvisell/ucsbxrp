# Trace a reproducible sequence of straight runs and random quarter turns.

from math import pi

from challenge import WORLD, RANDOM_SEED, SEGMENT_COUNT, TURN_TOLERANCE_RAD, TURN_TIMEOUT_S, SEGMENT_TIMEOUT_S, MINIMUM_SEGMENT_TRAVEL_MM, MAXIMUM_SEGMENT_TRAVEL_MM
from course_setup import make_robot
from live_variables import FORWARD_SPEED_MM_S, TURN_RATE_RAD_S, publish_phase, publish_segment, publish_travel
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, elapsed_time_s, wrap_angle_rad

# SeededRandom — Generate reproducible pseudo-random demo choices.
# Called by: The demonstration route loop.
# Methods: unit(), uniform().
# Inputs: Integer seed; numeric uniform interval.
# State: Current 32-bit generator state.
# Returns: Number in [0, 1) or the requested interval.

class SeededRandom:
    def __init__(self, seed):
        self._state = int(seed) & 0xFFFFFFFF

    def unit(self):
        self._state = (1664525 * self._state + 1013904223) & 0xFFFFFFFF
        return self._state / 4294967296.0

    def uniform(self, minimum, maximum):
        return minimum + (maximum - minimum) * self.unit()


def body_travel_mm(state):
    # In-place rotation has opposite wheel increments and adds no body travel.
    measurements = state.measurements
    return abs((measurements.left_increment_mm + measurements.right_increment_mm) / 2.0)


robot = make_robot(ROBOT_CONFIG)
random = SeededRandom(RANDOM_SEED)
try:  # The finally block also runs if an error or Stop interrupts the route.
    state = robot.start(WORLD.initial_pose)
    total_travel_mm = 0.0

    for segment_index in range(SEGMENT_COUNT):
        target_travel_mm = random.uniform(MINIMUM_SEGMENT_TRAVEL_MM, MAXIMUM_SEGMENT_TRAVEL_MM)
        segment_travel_mm = 0.0
        started_ms = state.measurements.time_ms
        publish_segment(segment_index + 1)
        publish_phase("forward")

        while segment_travel_mm < target_travel_mm:
            if elapsed_time_s(state.measurements.time_ms, started_ms) >= SEGMENT_TIMEOUT_S:
                raise RuntimeError("Straight segment did not finish within 30 s; check wheel motion and encoder readings")
            state = robot.step(MotionCommand(FORWARD_SPEED_MM_S.value, 0.0))
            increment_mm = body_travel_mm(state)
            segment_travel_mm += increment_mm
            total_travel_mm += increment_mm

        direction = -1.0 if random.unit() < 0.5 else 1.0
        target_heading_rad = wrap_angle_rad(state.pose.heading_rad + direction * pi / 2.0)
        started_ms = state.measurements.time_ms
        publish_phase("turn right" if direction < 0.0 else "turn left")
        while True:
            error_rad = wrap_angle_rad(target_heading_rad - state.pose.heading_rad)
            if abs(error_rad) <= TURN_TOLERANCE_RAD:
                break
            if elapsed_time_s(state.measurements.time_ms, started_ms) >= TURN_TIMEOUT_S:
                raise RuntimeError("Rotation did not finish within 8 s; check wheel motion and encoder readings")
            direction = -1.0 if error_rad < 0.0 else 1.0
            turn_rate = direction * min(TURN_RATE_RAD_S.value, 3.0 * abs(error_rad))
            state = robot.step(MotionCommand(0.0, turn_rate))
            total_travel_mm += body_travel_mm(state)

        publish_travel(total_travel_mm)

    publish_phase("complete")
    print("Random-snake route complete")
    print("seed:", RANDOM_SEED)
    print("final_pose:", state.pose)
finally:  # Stop the motors after normal completion or a Python exception.
    robot.stop()
