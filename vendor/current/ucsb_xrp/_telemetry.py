"""In-process pose channel shared with the optional browser target service."""

try:
    from time import ticks_diff as _ticks_diff
    from time import ticks_ms as _ticks_ms
except ImportError:  # CPython tests
    from time import monotonic

    def _ticks_ms():
        return int(monotonic() * 1000.0)

    def _ticks_diff(newer, older):
        return newer - older

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

_BUFFER_SIZE = 8
_latest = None
_buffer = [None] * _BUFFER_SIZE
_buffer_write_index = 0
_sample_seq = 0
_sample_time_ms = 0
_last_sample_ticks_ms = None


def _next_sample_identity():
    """Return a sequence and elapsed time for one published robot sample."""
    global _sample_seq, _sample_time_ms, _last_sample_ticks_ms
    now = _ticks_ms()
    if _last_sample_ticks_ms is not None:
        elapsed = _ticks_diff(now, _last_sample_ticks_ms)
        if elapsed > 0:
            _sample_time_ms += elapsed
    _last_sample_ticks_ms = now
    _sample_seq += 1
    return _sample_seq, _sample_time_ms


def publish_state(
    state,
    drive_command=None,
    motion_command=None,
    target_wheel_speeds=None,
):
    global _latest, _buffer_write_index
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
    sample_seq, sample_time_ms = _next_sample_identity()
    snapshot = {
        "sampleSeq": sample_seq,
        "sampleTimeMs": sample_time_ms,
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
    # Each snapshot is replaced as a whole and is never mutated after this
    # point. The fixed ring therefore adds one pointer assignment to the
    # existing per-step publication work and has a strict memory bound.
    _latest = snapshot
    _buffer[_buffer_write_index] = snapshot
    _buffer_write_index = (_buffer_write_index + 1) % _BUFFER_SIZE
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


def buffered_state_snapshots(after_sample_seq=0):
    """Return retained robot samples newer than ``after_sample_seq``.

    The returned tuple is ordered by sequence. Its dictionaries are internal
    immutable snapshots; callers must treat them as read-only.
    """
    try:
        after_sample_seq = int(after_sample_seq)
    except (TypeError, ValueError):
        after_sample_seq = 0
    snapshots = []
    for snapshot in _buffer:
        if snapshot is not None and snapshot["sampleSeq"] > after_sample_seq:
            snapshots.append(snapshot)
    snapshots.sort(key=lambda value: value["sampleSeq"])
    return tuple(snapshots)


def clear_state():
    global _latest, _buffer_write_index
    global _sample_seq, _sample_time_ms, _last_sample_ticks_ms
    _latest = None
    for index in range(_BUFFER_SIZE):
        _buffer[index] = None
    _buffer_write_index = 0
    _sample_seq = 0
    _sample_time_ms = 0
    _last_sample_ticks_ms = None
