"""The sole UCSB-XRP boundary to physical or simulated XRPLib devices."""

from ._validation import isfinite
from ._run_control import check_stop
from ._telemetry import publish_drive_command, publish_raw_sensors
from ._hardware import get_course_motor, get_course_imu, get_course_rangefinder, read_imu_diagnostics
from ._range import RangeAcquisition, range_scope
from .config import RobotConfig
from .records import DriveCommand, RawSensors, ReflectanceReadings
from .utils import clamp

try:
    from time import ticks_diff as _default_ticks_diff
    from time import ticks_ms as _default_ticks_ms
except ImportError:  # CPython tests
    from time import monotonic

    def _default_ticks_ms():
        return int(monotonic() * 1000.0)

    def _default_ticks_diff(newer, older):
        return newer - older


_DIAGNOSTIC_PERIOD_MS = 250
_ENCODER_COUNTER_MODULUS = 1 << 32
_ENCODER_COUNTER_HALF_RANGE = 1 << 31


def _relative_encoder_count(count, zero):
    """Return a signed count relative to ``zero``, including 32-bit wrap."""
    return (
        (int(count) - int(zero) + _ENCODER_COUNTER_HALF_RANGE)
        % _ENCODER_COUNTER_MODULUS
    ) - _ENCODER_COUNTER_HALF_RANGE


class _XRPLibDevices:
    """Lazy adapter around only the upstream devices the course uses."""

    __slots__ = (
        "left_motor",
        "right_motor",
        "board",
        "rangefinder",
        "reflectance",
        "imu",
    )

    def __init__(self):
        from XRPLib.board import Board

        self.left_motor = get_course_motor(1)
        self.right_motor = get_course_motor(2)
        self.board = Board.get_default_board()
        self.rangefinder = get_course_rangefinder()
        try:
            from XRPLib.reflectance import Reflectance

            self.reflectance = Reflectance.get_default_reflectance()
        except Exception:
            # Older course runtimes remain usable for challenges that do not
            # request reflectance. Challenge 9 reports an unavailable reading.
            self.reflectance = None
        try:
            self.imu = get_course_imu()
        except Exception:
            # Motion and encoder feedback remain usable if optional IMU
            # diagnostics are unavailable.
            self.imu = None


class XRPBot:
    """Read XRP hardware and apply a bounded, signed drive command.

    ``_devices`` and ``_ticks_ms`` are private seams for the virtual XRP and
    interface tests. Student programs construct ``XRPBot(config)``.
    """

    __slots__ = (
        "_config",
        "_devices",
        "_ticks_ms",
        "_last_diagnostics_ms",
        "_left_encoder_zero",
        "_right_encoder_zero",
        "_range",
        "_range_baseline",
        "_range_snapshot",
        "_range_scope",
    )

    def __init__(self, config, _devices=None, _ticks_ms=None):
        if not isinstance(config, RobotConfig):
            raise TypeError("config must be a RobotConfig")
        self._config = config
        self._devices = _XRPLibDevices() if _devices is None else _devices
        self._ticks_ms = _default_ticks_ms if _ticks_ms is None else _ticks_ms
        self._range = self._devices.rangefinder
        if not isinstance(self._range, RangeAcquisition):
            # Private instructor/test adapters may still provide a raw driver.
            self._range = RangeAcquisition(self._range, ticks_ms=self._ticks_ms)
        self._reset_range_sample()
        self._last_diagnostics_ms = None
        self._left_encoder_zero = 0
        self._right_encoder_zero = 0
        self.stop()

    @property
    def config(self):
        return self._config

    def _reset_range_sample(self):
        self._range_baseline = self._range.snapshot[0]
        self._range_snapshot = None
        self._range_scope = range_scope()

    def _check_range_scope(self):
        if self._range_scope != range_scope():
            self._reset_range_sample()

    @property
    def range_sample_seq(self):
        """Latest requested ultrasound attempt identity, or None in a new run."""
        self._check_range_scope()
        return None if self._range_snapshot is None else self._range_snapshot[0]

    @property
    def range_sample_age_s(self):
        """Seconds since that attempt completed; a missing echo has an age too."""
        self._check_range_scope()
        if self._range_snapshot is None:
            return None
        return max(0, _default_ticks_diff(self._ticks_ms(), self._range_snapshot[1])) / 1000.0

    def read(self, include_range=False, include_reflectance=False):
        check_stop()
        if not isinstance(include_range, bool):
            raise TypeError("include_range must be True or False")
        if not isinstance(include_reflectance, bool):
            raise TypeError("include_reflectance must be True or False")

        range_mm = None
        if include_range:
            self._check_range_scope()
            snapshot = self._range.read()
            check_stop()  # A Stop request may have arrived during the echo wait.
            if snapshot[0] > self._range_baseline:
                self._range_snapshot = snapshot
                range_mm = snapshot[2]

        reflectance = None
        reflectance_device = getattr(self._devices, "reflectance", None)
        if include_reflectance and reflectance_device is not None:
            reflectance = ReflectanceReadings(
                reflectance_device.get_left(),
                reflectance_device.get_right(),
            )

        now_ms = int(self._ticks_ms())
        raw = RawSensors(
            time_ms=now_ms,
            left_encoder_count=_relative_encoder_count(
                self._devices.left_motor.get_position_counts(),
                self._left_encoder_zero,
            ),
            right_encoder_count=_relative_encoder_count(
                self._devices.right_motor.get_position_counts(),
                self._right_encoder_zero,
            ),
            range_mm=range_mm,
            button_pressed=bool(self._devices.board.is_button_pressed()),
            reflectance=reflectance,
        )
        try:
            publish_raw_sensors(
                raw,
                range_sampled=include_range,
                range_seq=self.range_sample_seq if include_range else None,
                reflectance_sampled=include_reflectance,
                # Range is part of the control decision. Keep optional
                # battery/IMU I2C reads out of that critical path; their last
                # snapshot remains available and the next non-range read
                # refreshes it immediately when due.
                diagnostics=(
                    None
                    if include_range or include_reflectance
                    else self._read_diagnostics(now_ms)
                ),
            )
        except Exception:
            # Browser diagnostics must never interrupt a student program.
            pass
        return raw

    def reset_encoders(self):
        """Use the current hardware counts as zero for this robot session.

        XRPLib's physical reset executes a dynamically assembled PIO
        instruction. A software offset gives the course API the same relative
        counts without disturbing encoder state machines that are already
        running.
        """
        check_stop()
        self._reset_range_sample()
        self._left_encoder_zero = int(
            self._devices.left_motor.get_position_counts()
        )
        self._right_encoder_zero = int(
            self._devices.right_motor.get_position_counts()
        )

    def wait_for_button(self):
        check_stop()
        self._devices.board.wait_for_button()

    def set_drive(self, command):
        """Apply one normalized command to the left and right motor channels."""
        check_stop()
        if not isinstance(command, DriveCommand):
            self._stop_after_invalid_command()
            raise TypeError("command must be a DriveCommand value")

        left = command.left
        right = command.right
        if (
            isinstance(left, bool)
            or not isinstance(left, (int, float))
            or isinstance(right, bool)
            or not isinstance(right, (int, float))
            or not isfinite(float(left))
            or not isfinite(float(right))
        ):
            self._stop_after_invalid_command()
            raise ValueError("drive commands must be finite real numbers")

        left = float(left)
        right = float(right)

        limit = self._config.max_drive_command
        logical_left = clamp(left, -limit, limit)
        logical_right = clamp(right, -limit, limit)
        left = logical_left * self._config.left_motor_sign
        right = logical_right * self._config.right_motor_sign

        try:
            self._devices.left_motor.set_effort(left)
            self._devices.right_motor.set_effort(right)
            self._publish_drive_safely(DriveCommand(logical_left, logical_right))
        except Exception:
            self._best_effort_stop()
            raise

    def set_efforts(self, efforts):
        """Compatibility alias for :meth:`set_drive`."""
        self.set_drive(efforts)

    def stop(self):
        error = self._best_effort_stop()
        if error is not None:
            raise error

    def _stop_after_invalid_command(self):
        error = self._best_effort_stop()
        if error is not None:
            raise error

    def _best_effort_stop(self):
        first_error = None
        try:
            self._devices.left_motor.set_effort(0.0)
        except Exception as error:
            first_error = error
        try:
            self._devices.right_motor.set_effort(0.0)
        except Exception as error:
            if first_error is None:
                first_error = error
        self._publish_drive_safely(DriveCommand(0.0, 0.0))
        return first_error

    def _publish_drive_safely(self, command):
        try:
            publish_drive_command(command)
        except Exception:
            pass

    def _read_diagnostics(self, now_ms):
        if (
            self._last_diagnostics_ms is not None
            and _default_ticks_diff(now_ms, self._last_diagnostics_ms)
            < _DIAGNOSTIC_PERIOD_MS
        ):
            return None
        self._last_diagnostics_ms = now_ms
        diagnostics = {}
        errors = []
        battery_reader = getattr(self._devices.board, "get_battery_voltage", None)
        if callable(battery_reader):
            try:
                diagnostics["batteryV"] = float(battery_reader())
            except Exception as error:
                errors.append("battery: " + type(error).__name__)
        imu = getattr(self._devices, "imu", None)
        if imu is not None:
            try:
                acceleration, angular_rate, temperature = read_imu_diagnostics(imu)
                diagnostics["accelerationMg"] = acceleration
                diagnostics["angularRateMdps"] = angular_rate
                diagnostics["temperatureC"] = temperature
            except Exception as error:
                errors.append("IMU: " + type(error).__name__)
        if diagnostics or errors:
            diagnostics["sensorError"] = "; ".join(errors) if errors else None
        return diagnostics or None
