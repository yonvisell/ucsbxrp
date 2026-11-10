"""Camera based gps input and Monitor events for pose updates.

GPS timestamps are in the robot acquisition clock before entering this
module. The service owns networking and clock mapping; this module only reads
an immutable latest-value mailbox or an explicitly installed virtual provider.
"""


try:
    from time import ticks_diff as _ticks_diff
except ImportError:  # CPython tests
    def _ticks_diff(newer, older):
        return newer - older

from ._validation import require_int, require_nonnegative, require_number
from .records import Pose, _ValueRecord

try:
    import _thread
    _mailbox_lock = _thread.allocate_lock()
except (ImportError, AttributeError):
    _mailbox_lock = None

_latest_fix = None
_pose_provider = None
_MAX_FIX_AGE_MS = 2000
_GPS_TIMEOUT_MS = 1500
_MAX_CLOCK_UNCERTAINTY_MS = 100.0


class PoseFix(_ValueRecord):
    """One camera-based GPS fix, already mapped to robot tick time.

    ``source_epoch`` changes on source restart. ``sequence`` increases within
    that epoch. Clock uncertainty is an upper bound in milliseconds, supplied
    by the receiver; raw Pi and robot clock readings are not interchangeable.
    """

    __slots__ = ("_pose", "_capture_time_ms", "_received_time_ms", "_sequence",
                 "_source_epoch", "_clock_uncertainty_ms")
    _field_names = ("pose", "capture_time_ms", "received_time_ms", "sequence",
                    "source_epoch", "clock_uncertainty_ms")

    def __init__(self, pose, capture_time_ms, received_time_ms, sequence,
                 source_epoch, clock_uncertainty_ms=0.0):
        if not isinstance(pose, Pose):
            raise TypeError("pose must be a Pose")
        # This is an external-data boundary, including in release builds.
        require_number("pose.x_mm", pose.x_mm)
        require_number("pose.y_mm", pose.y_mm)
        require_number("pose.heading_rad", pose.heading_rad)
        self._pose = pose
        self._capture_time_ms = require_int("capture_time_ms", capture_time_ms, 0)
        self._received_time_ms = require_int("received_time_ms", received_time_ms, 0)
        self._sequence = require_int("sequence", sequence, 0)
        if not isinstance(source_epoch, str) or not 1 <= len(source_epoch) <= 64:
            raise ValueError("source_epoch must be a nonempty string of at most 64 characters")
        self._source_epoch = source_epoch
        self._clock_uncertainty_ms = require_nonnegative(
            "clock_uncertainty_ms", clock_uncertainty_ms
        )

    @property
    def pose(self):
        return self._pose

    @property
    def capture_time_ms(self):
        return self._capture_time_ms

    @property
    def received_time_ms(self):
        return self._received_time_ms

    @property
    def sequence(self):
        return self._sequence

    @property
    def source_epoch(self):
        return self._source_epoch

    @property
    def clock_uncertainty_ms(self):
        return self._clock_uncertainty_ms


def publish_pose_fix(fix):
    """Replace the service mailbox; the producer has already checked identity."""
    global _latest_fix
    if not isinstance(fix, PoseFix):
        raise TypeError("fix must be a PoseFix")
    if _mailbox_lock is not None:
        _mailbox_lock.acquire()
    try:
        _latest_fix = fix
    finally:
        if _mailbox_lock is not None:
            _mailbox_lock.release()


def clear_pose_fix():
    """Invalidate the mailbox when the source or robot binding is removed."""
    global _latest_fix
    if _mailbox_lock is not None:
        _mailbox_lock.acquire()
    try:
        _latest_fix = None
    finally:
        if _mailbox_lock is not None:
            _mailbox_lock.release()


def set_pose_provider(provider):
    """Install a nonblocking ``provider(now_ms) -> PoseFix | None`` callback."""
    global _pose_provider
    if provider is not None and not callable(provider):
        raise TypeError("provider must be callable or None")
    _pose_provider = provider


def latest_pose_fix(now_ms):
    """Read one immutable GPS fix without network or queue processing."""
    if _pose_provider is not None:
        fix = _pose_provider(now_ms)
    else:
        if _mailbox_lock is not None:
            _mailbox_lock.acquire()
        try:
            fix = _latest_fix
        finally:
            if _mailbox_lock is not None:
                _mailbox_lock.release()
    return fix


ticks_diff = _ticks_diff


class GPSInput:
    """Pass each camera fix once and retain its Monitor event."""

    def __init__(self, enabled=True):
        self.enabled = enabled
        self._epoch = None
        self._sequence = -1
        self.reset(0)

    def reset(self, time_ms):
        self._start_ms = time_ms
        self._capture_ms = None
        self._pending = None
        self._event = None
        self._fix = None

    def read(self, time_ms):
        self._event = None
        self._fix = None
        if not self.enabled:
            return None
        latest = latest_pose_fix(time_ms)
        if latest is not None:
            self._pending = latest
        fix = self._pending
        if fix is None:
            return None
        if _ticks_diff(fix.received_time_ms, time_ms) > 0 or _ticks_diff(fix.capture_time_ms, time_ms) > 0:
            return None
        self._pending = None
        if fix.source_epoch == self._epoch and fix.sequence <= self._sequence:
            return None
        self._epoch, self._sequence = fix.source_epoch, fix.sequence
        if _ticks_diff(fix.capture_time_ms, self._start_ms) < 0:
            return None
        if self._capture_ms is not None and _ticks_diff(fix.capture_time_ms, self._capture_ms) <= 0:
            return None
        if (_ticks_diff(fix.received_time_ms, fix.capture_time_ms) < 0
                or _ticks_diff(time_ms, fix.capture_time_ms) > _MAX_FIX_AGE_MS
                or fix.clock_uncertainty_ms > _MAX_CLOCK_UNCERTAINTY_MS):
            return None
        self._fix = fix
        self._event = (fix.pose.x_mm, fix.pose.y_mm, fix.pose.heading_rad,
                       fix.capture_time_ms, fix.received_time_ms, fix.sequence,
                       fix.source_epoch, fix.clock_uncertainty_ms)
        return fix

    def ready(self, time_ms):
        return not self.enabled or (self._capture_ms is not None
            and _ticks_diff(time_ms, self._capture_ms) <= _GPS_TIMEOUT_MS)

    def snapshot(self, time_ms, accepted_capture_ms, include_event=True):
        self._capture_ms = accepted_capture_ms
        age = None if accepted_capture_ms is None else _ticks_diff(time_ms, accepted_capture_ms)
        status = ('wheel_only' if not self.enabled else 'awaiting_camera' if age is None
                  else 'camera' if age <= _GPS_TIMEOUT_MS else 'camera_stale')
        event_status = None
        if include_event and self._fix is not None:
            event_status = 'accepted' if accepted_capture_ms == self._fix.capture_time_ms else 'outside_history'
        # The first three fields formerly held a separate wheel-only trajectory.
        return (None, None, None, status, age,
                self._event if include_event else None, None, event_status)
