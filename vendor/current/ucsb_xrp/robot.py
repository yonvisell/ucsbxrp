"""The measured sample loop shared by all five course challenges."""

try:
    from time import sleep_ms as _default_sleep_ms
    from time import ticks_diff as _ticks_diff
    from time import ticks_ms as _default_ticks_ms
except ImportError:  # CPython tests
    from time import monotonic, sleep

    def _default_sleep_ms(duration_ms):
        sleep(duration_ms / 1000.0)

    def _default_ticks_ms():
        return int(monotonic() * 1000.0)

    def _ticks_diff(newer, older):
        return newer - older

from .config import RobotConfig
from ._telemetry import publish_state
from .records import MotionCommand, MotorEfforts, Pose, RobotState


class Robot:
    """Assemble selected components into one explicit measure/control loop."""

    __slots__ = (
        "_config",
        "_bot",
        "_sensor_model",
        "_wheel_controller",
        "_differential_drive",
        "_odometry",
        "_sleep_ms",
        "_ticks_ms",
        "_state",
        "_last_overrun_ms",
    )

    def __init__(
        self,
        config,
        bot,
        sensor_model,
        wheel_controller,
        differential_drive,
        odometry,
        _sleep_ms=None,
        _ticks_ms=None,
    ):
        if not isinstance(config, RobotConfig):
            raise TypeError("config must be a RobotConfig")
        required = (
            (bot, ("read", "reset_encoders", "wait_for_button", "set_efforts", "stop")),
            (sensor_model, ("reset", "update", "estimate_range")),
            (wheel_controller, ("reset", "update")),
            (differential_drive, ("wheel_speeds",)),
            (odometry, ("reset", "update")),
        )
        for component, methods in required:
            if any(not callable(getattr(component, name, None)) for name in methods):
                raise TypeError("robot component does not implement " + ", ".join(methods))
        self._config = config
        self._bot = bot
        self._sensor_model = sensor_model
        self._wheel_controller = wheel_controller
        self._differential_drive = differential_drive
        self._odometry = odometry
        self._sleep_ms = _default_sleep_ms if _sleep_ms is None else _sleep_ms
        self._ticks_ms = _default_ticks_ms if _ticks_ms is None else _ticks_ms
        self._state = None
        self._last_overrun_ms = 0

    @property
    def config(self):
        return self._config

    @property
    def state(self):
        if self._state is None:
            raise RuntimeError("call start(initial_pose) before reading state")
        return self._state

    @property
    def last_overrun_ms(self):
        """Milliseconds by which the latest calculation exceeded its period."""
        return self._last_overrun_ms

    def start(self, initial_pose):
        if not isinstance(initial_pose, Pose):
            raise TypeError("initial_pose must be a Pose")
        self._bot.wait_for_button()
        self._bot.reset_encoders()
        raw = self._bot.read(include_range=False)
        measurements = self._sensor_model.reset(raw)
        self._wheel_controller.reset()
        pose = self._odometry.reset(initial_pose)
        self._state = RobotState(measurements, pose)
        publish_state(self._state)
        self._last_overrun_ms = 0
        return self._state

    def step(self, command, read_range=False):
        if self._state is None:
            raise RuntimeError("call start(initial_pose) before step(command)")
        if not isinstance(command, MotionCommand):
            raise TypeError("command must be a MotionCommand")
        if not isinstance(read_range, bool):
            raise TypeError("read_range must be True or False")

        started_ms = self._ticks_ms()
        try:
            target = self._differential_drive.wheel_speeds(command)
            efforts = self._wheel_controller.update(
                target,
                self._state.measurements.wheel_speeds,
            )
            self._bot.set_efforts(efforts)
            calculation_ms = max(0, _ticks_diff(self._ticks_ms(), started_ms))
            remaining_ms = self.config.sample_period_ms - calculation_ms
            self._last_overrun_ms = max(0, -remaining_ms)
            if remaining_ms > 0:
                self._sleep_ms(remaining_ms)
            raw = self._bot.read(include_range=read_range)
            measurements = self._sensor_model.update(raw)
            pose = self._odometry.update(
                measurements.left_increment_mm,
                measurements.right_increment_mm,
            )
            self._state = RobotState(measurements, pose)
            publish_state(self._state, efforts)
            return self._state
        except Exception:
            self._bot.stop()
            raise

    def estimate_range(self, samples, minimum_usable):
        return self._sensor_model.estimate_range(samples, minimum_usable)

    def stop(self):
        self._bot.stop()
        if self._state is not None:
            publish_state(self._state, MotorEfforts(0.0, 0.0))
