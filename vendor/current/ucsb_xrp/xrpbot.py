"""The sole UCSB-XRP boundary to physical or simulated XRPLib devices."""

from ._validation import isfinite
from ._run_control import check_stop
from ._telemetry import publish_drive_command, publish_raw_sensors
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
        from XRPLib.encoded_motor import EncodedMotor
        from XRPLib.rangefinder import Rangefinder

        self.left_motor = EncodedMotor.get_default_encoded_motor(index=1)
        self.right_motor = EncodedMotor.get_default_encoded_motor(index=2)
        self.board = Board.get_default_board()
        self.rangefinder = Rangefinder.get_default_rangefinder()
        try:
            from XRPLib.reflectance import Reflectance

            self.reflectance = Reflectance.get_default_reflectance()
        except Exception:
            # Older course runtimes remain usable for challenges that do not
            # request reflectance. Challenge 9 reports an unavailable reading.
            self.reflectance = None
        try:
            from XRPLib.imu import IMU

            self.imu = IMU.get_default_imu()
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
    )

    def __init__(self, config, _devices=None, _ticks_ms=None):
        if not isinstance(config, RobotConfig):
            raise TypeError("config must be a RobotConfig")
        self._config = config
        self._devices = _XRPLibDevices() if _devices is None else _devices
        self._ticks_ms = _default_ticks_ms if _ticks_ms is None else _ticks_ms
        self._last_diagnostics_ms = None
        self._left_encoder_zero = 0
        self._right_encoder_zero = 0
        self.stop()

    @property
    def config(self):
        return self._config

    def read(self, include_range=False, include_reflectance=False):
        check_stop()
        if not isinstance(include_range, bool):
            raise TypeError("include_range must be True or False")
        if not isinstance(include_reflectance, bool):
            raise TypeError("include_reflectance must be True or False")

        range_mm = None
        if include_range:
            range_cm = self._devices.rangefinder.distance()
            if (
                isinstance(range_cm, (int, float))
                and not isinstance(range_cm, bool)
                and isfinite(float(range_cm))
                and range_cm > 0.0
                and range_cm <= 400.0
            ):
                range_mm = float(range_cm) * 10.0

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
                diagnostics["accelerationMg"] = list(imu.get_acc_rates())
                diagnostics["angularRateMdps"] = list(imu.get_gyro_rates())
                diagnostics["temperatureC"] = float(imu.temperature())
            except Exception as error:
                errors.append("IMU: " + type(error).__name__)
        if diagnostics or errors:
            diagnostics["sensorError"] = "; ".join(errors) if errors else None
        return diagnostics or None
