# Trace a reproducible sequence of straight runs and random quarter turns.

from math import pi

from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, live, load_world, wrap_angle_rad


WORLD = load_world()
RANDOM_SEED = 0x5A17
SEGMENT_COUNT = 12
FORWARD_SPEED_MM_S = 95.0
TURN_RATE_RAD_S = 0.8
TURN_TOLERANCE_RAD = 0.05
MAXIMUM_TURN_SAMPLES = 160
MINIMUM_SEGMENT_TRAVEL_MM = 100.0
MAXIMUM_SEGMENT_TRAVEL_MM = 180.0
MAXIMUM_WHEEL_TRAVEL_MM = 4000.0
MAXIMUM_SAMPLES = 2400


class SeededRandom:
    """Small deterministic generator with identical CPython/MicroPython output."""

    def __init__(self, seed):
        self._state = int(seed) & 0xFFFFFFFF

    def unit(self):
        self._state = (1664525 * self._state + 1013904223) & 0xFFFFFFFF
        return self._state / 4294967296.0

    def uniform(self, minimum, maximum):
        return minimum + (maximum - minimum) * self.unit()


def wheel_travel_mm(state):
    measurements = state.measurements
    return (
        abs(measurements.left_increment_mm)
        + abs(measurements.right_increment_mm)
    ) / 2.0


def run_demo():
    robot = make_robot(ROBOT_CONFIG)
    random = SeededRandom(RANDOM_SEED)
    result = "Random-snake segment limit reached"
    try:
        state = robot.start(WORLD.initial_pose)
        total_wheel_travel_mm = 0.0
        samples = 0

        for segment_index in range(SEGMENT_COUNT):
            if (
                total_wheel_travel_mm >= MAXIMUM_WHEEL_TRAVEL_MM
                or samples >= MAXIMUM_SAMPLES
            ):
                result = "Random-snake safety limit reached"
                break

            target_travel_mm = random.uniform(
                MINIMUM_SEGMENT_TRAVEL_MM,
                MAXIMUM_SEGMENT_TRAVEL_MM,
            )
            segment_travel_mm = 0.0
            live.watch("segment", segment_index + 1)
            live.watch("phase", "forward")

            while (
                segment_travel_mm < target_travel_mm
                and total_wheel_travel_mm < MAXIMUM_WHEEL_TRAVEL_MM
                and samples < MAXIMUM_SAMPLES
            ):
                state = robot.step(MotionCommand(FORWARD_SPEED_MM_S, 0.0))
                increment_mm = wheel_travel_mm(state)
                segment_travel_mm += increment_mm
                total_wheel_travel_mm += increment_mm
                samples += 1

            if (
                total_wheel_travel_mm >= MAXIMUM_WHEEL_TRAVEL_MM
                or samples >= MAXIMUM_SAMPLES
            ):
                result = "Random-snake safety limit reached"
                break

            direction = -1.0 if random.unit() < 0.5 else 1.0
            target_heading_rad = wrap_angle_rad(
                state.pose.heading_rad + direction * pi / 2.0
            )
            heading_error_rad = wrap_angle_rad(
                target_heading_rad - state.pose.heading_rad
            )
            turn_samples = 0
            live.watch("phase", "turn right" if direction < 0.0 else "turn left")
            while (
                abs(heading_error_rad) > TURN_TOLERANCE_RAD
                and turn_samples < MAXIMUM_TURN_SAMPLES
                and total_wheel_travel_mm < MAXIMUM_WHEEL_TRAVEL_MM
                and samples < MAXIMUM_SAMPLES
            ):
                turn_direction = -1.0 if heading_error_rad < 0.0 else 1.0
                state = robot.step(
                    MotionCommand(0.0, turn_direction * TURN_RATE_RAD_S)
                )
                total_wheel_travel_mm += wheel_travel_mm(state)
                samples += 1
                turn_samples += 1
                heading_error_rad = wrap_angle_rad(
                    target_heading_rad - state.pose.heading_rad
                )

            if abs(heading_error_rad) > TURN_TOLERANCE_RAD:
                result = "Random-snake turn safety limit reached"
                break

            live.watch("travel_mm", total_wheel_travel_mm, unit="mm")
        else:
            result = "Random-snake route complete"

        live.watch("phase", "complete")
        print(result)
        print("seed:", RANDOM_SEED)
        print("final_pose:", state.pose)
        return state
    finally:
        robot.stop()


run_demo()
