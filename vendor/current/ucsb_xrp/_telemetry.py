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

from .records import DriveCommand, RawSensors, RobotState

try:
    import xrp_sim_bridge as _browser_bridge
except ImportError:
    _browser_bridge = None

_publish_browser_state = (
    None
    if _browser_bridge is None
    else getattr(_browser_bridge, "publish_course_state", None)
)

# Retain nearly two seconds of the 50 Hz course loop. This covers the brief
# interval in which the browser prioritizes Run or Stop over telemetry polling.
_BUFFER_SIZE = 96
_latest = None
_buffer = [None] * _BUFFER_SIZE
_buffer_write_index = 0
_sample_seq = 0
_sample_time_ms = 0
_last_sample_ticks_ms = None
_hardware_latest = None
_drive_latest = DriveCommand(0.0, 0.0)


def publish_raw_sensors(
    raw_sensors,
    range_sampled=False,
    diagnostics=None,
    reflectance_sampled=False,
):
    """Mirror hardware values already read by the student program.

    The browser service runs on the other RP2350 core and must not read the
    same encoder, I2C, or GPIO devices concurrently. This whole-dictionary
    replacement lets that service observe current values without a second
    hardware access.
    """
    global _hardware_latest
    if not isinstance(raw_sensors, RawSensors):
        raise TypeError("raw_sensors must be a RawSensors value")
    if not isinstance(range_sampled, bool):
        raise TypeError("range_sampled must be True or False")
    if not isinstance(reflectance_sampled, bool):
        raise TypeError("reflectance_sampled must be True or False")
    previous = {} if _hardware_latest is None else _hardware_latest
    snapshot = {
        "leftEncoderCount": raw_sensors.left_encoder_count,
        "rightEncoderCount": raw_sensors.right_encoder_count,
        "rangeMm": (
            raw_sensors.range_mm
            if range_sampled
            else previous.get("rangeMm")
        ),
        "buttonPressed": raw_sensors.button_pressed,
        "leftReflectance": (
            None
            if reflectance_sampled and raw_sensors.reflectance is None
            else (
                raw_sensors.reflectance.left
                if reflectance_sampled
                else previous.get("leftReflectance")
            )
        ),
        "rightReflectance": (
            None
            if reflectance_sampled and raw_sensors.reflectance is None
            else (
                raw_sensors.reflectance.right
                if reflectance_sampled
                else previous.get("rightReflectance")
            )
        ),
        "accelerationMg": previous.get("accelerationMg"),
        "angularRateMdps": previous.get("angularRateMdps"),
        "temperatureC": previous.get("temperatureC"),
        "batteryV": previous.get("batteryV"),
        "sensorError": previous.get("sensorError"),
    }
    if diagnostics is not None:
        for key in (
            "accelerationMg",
            "angularRateMdps",
            "temperatureC",
            "batteryV",
            "sensorError",
        ):
            if key in diagnostics:
                snapshot[key] = diagnostics[key]
    _hardware_latest = snapshot


def publish_drive_command(command):
    """Mirror the latest logical motor command without touching hardware."""
    global _drive_latest, _hardware_latest
    if not isinstance(command, DriveCommand):
        raise TypeError("command must be a DriveCommand")
    _drive_latest = command
    if _hardware_latest is None:
        _hardware_latest = {
            "leftEncoderCount": 0,
            "rightEncoderCount": 0,
            "rangeMm": None,
            "buttonPressed": False,
            "leftReflectance": None,
            "rightReflectance": None,
            "accelerationMg": None,
            "angularRateMdps": None,
            "temperatureC": None,
            "batteryV": None,
            "sensorError": None,
        }


def hardware_snapshot():
    """Return the latest student-thread hardware mirror for the service."""
    if _hardware_latest is None:
        return None
    snapshot = dict(_hardware_latest)
    snapshot["leftEffort"] = _drive_latest.left
    snapshot["rightEffort"] = _drive_latest.right
    return snapshot


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
    raw_sensors=None,
):
    global _latest, _buffer_write_index
    if not isinstance(state, RobotState):
        raise TypeError("state must be a RobotState")
    if drive_command is not None and not isinstance(drive_command, DriveCommand):
        raise TypeError("drive_command must be a DriveCommand value or None")
    if raw_sensors is not None and not isinstance(raw_sensors, RawSensors):
        raise TypeError("raw_sensors must be a RawSensors value or None")
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
        "leftEncoderCount": (
            None if raw_sensors is None else raw_sensors.left_encoder_count
        ),
        "rightEncoderCount": (
            None if raw_sensors is None else raw_sensors.right_encoder_count
        ),
        "rangeMm": state.measurements.range_mm,
        "buttonPressed": state.measurements.button_pressed,
        "leftReflectance": (
            None
            if state.measurements.reflectance is None
            else state.measurements.reflectance.left
        ),
        "rightReflectance": (
            None
            if state.measurements.reflectance is None
            else state.measurements.reflectance.right
        ),
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
    global _hardware_latest, _drive_latest
    _latest = None
    for index in range(_BUFFER_SIZE):
        _buffer[index] = None
    _buffer_write_index = 0
    _sample_seq = 0
    _sample_time_ms = 0
    _last_sample_ticks_ms = None
    _hardware_latest = None
    _drive_latest = DriveCommand(0.0, 0.0)
