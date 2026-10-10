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

import json
from .records import DriveCommand, RawSensors, RobotState
from ._build_config import DEBUG_VALIDATION
from ._range import begin_range_scope
from .live import _plot_sample_snapshot

try:
    import _thread
    _snapshot_lock = _thread.allocate_lock()
except (ImportError, AttributeError):
    _snapshot_lock = None

try:
    import xrp_sim_bridge as _browser_bridge
except ImportError:
    _browser_bridge = None

_publish_browser_state = (
    None
    if _browser_bridge is None
    else getattr(_browser_bridge, "publish_course_state", None)
)
_publish_browser_raw = (
    None
    if _browser_bridge is None
    else getattr(_browser_bridge, "publish_sensor_sample", None)
)

# Retain nearly two seconds of the 100 Hz course loop. This covers the brief
# interval in which the browser prioritizes Run or Stop over telemetry polling.
_BUFFER_SIZE = 192
_latest = None
_buffer = [None] * _BUFFER_SIZE
_buffer_write_index = 0
_buffer_count = 0
_sample_seq = 0
_sample_time_ms = 0
_last_sample_ticks_ms = None
_hardware_latest = None
_drive_latest = (0.0, 0.0)
_clock_ticks_ms = None
_clock_elapsed_ms = 0
_raw_seq = 0
_last_raw = None
_raw_timing = None
_range_seq = 0
_range_time_ms = None
_diagnostics_seq = 0
_diagnostics_time_ms = None
_diagnostics_latest = (None, None, None, None, None)
_course_samples = False
_range_sampled = False

# Producer frames contain values only. Names are expanded by the consumer after
# releasing the publication lock; frames and their nested sample tuples remain
# immutable even when the ring wraps or a new run resets its storage.
_COURSE_FIELDS = (
    "sampleSeq", "sampleTimeMs", "xMm", "yMm", "headingRad",
    "leftWheelSpeedMmS", "rightWheelSpeedMmS", "leftWheelDistanceMm",
    "rightWheelDistanceMm", "leftEncoderCount", "rightEncoderCount",
    "rangeMm", "buttonPressed", "leftReflectance", "rightReflectance",
    "leftEffort", "rightEffort", "requestedForwardSpeedMmS",
    "requestedTurnRateRadS", "targetLeftWheelSpeedMmS", "targetRightWheelSpeedMmS",
    "plotValues", "timing", "diagnostics",
)
_RAW_FIELDS = (
    "sampleSeq", "sampleTimeMs", "poseAvailable", "xMm", "yMm", "headingRad",
    "leftWheelSpeedMmS", "rightWheelSpeedMmS", "leftEncoderCount",
    "rightEncoderCount", "rangeMm", "buttonPressed", "leftEffort",
    "rightEffort", "plotValues", "timing", "diagnostics",
)
_HARDWARE_FIELDS = (
    "leftEncoderCount", "rightEncoderCount", "rangeMm", "buttonPressed",
    "leftReflectance", "rightReflectance", "accelerationMg", "angularRateMdps",
    "temperatureC", "batteryV", "sensorError",
)
_EMPTY_HARDWARE = (0, 0, None, False, None, None, None, None, None, None, None)


def _expand_frame(frame):
    fields = _COURSE_FIELDS if len(frame) == len(_COURSE_FIELDS) else _RAW_FIELDS
    return dict(zip(fields, frame))


def _acquire_snapshot():
    if _snapshot_lock is not None:
        _snapshot_lock.acquire()


def _release_snapshot():
    if _snapshot_lock is not None:
        _snapshot_lock.release()


def _elapsed_at(ticks_ms):
    """Unwrap nearby acquisition/publication ticks from the first acquisition."""
    global _clock_ticks_ms, _clock_elapsed_ms
    if _clock_ticks_ms is None:
        _clock_ticks_ms = ticks_ms
        return 0
    delta = _ticks_diff(ticks_ms, _clock_ticks_ms)
    elapsed = _clock_elapsed_ms + delta
    if delta >= 0:
        _clock_ticks_ms = ticks_ms
        _clock_elapsed_ms = elapsed
    return elapsed


def begin_course_samples():
    """Suppress a raw publication while Robot performs its current sensor read."""
    global _course_samples
    _course_samples = True


def end_course_samples():
    global _course_samples
    _course_samples = False


def _remember_acquisition(raw, range_sampled=False, diagnostics=None, range_seq=None):
    global _raw_seq, _last_raw, _raw_timing
    global _range_seq, _range_time_ms
    global _diagnostics_seq, _diagnostics_time_ms, _diagnostics_latest
    global _range_sampled
    if raw is _last_raw:
        return
    acquired_ms = _elapsed_at(raw.time_ms)
    _raw_seq += 1
    _last_raw = raw
    _range_sampled = range_sampled
    if range_sampled and range_seq is not None and range_seq != _range_seq:
        _range_seq = range_seq
        # The optional range read precedes the encoder timestamp. This is its
        # acquisition-completion upper bound, not a simultaneous sensor claim.
        # Requests during cooldown retain this attempt's identity and time.
        _range_time_ms = acquired_ms
    if diagnostics is not None:
        _diagnostics_seq += 1
        _diagnostics_time_ms = _elapsed_at(_ticks_ms())
        acceleration = diagnostics.get("accelerationMg")
        angular_rate = diagnostics.get("angularRateMdps")
        _diagnostics_latest = (
            None if acceleration is None else tuple(acceleration),
            None if angular_rate is None else tuple(angular_rate),
            diagnostics.get("temperatureC"), diagnostics.get("batteryV"),
            diagnostics.get("sensorError"),
        )
    _raw_timing = (
        raw.time_ms, acquired_ms, _raw_seq,
        _range_time_ms, _range_seq or None,
        _diagnostics_time_ms, _diagnostics_seq or None,
        raw.left_encoder_count, raw.right_encoder_count, raw.range_mm,
    )


def _publication_timing(kind, dt_ms=None, period_ms=None, overrun_ms=None):
    if _raw_timing is None:
        return None
    return _raw_timing + (_elapsed_at(_ticks_ms()), dt_ms, period_ms, overrun_ms, kind, _range_sampled)


def _retain_snapshot(snapshot):
    global _latest, _buffer_write_index, _buffer_count
    _acquire_snapshot()
    try:
        _latest = snapshot
        _buffer[_buffer_write_index] = snapshot
        _buffer_write_index = (_buffer_write_index + 1) % _BUFFER_SIZE
        if _buffer_count < _BUFFER_SIZE:
            _buffer_count += 1
    finally:
        _release_snapshot()


def publish_raw_sensors(
    raw_sensors,
    range_sampled=False,
    diagnostics=None,
    reflectance_sampled=False,
    range_seq=None,
):
    """Mirror hardware values already read by the student program.

    The browser service runs on the other RP2350 core and must not read the
    same encoder, I2C, or GPIO devices concurrently. Whole-tuple replacement
    lets the service observe current values without a second hardware access;
    only consumers expand it into the established dictionary schema.
    """
    global _hardware_latest
    if DEBUG_VALIDATION:
        if not isinstance(raw_sensors, RawSensors):
            raise TypeError("raw_sensors must be a RawSensors value")
        if not isinstance(range_sampled, bool):
            raise TypeError("range_sampled must be True or False")
        if not isinstance(reflectance_sampled, bool):
            raise TypeError("reflectance_sampled must be True or False")
    _remember_acquisition(raw_sensors, range_sampled, diagnostics, range_seq)
    previous = _EMPTY_HARDWARE if _hardware_latest is None else _hardware_latest
    reflectance = raw_sensors.reflectance
    acceleration = previous[6]
    angular_rate = previous[7]
    temperature = previous[8]
    battery = previous[9]
    error = previous[10]
    if diagnostics is not None:
        acceleration = diagnostics.get("accelerationMg", acceleration)
        angular_rate = diagnostics.get("angularRateMdps", angular_rate)
        temperature = diagnostics.get("temperatureC", temperature)
        battery = diagnostics.get("batteryV", battery)
        error = diagnostics.get("sensorError", error)
        # Freeze caller-owned vector lists before retaining them across cores.
        if acceleration is not None:
            acceleration = tuple(acceleration)
        if angular_rate is not None:
            angular_rate = tuple(angular_rate)
    snapshot = (
        raw_sensors.left_encoder_count, raw_sensors.right_encoder_count,
        raw_sensors.range_mm if range_sampled else previous[2],
        raw_sensors.button_pressed,
        (None if reflectance is None else reflectance.left) if reflectance_sampled else previous[4],
        (None if reflectance is None else reflectance.right) if reflectance_sampled else previous[5],
        acceleration, angular_rate, temperature, battery, error,
    )
    _acquire_snapshot()
    try:
        _hardware_latest = snapshot
    finally:
        _release_snapshot()
    if not _course_samples:
        sequence, elapsed = _next_sample_identity()
        drive = _drive_latest
        plots = _plot_sample_snapshot()
        timing = _publication_timing("raw")
        _retain_snapshot((
            sequence, elapsed, False, 0.0, 0.0, 0.0, 0.0, 0.0,
            raw_sensors.left_encoder_count, raw_sensors.right_encoder_count,
            raw_sensors.range_mm, raw_sensors.button_pressed,
            drive[0], drive[1], plots, timing, _diagnostics_latest,
        ))
        if _publish_browser_raw is not None:
            try:
                publication = {"timing": timing, "diagnostics": _diagnostics_latest}
                if plots:
                    publication["plots"] = [
                        {"name": name, "label": label, "unit": unit, "value": value}
                        for name, label, unit, value in plots
                    ]
                _publish_browser_raw(json.dumps(publication))
            except Exception:
                # A diagnostic bridge failure must not stop sensor acquisition.
                pass


def publish_drive_command(command):
    """Mirror the latest logical motor command without touching hardware."""
    if DEBUG_VALIDATION and not isinstance(command, DriveCommand):
        raise TypeError("command must be a DriveCommand")
    publish_drive_values(command.left, command.right)


def publish_drive_values(left, right):
    """Mirror scalar logical efforts already checked by the motor boundary."""
    global _drive_latest, _hardware_latest
    drive = (left, right)
    _acquire_snapshot()
    try:
        _drive_latest = drive
        if _hardware_latest is None:
            _hardware_latest = _EMPTY_HARDWARE
    finally:
        _release_snapshot()


def hardware_snapshot():
    """Return the latest student-thread hardware mirror for the service."""
    _acquire_snapshot()
    try:
        hardware, drive = _hardware_latest, _drive_latest
    finally:
        _release_snapshot()
    if hardware is None:
        return None
    snapshot = dict(zip(_HARDWARE_FIELDS, hardware))
    snapshot["leftEffort"] = drive[0]
    snapshot["rightEffort"] = drive[1]
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
    sample_period_ms=None,
    overrun_ms=None,
    kind="course",
    wheel_control_values=None,
):
    if DEBUG_VALIDATION:
        if not isinstance(state, RobotState):
            raise TypeError("state must be a RobotState")
        if drive_command is not None and not isinstance(drive_command, DriveCommand):
            raise TypeError("drive_command must be a DriveCommand value or None")
        if raw_sensors is not None and not isinstance(raw_sensors, RawSensors):
            raise TypeError("raw_sensors must be a RawSensors value or None")
    if raw_sensors is not None:
        _remember_acquisition(raw_sensors)
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
    if wheel_control_values is None:
        drive_left = 0.0 if drive_command is None else drive_command.left
        drive_right = 0.0 if drive_command is None else drive_command.right
    else:
        # Copy the prepared control workspace's scalars into this acquisition;
        # the next iteration may reuse the workspace immediately after return.
        target_left, target_right = wheel_control_values[0], wheel_control_values[1]
        drive_left, drive_right = wheel_control_values[2], wheel_control_values[3]
    sample_seq, sample_time_ms = _next_sample_identity()
    measurements = state.measurements
    pose = state.pose
    reflectance = measurements.reflectance
    plots = _plot_sample_snapshot()
    timing = _publication_timing(kind, measurements.dt_s * 1000.0, sample_period_ms, overrun_ms)
    snapshot = (
        sample_seq, sample_time_ms, pose.x_mm, pose.y_mm, pose.heading_rad,
        measurements.left_speed_mm_s, measurements.right_speed_mm_s,
        measurements.left_position_mm, measurements.right_position_mm,
        None if raw_sensors is None else raw_sensors.left_encoder_count,
        None if raw_sensors is None else raw_sensors.right_encoder_count,
        measurements.range_mm, measurements.button_pressed,
        None if reflectance is None else reflectance.left,
        None if reflectance is None else reflectance.right,
        drive_left, drive_right,
        requested_forward, requested_turn, target_left, target_right,
        plots, timing, _diagnostics_latest,
    )
    # A short lock commits the immutable frame and its ordered ring position.
    _retain_snapshot(snapshot)
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
                json.dumps([
                    {"name": name, "label": label, "unit": unit, "value": value}
                    for name, label, unit, value in plots
                ]),
                json.dumps({"timing": timing, "diagnostics": _diagnostics_latest}),
            )
        except Exception:
            # Diagnostics must never stop a student control loop.
            pass


def state_snapshot():
    _acquire_snapshot()
    try:
        latest = _latest
    finally:
        _release_snapshot()
    return None if latest is None else _expand_frame(latest)


def buffered_state_snapshots(after_sample_seq=0):
    """Return retained robot samples newer than ``after_sample_seq``.

    Copy only requested committed frame references while holding the lock.
    Expand their established dictionary schema afterward. Returned dictionaries
    are consumer-owned; changing them cannot mutate retained acquisition data.
    """
    try:
        after_sample_seq = int(after_sample_seq)
    except (TypeError, ValueError):
        after_sample_seq = 0
    _acquire_snapshot()
    try:
        if _latest is None:
            retained = ()
        else:
            latest_seq = _latest[0]
            # Sequences normally advance by one. An allocation/bridge-preparation
            # failure can consume a sequence before its frame is committed.
            # The sequence span is an upper bound on the number of new frames;
            # copy that bounded suffix, then filter any older references below.
            count = max(0, min(_buffer_count, latest_seq - after_sample_seq))
            start = (_buffer_write_index - count) % _BUFFER_SIZE
            retained = tuple(_buffer[(start + index) % _BUFFER_SIZE] for index in range(count))
    finally:
        _release_snapshot()
    return tuple(_expand_frame(frame) for frame in retained if frame[0] > after_sample_seq)


def clear_state():
    global _latest, _buffer, _buffer_write_index, _buffer_count
    global _sample_seq, _sample_time_ms, _last_sample_ticks_ms
    global _hardware_latest, _drive_latest
    global _clock_ticks_ms, _clock_elapsed_ms, _raw_seq, _last_raw, _raw_timing
    global _range_seq, _range_time_ms, _diagnostics_seq, _diagnostics_time_ms
    global _diagnostics_latest, _course_samples
    global _range_sampled
    begin_range_scope()
    empty_buffer = [None] * _BUFFER_SIZE
    _acquire_snapshot()
    try:
        _latest = None
        _buffer = empty_buffer
        _buffer_write_index = 0
        _buffer_count = 0
        _hardware_latest = None
        _drive_latest = (0.0, 0.0)
    finally:
        _release_snapshot()
    _sample_seq = 0
    _sample_time_ms = 0
    _last_sample_ticks_ms = None
    _clock_ticks_ms = None
    _clock_elapsed_ms = 0
    _raw_seq = 0
    _last_raw = None
    _raw_timing = None
    _range_seq = 0
    _range_time_ms = None
    _diagnostics_seq = 0
    _diagnostics_time_ms = None
    _diagnostics_latest = (None, None, None, None, None)
    _course_samples = False
    _range_sampled = False
