"""The sole UCSB-XRP boundary to physical or simulated XRPLib devices."""

from ._validation import isfinite
from .config import RobotConfig
from .records import MotorEfforts, RawSensors
from .utils import clamp

try:
    from time import ticks_ms as _default_ticks_ms
except ImportError:  # CPython tests
    from time import monotonic

    def _default_ticks_ms():
        return int(monotonic() * 1000.0)


class _XRPLibDevices:
    """Lazy adapter around only the upstream devices the course uses."""

    __slots__ = ("left_motor", "right_motor", "board", "rangefinder")

    def __init__(self):
        from XRPLib.board import Board
        from XRPLib.encoded_motor import EncodedMotor
        from XRPLib.rangefinder import Rangefinder

        self.left_motor = EncodedMotor.get_default_encoded_motor(index=1)
        self.right_motor = EncodedMotor.get_default_encoded_motor(index=2)
        self.board = Board.get_default_board()
        self.rangefinder = Rangefinder.get_default_rangefinder()


class XRPBot:
    """Read XRP hardware and apply bounded, signed motor effort.

    ``_devices`` and ``_ticks_ms`` are private seams for the virtual XRP and
    contract tests. Student programs construct ``XRPBot(config)``.
    """

    __slots__ = ("_config", "_devices", "_ticks_ms")

    def __init__(self, config, _devices=None, _ticks_ms=None):
        if not isinstance(config, RobotConfig):
            raise TypeError("config must be a RobotConfig")
        self._config = config
        self._devices = _XRPLibDevices() if _devices is None else _devices
        self._ticks_ms = _default_ticks_ms if _ticks_ms is None else _ticks_ms
        self.stop()

    @property
    def config(self):
        return self._config

    def read(self, include_range=False):
        if not isinstance(include_range, bool):
            raise TypeError("include_range must be True or False")

        range_mm = None
        if include_range:
            range_cm = self._devices.rangefinder.distance()
            if (
                isinstance(range_cm, (int, float))
                and not isinstance(range_cm, bool)
                and isfinite(float(range_cm))
                and range_cm > 0.0
                and range_cm < 65535
            ):
                range_mm = float(range_cm) * 10.0

        return RawSensors(
            time_ms=int(self._ticks_ms()),
            left_encoder_count=int(
                self._devices.left_motor.get_position_counts()
            ),
            right_encoder_count=int(
                self._devices.right_motor.get_position_counts()
            ),
            range_mm=range_mm,
            button_pressed=bool(self._devices.board.is_button_pressed()),
        )

    def reset_encoders(self):
        first_error = None
        try:
            self._devices.left_motor.reset_encoder_position()
        except Exception as error:
            first_error = error
        try:
            self._devices.right_motor.reset_encoder_position()
        except Exception as error:
            if first_error is None:
                first_error = error
        if first_error is not None:
            raise first_error

    def wait_for_button(self):
        self._devices.board.wait_for_button()

    def set_efforts(self, efforts):
        if not isinstance(efforts, MotorEfforts):
            self._stop_after_invalid_command()
            raise TypeError("efforts must be a MotorEfforts value")

        left = efforts.left
        right = efforts.right
        if (
            isinstance(left, bool)
            or not isinstance(left, (int, float))
            or isinstance(right, bool)
            or not isinstance(right, (int, float))
            or not isfinite(float(left))
            or not isfinite(float(right))
        ):
            self._stop_after_invalid_command()
            raise ValueError("motor efforts must be finite real numbers")

        left = float(left)
        right = float(right)

        limit = self._config.max_effort
        left = clamp(left, -limit, limit) * self._config.left_motor_sign
        right = clamp(right, -limit, limit) * self._config.right_motor_sign

        try:
            self._devices.left_motor.set_effort(left)
            self._devices.right_motor.set_effort(right)
        except Exception:
            self._best_effort_stop()
            raise

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
        return first_error
