"""In-process pose channel shared with the optional browser target service."""

from .records import DriveCommand, RobotState


_latest = None


def publish_state(state, drive_command=None):
    global _latest
    if not isinstance(state, RobotState):
        raise TypeError("state must be a RobotState")
    if drive_command is not None and not isinstance(drive_command, DriveCommand):
        raise TypeError("drive_command must be a DriveCommand value or None")
    _latest = {
        "xMm": state.pose.x_mm,
        "yMm": state.pose.y_mm,
        "headingRad": state.pose.heading_rad,
        "leftWheelSpeedMmS": state.measurements.left_speed_mm_s,
        "rightWheelSpeedMmS": state.measurements.right_speed_mm_s,
        "rangeMm": state.measurements.range_mm,
        "buttonPressed": state.measurements.button_pressed,
        # The physical-service wire keys remain stable for older app builds.
        "leftEffort": 0.0 if drive_command is None else drive_command.left,
        "rightEffort": 0.0 if drive_command is None else drive_command.right,
    }


def state_snapshot():
    return None if _latest is None else dict(_latest)


def clear_state():
    global _latest
    _latest = None
