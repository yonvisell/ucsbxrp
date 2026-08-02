"""In-process pose channel shared with the optional browser target service."""

from .records import MotorEfforts, RobotState


_latest = None


def publish_state(state, efforts=None):
    global _latest
    if not isinstance(state, RobotState):
        raise TypeError("state must be a RobotState")
    if efforts is not None and not isinstance(efforts, MotorEfforts):
        raise TypeError("efforts must be a MotorEfforts value or None")
    _latest = {
        "xMm": state.pose.x_mm,
        "yMm": state.pose.y_mm,
        "headingRad": state.pose.heading_rad,
        "leftWheelSpeedMmS": state.measurements.left_speed_mm_s,
        "rightWheelSpeedMmS": state.measurements.right_speed_mm_s,
        "rangeMm": state.measurements.range_mm,
        "buttonPressed": state.measurements.button_pressed,
        "leftEffort": 0.0 if efforts is None else efforts.left,
        "rightEffort": 0.0 if efforts is None else efforts.right,
    }


def state_snapshot():
    return None if _latest is None else dict(_latest)


def clear_state():
    global _latest
    _latest = None
