"""One course-owned ultrasound attempt stream, with no background work."""

from ._validation import isfinite

try:
    from time import ticks_diff as _ticks_diff
    from time import ticks_ms as _ticks_ms
except ImportError:  # CPython tests
    from time import monotonic

    def _ticks_ms():
        return int(monotonic() * 1000.0)

    def _ticks_diff(newer, older):
        return newer - older


# The HC-SR04-33 supplier recommends more than 60 ms between triggers.
# This interval is shared by physical and virtual course programs.
RANGE_INTERVAL_MS = 70
MAXIMUM_RANGE_MM = 4000.0
_scope = 0


def range_scope():
    return _scope


def begin_range_scope():
    """Discard previous-run identity without cancelling the acoustic cooldown."""
    global _scope
    _scope += 1


class RangeAcquisition:
    """Retain one completed attempt, including a missing echo, during cooldown."""

    __slots__ = ("_device", "_ticks_ms", "_ticks_diff", "_started_ms", "_error", "snapshot")

    def __init__(self, device, ticks_ms=None, ticks_diff=None):
        self._device = device
        self._ticks_ms = _ticks_ms if ticks_ms is None else ticks_ms
        self._ticks_diff = _ticks_diff if ticks_diff is None else ticks_diff
        self._started_ms = None
        self._error = None
        # Sequence, actual completion ticks, and millimetres or None.
        self.snapshot = (0, None, None)

    def read(self):
        now_ms = self._ticks_ms()
        if self._started_ms is not None:
            age_ms = self._ticks_diff(now_ms, self._started_ms)
            if 0 <= age_ms < RANGE_INTERVAL_MS:
                if self._error is not None:
                    raise self._error
                return self.snapshot

        self._started_ms = now_ms
        sequence = self.snapshot[0] + 1
        distance_mm = None
        self._error = None
        try:
            distance_cm = self._device.distance()
            if (
                isinstance(distance_cm, (int, float))
                and not isinstance(distance_cm, bool)
                and isfinite(float(distance_cm))
                and 0.0 < distance_cm <= MAXIMUM_RANGE_MM / 10.0
            ):
                distance_mm = float(distance_cm) * 10.0
        except Exception as error:
            self._error = error
            raise
        finally:
            # Faults also retire the old value and obey the trigger interval.
            # Unexpected hardware exceptions still propagate to stop the run.
            self.snapshot = (sequence, self._ticks_ms(), distance_mm)
        return self.snapshot
