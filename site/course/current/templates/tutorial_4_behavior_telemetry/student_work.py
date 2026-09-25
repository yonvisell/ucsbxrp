# Runnable measured behavior and telemetry functions for Tutorial 4.

from live_variables import FORWARD_SPEED, RUN_BEHAVIOR, STOP_DISTANCE, TURN_DIRECTION, TURN_RATE
from ucsb_xrp import MotionCommand, RobotState, live


APPROACH = "approach"
TURN = "turn"
DONE = "done"

# Inputs: current phase, range (mm or None), stop distance (mm), turn status.
# Returns: the next phase; a missing range does not request a turn.
def next_phase(
    phase: str,
    range_mm: object,
    stop_distance_mm: float,
    turn_complete: bool,
) -> str:
    if phase not in (APPROACH, TURN, DONE):
        raise ValueError("unknown phase")
    if stop_distance_mm <= 0.0:
        raise ValueError("stop distance must be positive")
    if phase == APPROACH:
        if range_mm is not None and range_mm <= stop_distance_mm:
            return TURN
        return APPROACH
    if phase == TURN and turn_complete:
        return DONE
    return phase


# Inputs: phase, forward speed (mm/s), turn rate (rad/s), left/right direction.
# Returns: MotionCommand with forward mm/s and turn rad/s for that phase.
def command_for_phase(
    phase: str,
    forward_speed_mm_s: float,
    turn_rate_rad_s: float,
    turn_direction: str,
) -> MotionCommand:
    if phase not in (APPROACH, TURN, DONE):
        raise ValueError("unknown phase")
    if forward_speed_mm_s <= 0.0 or turn_rate_rad_s <= 0.0:
        raise ValueError("speed and turn rate must be positive")
    if turn_direction not in ("left", "right"):
        raise ValueError("turn direction must be left or right")
    if phase == APPROACH:
        return MotionCommand(forward_speed_mm_s, 0.0)
    if phase == TURN:
        direction = 1.0 if turn_direction == "left" else -1.0
        return MotionCommand(0.0, direction * turn_rate_rad_s)
    return MotionCommand(0.0, 0.0)


# Inputs: latest RobotState and phase name; publishes current watch/plot values.
# Returns: None; range may be published as "unavailable".
def publish_telemetry(state: RobotState, phase: str) -> None:
    range_value = state.measurements.range_mm
    if range_value is None:
        range_value = "unavailable"
    live.watch("phase", phase)
    live.watch("range_mm", range_value, unit="mm")
    mean_distance_mm = (
        state.measurements.left_position_mm
        + state.measurements.right_position_mm
    ) / 2.0
    live.plot("wheel_distance_mm", mean_distance_mm, unit="mm")
    live.plot("heading_rad", state.pose.heading_rad, unit="rad")
