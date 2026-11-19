# Roomba avoidance states: forward approach, timed reverse and a turn to a new heading.

from math import pi

from challenge import (
    MAXIMUM_TURN_ANGLE_DEG, MINIMUM_TURN_ANGLE_DEG, RANDOM_SEED,
    REVERSE_TIME_S, TURN_TIMEOUT_S, TURN_TOLERANCE_RAD,
)
from live_variables import (
    FORWARD_SPEED_MM_S, OBSTACLE_DISTANCE_MM, REVERSE_SPEED_MM_S,
    STEERING_RATE_RAD_S, publish_avoidance_count, publish_phase, publish_range,
)
from ucsb_xrp import MotionCommand, STOP_COMMAND, elapsed_time_s, wrap_angle_rad


class SeededRandom:
    # Generate the same turn sequence for a given initial seed.

    def __init__(self, seed):
        # Store the seed as an unsigned 32-bit integer.
        self._state = int(seed) & 0xFFFFFFFF

    def unit(self):
        # Advance the generator and return a number in [0, 1).
        self._state = (1664525 * self._state + 1013904223) & 0xFFFFFFFF
        return self._state / 4294967296.0


class Avoidance:
    # Choose forward, reverse or turn from one range and odometry update.

    def __init__(self, state):
        # Begin the forward approach at the sampled time and heading.
        self.random = SeededRandom(RANDOM_SEED)
        self.phase = "forward"
        self.phase_started_ms = state.measurements.time_ms
        self.target_heading_rad = state.pose.heading_rad
        self.avoidance_count = 0

    def start_turn(self, state):
        # Choose a reproducible heading relative to the measured heading.
        direction = 1 if self.random.unit() < 0.5 else -1
        angle_deg = MINIMUM_TURN_ANGLE_DEG + self.random.unit() * (MAXIMUM_TURN_ANGLE_DEG - MINIMUM_TURN_ANGLE_DEG)
        self.target_heading_rad = wrap_angle_rad(state.pose.heading_rad + direction * angle_deg * pi / 180)
        self.phase = "turn"
        self.phase_started_ms = state.measurements.time_ms
        self.avoidance_count += 1
        publish_avoidance_count(self.avoidance_count)

    def command(self, state, can_move=None):
        # A mapping Project also checks the space needed by each candidate motion.
        now = state.measurements.time_ms
        pose = state.pose
        range_mm = state.measurements.range_mm
        publish_range(range_mm)
        forward = FORWARD_SPEED_MM_S.value
        reverse = REVERSE_SPEED_MM_S.value
        near_echo = range_mm is not None and range_mm <= OBSTACLE_DISTANCE_MM.value

        if self.phase == "forward":
            if not near_echo and (can_move is None or can_move(pose, forward)):
                publish_phase("forward")
                return MotionCommand(forward, 0.0)
            self.phase = "reverse"
            self.phase_started_ms = now

        turn_clear = can_move is None or can_move(pose, 0)
        if self.phase == "turn" and not turn_clear:
            # A fresh echo can enter the turning footprint. Retreat before resuming a turn.
            self.phase = "reverse"
            self.phase_started_ms = now

        if self.phase == "reverse":
            rear_clear = can_move is None or can_move(pose, reverse)
            if rear_clear and elapsed_time_s(now, self.phase_started_ms) < REVERSE_TIME_S:
                publish_phase("reverse")
                return MotionCommand(reverse, 0.0)
            if not turn_clear:
                self.phase = "blocked"
                publish_phase("blocked")
                return STOP_COMMAND
            self.start_turn(state)

        # Reduce yaw rate near the target; take a stopped sample before the next approach.
        error_rad = wrap_angle_rad(self.target_heading_rad - pose.heading_rad)
        if abs(error_rad) <= TURN_TOLERANCE_RAD:
            self.phase = "forward"
            return STOP_COMMAND
        if elapsed_time_s(now, self.phase_started_ms) >= TURN_TIMEOUT_S:
            raise RuntimeError("Rotation did not finish within 8 s; check wheel motion and encoder readings")
        direction = 1 if error_rad > 0 else -1
        publish_phase("turn")
        return MotionCommand(0.0, direction * min(STEERING_RATE_RAD_S.value, 3.0 * abs(error_rad)))


def run_avoidance(robot, initial_pose, observe=None):
    # Run the original range-based demonstration until the operator stops it.
    try:
        robot.start(initial_pose)
        state = robot.step(STOP_COMMAND, read_range=True)
        avoidance = Avoidance(state)
        while True:
            if observe is not None:
                observe(robot.range_sample_seq, state.pose, state.measurements.range_mm)
            state = robot.step(avoidance.command(state), read_range=True)
    finally:
        robot.stop()
