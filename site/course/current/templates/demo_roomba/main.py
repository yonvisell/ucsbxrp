# Drive forward, reverse from nearby obstacles, and choose a new heading.

from math import pi

from challenge import WORLD, RANDOM_SEED, REVERSE_TIME_S, MINIMUM_TURN_ANGLE_DEG, MAXIMUM_TURN_ANGLE_DEG, TURN_TOLERANCE_RAD, TURN_TIMEOUT_S
from robot_setup import make_robot
from live_variables import OBSTACLE_DISTANCE_MM, FORWARD_SPEED_MM_S, REVERSE_SPEED_MM_S, TURN_RATE_RAD_S, publish_avoidance_count, publish_phase, publish_range
from robot_setup import ROBOT_CONFIG
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
        # Keep the recurrence in 32 bits, then scale its unsigned state to [0, 1).
        self._state = (1664525 * self._state + 1013904223) & 0xFFFFFFFF
        return self._state / 4294967296.0


robot = make_robot(ROBOT_CONFIG)
random = SeededRandom(RANDOM_SEED)
try:  # Ensure finally stops motors on exit.
    state = robot.start(WORLD.initial_pose)  # Initialize estimated pose; reset measurements.
    state = robot.step(STOP_COMMAND, read_range=True)
    phase = "forward"
    phase_started_ms = state.measurements.time_ms
    target_heading_rad = state.pose.heading_rad
    avoidance_count = 0

    # In the forward phase, only a measured near obstacle initiates reversal.
    while True:  # Press Stop when you have observed enough of the route.
        range_mm = state.measurements.range_mm
        publish_range(range_mm)
        phase_time_s = elapsed_time_s(state.measurements.time_ms, phase_started_ms)

        if phase == "forward" and range_mm is not None and range_mm <= OBSTACLE_DISTANCE_MM.value:
            phase = "reverse"
            phase_started_ms = state.measurements.time_ms
        elif phase == "reverse" and phase_time_s >= REVERSE_TIME_S:
            # A seeded sign and angle make each avoidance turn reproducible.
            direction = 1.0 if random.unit() < 0.5 else -1.0
            angle_deg = MINIMUM_TURN_ANGLE_DEG + random.unit() * (MAXIMUM_TURN_ANGLE_DEG - MINIMUM_TURN_ANGLE_DEG)
            target_heading_rad = wrap_angle_rad(state.pose.heading_rad + direction * angle_deg * pi / 180.0)
            phase = "turn"
            phase_started_ms = state.measurements.time_ms
            avoidance_count += 1
            publish_avoidance_count(avoidance_count)

        if phase == "turn":
            # Wrap error across ±pi so correction follows the shorter direction.
            error_rad = wrap_angle_rad(target_heading_rad - state.pose.heading_rad)
            if abs(error_rad) <= TURN_TOLERANCE_RAD:
                phase = "forward"
                # Take a stopped sample before starting the next approach.
                state = robot.step(STOP_COMMAND, read_range=True)
                continue
            if elapsed_time_s(state.measurements.time_ms, phase_started_ms) >= TURN_TIMEOUT_S:
                raise RuntimeError("Rotation did not finish within 8 s; check wheel motion and encoder readings")
            turn_direction = 1.0 if error_rad > 0.0 else -1.0
            # Reduce yaw rate near the heading target to limit overshoot.
            command = MotionCommand(0.0, turn_direction * min(TURN_RATE_RAD_S.value, 3.0 * abs(error_rad)))
        elif phase == "reverse":
            command = MotionCommand(REVERSE_SPEED_MM_S.value, 0.0)
        else:
            # No echo or a distant obstacle allows the supervised demo to continue.
            command = MotionCommand(FORWARD_SPEED_MM_S.value, 0.0)

        publish_phase(phase)
        state = robot.step(command, read_range=True)
finally:
    robot.stop()
