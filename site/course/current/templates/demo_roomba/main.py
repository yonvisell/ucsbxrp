# Drive forward, reverse from nearby obstacles, and choose a new heading.

from math import pi

from challenge import WORLD, RANDOM_SEED, REVERSE_TIME_S, MINIMUM_TURN_ANGLE_DEG, MAXIMUM_TURN_ANGLE_DEG, TURN_TOLERANCE_RAD, TURN_TIMEOUT_S
from course_setup import make_robot
from live_variables import OBSTACLE_DISTANCE_MM, FORWARD_SPEED_MM_S, REVERSE_SPEED_MM_S, TURN_RATE_RAD_S, publish_avoidance_count, publish_phase, publish_range
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND, elapsed_time_s, wrap_angle_rad

# SeededRandom — Generate reproducible pseudo-random demo choices.
# Called by: The demonstration route loop.
# Methods: unit().
# Inputs: Integer seed.
# State: Current 32-bit generator state.
# Returns: Number in [0, 1).

class SeededRandom:
    def __init__(self, seed):
        self._state = int(seed) & 0xFFFFFFFF

    def unit(self):
        self._state = (1664525 * self._state + 1013904223) & 0xFFFFFFFF
        return self._state / 4294967296.0


# Construct the robot from this project's configured components.
robot = make_robot(ROBOT_CONFIG)
random = SeededRandom(RANDOM_SEED)
try:  # Run finally below when this block finishes or raises a Python error.
    # Start establishes the initial pose and encoder/time measurement origins.
    state = robot.start(WORLD.initial_pose)
    state = robot.step(STOP_COMMAND, read_range=True)
    phase = "forward"
    phase_started_ms = state.measurements.time_ms
    target_heading_rad = state.pose.heading_rad
    avoidance_count = 0

    # Alternate range-checked travel and bounded turning until Stop.
    while True:  # Press Stop when you have observed enough of the route.
        range_mm = state.measurements.range_mm
        publish_range(range_mm)
        phase_time_s = elapsed_time_s(state.measurements.time_ms, phase_started_ms)

        if phase == "forward" and range_mm is not None and range_mm <= OBSTACLE_DISTANCE_MM.value:
            phase = "reverse"
            phase_started_ms = state.measurements.time_ms
        elif phase == "reverse" and phase_time_s >= REVERSE_TIME_S:
            direction = 1.0 if random.unit() < 0.5 else -1.0
            angle_deg = MINIMUM_TURN_ANGLE_DEG + random.unit() * (MAXIMUM_TURN_ANGLE_DEG - MINIMUM_TURN_ANGLE_DEG)
            target_heading_rad = wrap_angle_rad(state.pose.heading_rad + direction * angle_deg * pi / 180.0)
            phase = "turn"
            phase_started_ms = state.measurements.time_ms
            avoidance_count += 1
            publish_avoidance_count(avoidance_count)

        if phase == "turn":
            error_rad = wrap_angle_rad(target_heading_rad - state.pose.heading_rad)
            if abs(error_rad) <= TURN_TOLERANCE_RAD:
                phase = "forward"
                # Take a stopped sample before starting the next approach.
                state = robot.step(STOP_COMMAND, read_range=True)
                continue
            if elapsed_time_s(state.measurements.time_ms, phase_started_ms) >= TURN_TIMEOUT_S:
                raise RuntimeError("Rotation did not finish within 8 s; check wheel motion and encoder readings")
            turn_direction = 1.0 if error_rad > 0.0 else -1.0
            command = MotionCommand(0.0, turn_direction * min(TURN_RATE_RAD_S.value, 3.0 * abs(error_rad)))
        elif phase == "reverse":
            command = MotionCommand(REVERSE_SPEED_MM_S.value, 0.0)
        else:
            # No echo or a distant obstacle allows the supervised demo to continue.
            command = MotionCommand(FORWARD_SPEED_MM_S.value, 0.0)

        publish_phase(phase)
        state = robot.step(command, read_range=True)
finally:  # Runs after a return, Python error, or the IDE's cooperative Stop.
    robot.stop()
