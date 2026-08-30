# Wander until a bounded sample or wheel-travel limit is reached.

from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND, live, load_world


WORLD = load_world()
RANDOM_SEED = 0xC0FFEE
OBSTACLE_THRESHOLD_MM = 250.0
MAXIMUM_CONSECUTIVE_MISSING_RANGES = 10
FORWARD_SPEED_MM_S = 150.0
REVERSE_SPEED_MM_S = -120.0
REVERSE_SAMPLES = 20
TURN_RATE_RAD_S = 1.4
MINIMUM_TURN_SAMPLES = 45
MAXIMUM_TURN_SAMPLES = 100
MAXIMUM_WHEEL_TRAVEL_MM = 190000.0
MAXIMUM_SAMPLES = 90000


class SeededRandom:
    """Small deterministic generator with identical CPython/MicroPython output."""

    def __init__(self, seed):
        self._state = int(seed) & 0xFFFFFFFF

    def unit(self):
        self._state = (1664525 * self._state + 1013904223) & 0xFFFFFFFF
        return self._state / 4294967296.0


def wheel_travel_mm(state):
    measurements = state.measurements
    return (
        abs(measurements.left_increment_mm)
        + abs(measurements.right_increment_mm)
    ) / 2.0


def random_turn(random):
    direction = 1.0 if random.unit() < 0.5 else -1.0
    span = MAXIMUM_TURN_SAMPLES - MINIMUM_TURN_SAMPLES + 1
    sample_count = MINIMUM_TURN_SAMPLES + int(random.unit() * span)
    return direction, sample_count


def run_demo():
    robot = make_robot(ROBOT_CONFIG)
    random = SeededRandom(RANDOM_SEED)
    result = "Roomba sample limit reached"
    try:
        state = robot.start(WORLD.initial_pose)
        state = robot.step(STOP_COMMAND, read_range=True)
        phase = "forward"
        phase_samples_remaining = 0
        turn_direction = 1.0
        turns = 0
        missing_ranges = 0
        range_samples = []
        total_travel_mm = 0.0

        for _ in range(MAXIMUM_SAMPLES):
            if total_travel_mm >= MAXIMUM_WHEEL_TRAVEL_MM:
                result = "Roomba wheel-travel limit reached"
                break

            if phase == "forward":
                range_samples.append(state.measurements.range_mm)
                range_samples = range_samples[-5:]
                range_mm = robot.estimate_range(range_samples, minimum_usable=3)
                live.watch(
                    "range_mm",
                    range_mm if range_mm is not None else "—",
                    unit="mm",
                )
                if range_mm is None:
                    missing_ranges += 1
                    if missing_ranges >= MAXIMUM_CONSECUTIVE_MISSING_RANGES:
                        result = "Roomba stopped: no usable ultrasound range"
                        break
                else:
                    missing_ranges = 0
                if (
                    range_mm is not None
                    and range_mm <= OBSTACLE_THRESHOLD_MM
                ):
                    phase = "reverse"
                    phase_samples_remaining = REVERSE_SAMPLES

            if phase == "forward":
                command = MotionCommand(FORWARD_SPEED_MM_S, 0.0)
            elif phase == "reverse":
                command = MotionCommand(REVERSE_SPEED_MM_S, 0.0)
            else:
                command = MotionCommand(0.0, turn_direction * TURN_RATE_RAD_S)

            live.watch("phase", phase)
            state = robot.step(command, read_range=True)
            total_travel_mm += wheel_travel_mm(state)

            if phase == "reverse" or phase == "turn":
                phase_samples_remaining -= 1
                if phase_samples_remaining == 0:
                    if phase == "reverse":
                        turn_direction, phase_samples_remaining = random_turn(random)
                        phase = "turn"
                        turns += 1
                        live.watch("turns", turns)
                    else:
                        phase = "forward"
                        range_samples = []
                        missing_ranges = 0

        live.watch("phase", "complete")
        live.watch("travel_mm", total_travel_mm, unit="mm")
        print(result)
        print("turns:", turns)
        print("final_pose:", state.pose)
        return state
    finally:
        robot.stop()


run_demo()
