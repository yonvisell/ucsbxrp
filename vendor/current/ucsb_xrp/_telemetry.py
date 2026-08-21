"""In-process pose channel shared with the optional browser target service."""

from .records import DriveCommand, RobotState

try:
    import xrp_sim_bridge as _browser_bridge
except ImportError:
    _browser_bridge = None

_publish_browser_state = (
    None
    if _browser_bridge is None
    else getattr(_browser_bridge, "publish_course_state", None)
)


_latest = None


def publish_state(
    state,
    drive_command=None,
    motion_command=None,
    target_wheel_speeds=None,
):
    global _latest
    if not isinstance(state, RobotState):
        raise TypeError("state must be a RobotState")
    if drive_command is not None and not isinstance(drive_command, DriveCommand):
        raise TypeError("drive_command must be a DriveCommand value or None")
    requested_forward = (
        None if motion_command is None else motion_command.forward_speed_mm_s
    )
    requested_turn = None if motion_command is None else motion_command.turn_rate_rad_s
    target_left = (
        None if target_wheel_speeds is None else target_wheel_speeds.left_mm_s
    )
    target_right = (
        None if target_wheel_speeds is None else target_wheel_speeds.right_mm_s
    )
    _latest = {
        "xMm": state.pose.x_mm,
        "yMm": state.pose.y_mm,
        "headingRad": state.pose.heading_rad,
        "leftWheelSpeedMmS": state.measurements.left_speed_mm_s,
        "rightWheelSpeedMmS": state.measurements.right_speed_mm_s,
        "leftWheelDistanceMm": state.measurements.left_position_mm,
        "rightWheelDistanceMm": state.measurements.right_position_mm,
        "rangeMm": state.measurements.range_mm,
        "buttonPressed": state.measurements.button_pressed,
        # The physical-service wire keys remain stable for older app builds.
        "leftEffort": 0.0 if drive_command is None else drive_command.left,
        "rightEffort": 0.0 if drive_command is None else drive_command.right,
        "requestedForwardSpeedMmS": requested_forward,
        "requestedTurnRateRadS": requested_turn,
        "targetLeftWheelSpeedMmS": target_left,
        "targetRightWheelSpeedMmS": target_right,
    }
    if _publish_browser_state is not None:
        try:
            _publish_browser_state(
                state.pose.x_mm,
                state.pose.y_mm,
                state.pose.heading_rad,
                state.measurements.left_speed_mm_s,
                state.measurements.right_speed_mm_s,
                state.measurements.left_position_mm,
                state.measurements.right_position_mm,
                requested_forward,
                requested_turn,
                target_left,
                target_right,
            )
        except Exception:
            # Diagnostics must never stop a student control loop.
            pass


def state_snapshot():
    return None if _latest is None else dict(_latest)


def clear_state():
    global _latest
    _latest = None
