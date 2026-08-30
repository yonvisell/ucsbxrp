# Challenge 6: approach a wall under a measured stopping-distance constraint.

from math import isfinite

from challenge import (
    ABSOLUTE_CONTACT_GUARD_RANGE_MM,
    INITIAL_POSE,
    INITIAL_RANGE_SAMPLE_COUNT,
    MAXIMUM_APPROACH_TIME_S,
    MAXIMUM_APPROACH_STEPS,
    MAXIMUM_FORWARD_TRAVEL_MM,
    MAXIMUM_SAFE_SPEED_MM_S,
    MAXIMUM_SETTLE_STEPS,
    MINIMUM_DECELERATION_MM_S2,
    MINIMUM_USABLE_RANGE_COUNT,
    NOMINAL_FORWARD_SPEED_MM_S,
    RANGE_WINDOW_SIZE,
    RESPONSE_TIME_S,
    STOP_MARGIN_MM,
    STOPPED_SPEED_MM_S,
)
from course_setup import make_range_safety_controller, make_robot
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND, elapsed_time_s, live


def mean_forward_speed(state):
    return (
        state.measurements.left_speed_mm_s
        + state.measurements.right_speed_mm_s
    ) / 2.0


def wheels_are_stopped(state):
    return (
        abs(state.measurements.left_speed_mm_s) <= STOPPED_SPEED_MM_S
        and abs(state.measurements.right_speed_mm_s) <= STOPPED_SPEED_MM_S
    )


class RangeMissionLimits:
    """Apply the explicit exercise bounds written in challenge.py."""

    def __init__(self, initial_measurements):
        self.start_time_ms = initial_measurements.time_ms
        self.start_left_position_mm = initial_measurements.left_position_mm
        self.start_right_position_mm = initial_measurements.right_position_mm

    def _bounded_run_reason(self, measurements, step_index):
        if step_index >= MAXIMUM_APPROACH_STEPS - 1:
            return "step_limit"
        elapsed_s = elapsed_time_s(measurements.time_ms, self.start_time_ms)
        if elapsed_s > MAXIMUM_APPROACH_TIME_S:
            return "time_limit"
        left_travel_mm = abs(
            measurements.left_position_mm - self.start_left_position_mm
        )
        right_travel_mm = abs(
            measurements.right_position_mm - self.start_right_position_mm
        )
        if max(left_travel_mm, right_travel_mm) > MAXIMUM_FORWARD_TRAVEL_MM:
            return "travel_limit"
        return None

    def apply(self, proposed_speed_mm_s, measurements, step_index):
        """Return ``(applied_speed, reason)`` without duplicating the challenge."""
        bounded_reason = self._bounded_run_reason(measurements, step_index)
        if bounded_reason is not None:
            return 0.0, bounded_reason

        current_range_mm = measurements.range_mm
        if (
            current_range_mm is not None
            and not isinstance(current_range_mm, bool)
            and isinstance(current_range_mm, (int, float))
            and isfinite(current_range_mm)
            and current_range_mm > 0.0
            and current_range_mm <= ABSOLUTE_CONTACT_GUARD_RANGE_MM
        ):
            return 0.0, "contact_guard"

        if (
            isinstance(proposed_speed_mm_s, bool)
            or not isinstance(proposed_speed_mm_s, (int, float))
            or not isfinite(proposed_speed_mm_s)
        ):
            return 0.0, "invalid_controller_output"
        student_speed_mm_s = float(proposed_speed_mm_s)
        if student_speed_mm_s < 0.0:
            return 0.0, "invalid_controller_output"
        if student_speed_mm_s == 0.0:
            return 0.0, "controller_stop"
        applied_speed_mm_s = min(
            student_speed_mm_s,
            NOMINAL_FORWARD_SPEED_MM_S,
            MAXIMUM_SAFE_SPEED_MM_S,
        )
        if applied_speed_mm_s < student_speed_mm_s:
            return applied_speed_mm_s, "visible_speed_cap"
        return applied_speed_mm_s, "student_command"


def run_challenge():
    robot = make_robot(ROBOT_CONFIG)
    controller = make_range_safety_controller(
        RESPONSE_TIME_S,
        MINIMUM_DECELERATION_MM_S2,
        STOP_MARGIN_MM,
        MAXIMUM_SAFE_SPEED_MM_S,
    )
    samples = []
    result = "approach_limit"
    estimate = None
    try:
        state = robot.start(INITIAL_POSE)
        mission_limits = RangeMissionLimits(state.measurements)
        for _ in range(INITIAL_RANGE_SAMPLE_COUNT):
            state = robot.step(STOP_COMMAND, read_range=True)
            samples.append(state.measurements.range_mm)
        samples = samples[-RANGE_WINDOW_SIZE:]

        for step_index in range(MAXIMUM_APPROACH_STEPS):
            estimate = robot.estimate_range(
                samples,
                MINIMUM_USABLE_RANGE_COUNT,
            )
            measured_speed = mean_forward_speed(state)
            try:
                proposed_speed = controller.update(
                    NOMINAL_FORWARD_SPEED_MM_S,
                    measured_speed,
                    estimate,
                )
            except Exception as error:
                print("RangeSafetyController error:", type(error).__name__, error)
                result = "controller_error"
                break
            safe_speed, supervision = mission_limits.apply(
                proposed_speed,
                state.measurements,
                step_index,
            )
            live.watch(
                "range_estimate_mm",
                estimate if estimate is not None else "—",
                unit="mm",
                label="Filtered range",
            )
            live.watch(
                "student_speed_mm_s",
                proposed_speed,
                unit="mm/s",
                label="Student controller output",
            )
            live.watch(
                "applied_speed_mm_s",
                safe_speed,
                unit="mm/s",
                label="Applied forward speed",
            )
            live.watch(
                "mission_limit",
                supervision,
                label="Applied command source",
            )
            live.plot(
                "applied_speed_mm_s",
                safe_speed,
                unit="mm/s",
                label="Applied forward speed",
            )
            if safe_speed <= 0.0:
                if supervision == "controller_stop":
                    result = (
                        "stopping_margin"
                        if estimate is not None
                        else "range_unavailable"
                    )
                else:
                    result = supervision
                break
            state = robot.step(MotionCommand(safe_speed, 0.0), read_range=True)
            samples.append(state.measurements.range_mm)
            samples = samples[-RANGE_WINDOW_SIZE:]
        else:
            raise RuntimeError("Range-constrained approach exceeded its step limit")

        for _ in range(MAXIMUM_SETTLE_STEPS):
            state = robot.step(STOP_COMMAND, read_range=True)
            samples.append(state.measurements.range_mm)
            samples = samples[-RANGE_WINDOW_SIZE:]
            if wheels_are_stopped(state):
                break
        else:
            raise RuntimeError("The drivetrain did not settle after the stop request")

        estimate = robot.estimate_range(samples, MINIMUM_USABLE_RANGE_COUNT)
        print("Challenge 6 result:", result)
        print("final_range_mm:", estimate)
        print("final_pose:", state.pose)
        return state
    finally:
        robot.stop()


run_challenge()
