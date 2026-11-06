"""Supplied timing and camera-based GPS support for student pose updates.

GPS timestamps are in the robot acquisition clock before entering this
module. The service owns networking and clock mapping; this module only reads
an immutable latest-value mailbox or an explicitly installed virtual provider.
"""

from math import cos, sin

try:
    from time import ticks_add as _ticks_add, ticks_diff as _ticks_diff
except ImportError:  # CPython tests
    def _ticks_add(value, delta):
        return value + delta

    def _ticks_diff(newer, older):
        return newer - older

from ._build_config import DEBUG_VALIDATION
from ._validation import require_bool, require_int, require_nonnegative, require_number
from .config import RobotConfig
from .records import Measurements, Pose, _ValueRecord
from .utils import wrap_angle_rad

try:
    import _thread
    _mailbox_lock = _thread.allocate_lock()
except (ImportError, AttributeError):
    _mailbox_lock = None

_latest_fix = None
_pose_provider = None
_HISTORY_SIZE = 128
_MAX_FIX_AGE_MS = 2000
_GPS_TIMEOUT_MS = 1500
_MAX_CLOCK_UNCERTAINTY_MS = 100.0
_MAX_SOURCE_EPOCHS = 16


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
    # The service can publish just after this cycle's encoder acquisition.
    # Leave that observation for the next cycle instead of consuming it early.
    if fix is not None and _ticks_diff(fix.received_time_ms, now_ms) > 0:
        return None
    return fix


class LocalizationBase:
    """Use camera-based GPS and wheel travel to maintain world position and heading.

    ``wheel_pose`` always integrates wheels alone. ``pose`` is the estimate
    used by navigation. GPS supplies world pose at capture time; subsequent
    wheel translation and rotation advance that pose to the current sample.
    """

    __slots__ = ("_config", "_use_gps", "_pose",
                 "_wheel_pose", "_transform", "_history", "_history_next",
                 "_history_count", "_time_ms", "_source_epoch",
                 "_source_sequences", "_source_sequence_epochs", "_retired_epochs", "_accepted_capture_ms",
                 "_observation_event", "_innovation_event", "_fix_status")

    def __init__(self, config, use_gps=True):
        if not isinstance(config, RobotConfig):
            raise TypeError("config must be a RobotConfig")
        self._config = config
        self._use_gps = require_bool("use_gps", use_gps)
        self._pose = None
        self._wheel_pose = None
        self._transform = None
        self._history = [None] * _HISTORY_SIZE if use_gps else None
        self._history_next = 0
        self._history_count = 0
        self._time_ms = None
        self._source_epoch = None
        self._source_sequences = {}
        self._source_sequence_epochs = []
        self._retired_epochs = []
        self._accepted_capture_ms = None
        self._observation_event = None
        self._innovation_event = None
        self._fix_status = None

    @property
    def config(self):
        return self._config

    @property
    def pose(self):
        if self._pose is None:
            raise RuntimeError("call reset(initial_pose) before reading pose")
        return self._pose

    @property
    def wheel_pose(self):
        if self._wheel_pose is None:
            raise RuntimeError("call reset(initial_pose) before reading wheel_pose")
        return self._wheel_pose

    def reset(self, initial_pose, time_ms=None):
        """Establish a new run's pose; Robot also supplies its acquisition time.

        Without time_ms, the next Measurements.dt_s defines the first interval.
        GPS identity guards survive reset so a cached fix is not reused.
        """
        if not isinstance(initial_pose, Pose):
            raise TypeError("initial_pose must be a Pose")
        require_number("initial_pose.x_mm", initial_pose.x_mm)
        require_number("initial_pose.y_mm", initial_pose.y_mm)
        require_number("initial_pose.heading_rad", initial_pose.heading_rad)
        if time_ms is not None:
            time_ms = require_int("time_ms", time_ms, 0)
        self._pose = initial_pose
        self._wheel_pose = initial_pose
        self._transform = None
        self._time_ms = time_ms
        self._history_next = 0
        self._history_count = 0
        if self._history is not None:
            for index in range(_HISTORY_SIZE):
                self._history[index] = None
            if time_ms is not None:
                self._remember(time_ms, initial_pose, 0.0, 0.0)
        self._accepted_capture_ms = None
        self._observation_event = None
        self._innovation_event = None
        self._fix_status = None
        return initial_pose

    def predict(self, pose, left_increment_mm, right_increment_mm):
        """Return a new Pose from signed wheel increments; retain no state."""
        raise NotImplementedError

    def update_pose(self, pose, left_increment_mm, right_increment_mm, gps_pose=None):
        """Predict from wheel travel, then replace with the current GPS pose if available."""
        predicted_pose = self.predict(pose, left_increment_mm, right_increment_mm)
        if gps_pose is not None:
            return gps_pose
        return predicted_pose

    def gps_ready(self, now_ms=None):
        """Whether this run has a recent accepted GPS fix."""
        if not self._use_gps:
            return True
        if self._accepted_capture_ms is None:
            return False
        now_ms = self._time_ms if now_ms is None else now_ms
        return 0 <= _ticks_diff(now_ms, self._accepted_capture_ms) <= _GPS_TIMEOUT_MS

    def update(self, measurements, fix=None):
        """Advance pose from wheel travel and apply each usable GPS fix once."""
        if self._pose is None:
            raise RuntimeError("call reset(initial_pose) before update")
        if DEBUG_VALIDATION and not isinstance(measurements, Measurements):
            raise TypeError("measurements must be Measurements")
        now_ms = measurements.time_ms
        if self._time_ms is not None and _ticks_diff(now_ms, self._time_ms) <= 0:
            raise ValueError("Measurements.time_ms must advance between localization updates")
        if self._use_gps and self._time_ms is None:
            origin_ms = _ticks_add(now_ms, -int(round(measurements.dt_s * 1000.0)))
            self._remember(origin_ms, self._wheel_pose, 0.0, 0.0)
        left = measurements.left_increment_mm
        right = measurements.right_increment_mm
        if self._use_gps:
            self._wheel_pose = self.predict(self._wheel_pose, left, right)
        self._time_ms = now_ms
        self._observation_event = None
        self._innovation_event = None
        self._fix_status = None
        if self._use_gps:
            self._remember(now_ms, self._wheel_pose, left, right)
            if fix is None:
                fix = latest_pose_fix(now_ms)
            if fix is not None:
                self._observe(fix, now_ms)
        # A new fix supplies a pose advanced from capture time to this sample.
        gps_pose = self._mapped_pose(self._wheel_pose) if self._fix_status == "accepted" else None
        self._pose = self.update_pose(self._pose, left, right, gps_pose)
        if not self._use_gps:
            self._wheel_pose = self._pose
        return self._pose

    # Robot binds this measured-input interface once; legacy Odometry is intact.
    def _update_measurements(self, measurements):
        return self.update(measurements)

    def _remember(self, time_ms, pose, left, right):
        self._history[self._history_next] = (time_ms, pose, left, right)
        self._history_next = (self._history_next + 1) % _HISTORY_SIZE
        self._history_count = min(self._history_count + 1, _HISTORY_SIZE)

    def _wheel_at(self, capture_ms):
        oldest = (self._history_next - self._history_count) % _HISTORY_SIZE
        previous = self._history[oldest]
        if _ticks_diff(capture_ms, previous[0]) < 0:
            return None
        if capture_ms == previous[0]:
            return previous[1]
        for offset in range(1, self._history_count):
            current = self._history[(oldest + offset) % _HISTORY_SIZE]
            elapsed = _ticks_diff(capture_ms, previous[0])
            duration = _ticks_diff(current[0], previous[0])
            if 0 <= elapsed <= duration:
                if elapsed == duration:
                    return current[1]
                fraction = elapsed / duration
                return self.predict(previous[1], fraction * current[2], fraction * current[3])
            previous = current
        return None

    def _mapped_pose(self, wheel_pose):
        if self._transform is None:
            return wheel_pose
        x, y, heading, cosine, sine = self._transform
        return Pose(x + cosine * wheel_pose.x_mm - sine * wheel_pose.y_mm,
                    y + sine * wheel_pose.x_mm + cosine * wheel_pose.y_mm,
                    wheel_pose.heading_rad + heading)

    def _observe(self, fix, now_ms):
        if not isinstance(fix, PoseFix):
            raise TypeError("fix must be a PoseFix or None")
        epoch = fix.source_epoch
        last_sequence = self._source_sequences.get(epoch, -1)
        if fix.sequence <= last_sequence:
            return
        self._observation_event = (
            fix.pose.x_mm, fix.pose.y_mm, fix.pose.heading_rad,
            fix.capture_time_ms, fix.received_time_ms, fix.sequence,
            epoch, fix.clock_uncertainty_ms,
        )
        if epoch not in self._source_sequences:
            if len(self._source_sequences) >= _MAX_SOURCE_EPOCHS:
                # Keep the active sequence even after many rejected sources.
                oldest = 1 if self._source_sequence_epochs[0] == self._source_epoch else 0
                del self._source_sequences[self._source_sequence_epochs.pop(oldest)]
            self._source_sequence_epochs.append(epoch)
        self._source_sequences[epoch] = fix.sequence
        if epoch in self._retired_epochs:
            self._fix_status = "retired_source"
            return
        age = _ticks_diff(now_ms, fix.capture_time_ms)
        if age < 0 or _ticks_diff(now_ms, fix.received_time_ms) < 0:
            self._fix_status = "future"
            return
        if _ticks_diff(fix.received_time_ms, fix.capture_time_ms) < 0:
            self._fix_status = "invalid_timing"
            return
        if fix.clock_uncertainty_ms > _MAX_CLOCK_UNCERTAINTY_MS:
            self._fix_status = "clock_uncertain"
            return
        if age > _MAX_FIX_AGE_MS:
            self._fix_status = "stale"
            return
        if self._accepted_capture_ms is not None and _ticks_diff(
            fix.capture_time_ms, self._accepted_capture_ms
        ) <= 0:
            self._fix_status = "out_of_order"
            return
        wheel_at_capture = self._wheel_at(fix.capture_time_ms)
        if wheel_at_capture is None:
            self._fix_status = "outside_history"
            return
        predicted = self._mapped_pose(wheel_at_capture)
        corrected = fix.pose
        self._innovation_event = (
            fix.pose.x_mm - predicted.x_mm,
            fix.pose.y_mm - predicted.y_mm,
            wrap_angle_rad(fix.pose.heading_rad - predicted.heading_rad),
        )
        heading = wrap_angle_rad(corrected.heading_rad - wheel_at_capture.heading_rad)
        cosine, sine = cos(heading), sin(heading)
        self._transform = (
            corrected.x_mm - cosine * wheel_at_capture.x_mm + sine * wheel_at_capture.y_mm,
            corrected.y_mm - sine * wheel_at_capture.x_mm - cosine * wheel_at_capture.y_mm,
            heading, cosine, sine,
        )
        if self._source_epoch is not None and epoch != self._source_epoch:
            if len(self._retired_epochs) >= _MAX_SOURCE_EPOCHS:
                self._retired_epochs.pop(0)
            self._retired_epochs.append(self._source_epoch)
        self._source_epoch = epoch
        self._accepted_capture_ms = fix.capture_time_ms
        self._fix_status = "accepted"

    def _telemetry_snapshot(self, include_event=True):
        """Compact immutable wheel/observation/innovation evidence for a sample."""
        age = None
        if not self._use_gps:
            status = "wheel_only"
        elif self._accepted_capture_ms is None:
            status = "awaiting_camera"
        else:
            age = max(0, _ticks_diff(self._time_ms, self._accepted_capture_ms))
            status = "camera" if self.gps_ready() else "camera_stale"
        wheel = self.wheel_pose
        return (wheel.x_mm, wheel.y_mm, wheel.heading_rad, status, age,
                self._observation_event if include_event else None,
                self._innovation_event if include_event else None,
                self._fix_status if include_event else None)
