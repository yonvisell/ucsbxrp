"""Measured straight trial with a caller-owned speed decision."""

from math import isfinite

from . import live
from .records import MotionCommand, STOP_COMMAND
from .utils import elapsed_time_s


class StraightTrialResult:
    """Final measured state and software estimate of time in motion."""

    __slots__ = ("reason", "state", "remaining_mm", "motion_time_s")

    def __init__(self, reason, state, remaining_mm, motion_time_s):
        self.reason = reason
        self.state = state
        self.remaining_mm = remaining_mm
        self.motion_time_s = motion_time_s


def _mean_position_mm(measurements):
    return (measurements.left_position_mm + measurements.right_position_mm) / 2.0


def run_straight_trial(robot, initial_pose, target_distance_mm, speed_for_distance):
    """Run a bounded forward trial using speed requests based on measured travel.

    ``speed_for_distance(remaining_mm)`` returns a speed in mm/s, with zero
    requesting the final stop. The robot is stopped on every exit path.
    ``motion_time_s`` spans first detected motion through first detected rest;
    it excludes the confirmation interval and is not a floor measurement.
    """
    if not callable(speed_for_distance):
        raise TypeError("speed_for_distance must be callable")
    if not isfinite(target_distance_mm) or target_distance_mm <= 0.0:
        raise ValueError("target_distance_mm must be positive and finite")

    maximum_run_time_s = 30.0
    maximum_travel_mm = target_distance_mm * 1.5
    maximum_requested_speed_mm_s = 240.0
    stationary_speed_mm_s = 5.0
    stationary_duration_s = 0.3
    reason = "timeout"
    stopped = False
    stationary_s = 0.0
    first_motion_s = None
    motion_end_s = 0.0
    was_moving = False
    try:
        state = robot.start(initial_pose)
        initial_position_mm = _mean_position_mm(state.measurements)
        start_ms = state.measurements.time_ms
        remaining_mm = target_distance_mm
        while elapsed_time_s(state.measurements.time_ms, start_ms) < maximum_run_time_s:
            travel_mm = _mean_position_mm(state.measurements) - initial_position_mm
            remaining_mm = target_distance_mm - travel_mm
            if abs(travel_mm) > maximum_travel_mm:
                reason = "travel_limit"
                break

            speed_mm_s = 0.0 if stopped else speed_for_distance(remaining_mm)
            if isinstance(speed_mm_s, bool) or not isinstance(speed_mm_s, (int, float)):
                raise TypeError("speed_for_distance must return a speed in mm/s")
            if not isfinite(speed_mm_s) or not 0.0 <= speed_mm_s <= maximum_requested_speed_mm_s:
                raise ValueError("requested speed must be between 0 and 240 mm/s")
            if speed_mm_s == 0.0:
                stopped = True
            command = STOP_COMMAND if stopped else MotionCommand(speed_mm_s, 0.0)
            state = robot.step(command)
            elapsed_s = elapsed_time_s(state.measurements.time_ms, start_ms)
            travel_mm = _mean_position_mm(state.measurements) - initial_position_mm
            remaining_mm = target_distance_mm - travel_mm
            speeds = state.measurements.wheel_speeds
            moving = max(abs(speeds.left_mm_s), abs(speeds.right_mm_s)) > stationary_speed_mm_s
            if moving:
                if first_motion_s is None:
                    first_motion_s = max(0.0, elapsed_s - state.measurements.dt_s)
                motion_end_s = elapsed_s
            elif was_moving:
                motion_end_s = elapsed_s
            was_moving = moving
            stationary_s = stationary_s + state.measurements.dt_s if stopped and not moving else 0.0
            motion_time_s = 0.0 if first_motion_s is None else motion_end_s - first_motion_s
            live.plot("remaining_mm", remaining_mm, unit="mm", label="Remaining distance")
            live.plot("requested_speed_mm_s", command.forward_speed_mm_s, unit="mm/s", label="Requested speed")
            live.watch("motion_time_s", motion_time_s, unit="s", label="Estimated motion time")
            if stationary_s >= stationary_duration_s:
                reason = "stationary" if first_motion_s is not None else "no_motion"
                break

        motion_time_s = 0.0 if first_motion_s is None else motion_end_s - first_motion_s
        result = StraightTrialResult(reason, state, remaining_mm, motion_time_s)
        print("Straight trial: result={} motion_time_s={:.2f} remaining_mm={:.1f}".format(
            reason, motion_time_s, remaining_mm,
        ))
        return result
    finally:
        robot.stop()
