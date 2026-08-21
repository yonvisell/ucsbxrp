"""Small component interfaces implemented progressively by students."""

from .config import NavigationConfig, RobotConfig


class _ConfiguredComponent:
    __slots__ = ("_config",)

    def __init__(self, config):
        if not isinstance(config, RobotConfig):
            raise TypeError("config must be a RobotConfig")
        self._config = config

    @property
    def config(self):
        return self._config


class SensorModelBase(_ConfiguredComponent):
    """Own raw-sensor conversion and the state of measured wheel estimates.

    Implementations receive ``RawSensors`` from ``Robot``. They maintain
    encoder/time origins and any wheel-speed estimator state, then provide
    ``Measurements`` consumed by the wheel controller, odometry, and mission.
    """

    __slots__ = ()

    def reset(self, raw):
        """Establish measurement state and return zero-travel Measurements."""
        raise NotImplementedError

    def update(self, raw):
        """Convert the next RawSensors value into Measurements."""
        raise NotImplementedError

    def estimate_range(self, samples, minimum_usable):
        """Return a robust range estimate or None when too few samples work."""
        raise NotImplementedError


class WheelSpeedControllerBase(_ConfiguredComponent):
    """Own conversion of target and measured wheel speed to motor command.

    ``Robot`` supplies ``WheelSpeeds`` from ``DifferentialDrive`` and
    ``SensorModel``. Implementations may maintain controller state and return a
    bounded ``DriveCommand`` for ``XRPBot``.
    """

    __slots__ = ()

    def reset(self):
        """Clear controller state before a run."""
        raise NotImplementedError

    def update(self, target, measured):
        """Return a DriveCommand for target and measured WheelSpeeds."""
        raise NotImplementedError


class DifferentialDriveBase(_ConfiguredComponent):
    """Own inverse kinematics from body motion to wheel-speed targets.

    The calculation receives a ``MotionCommand`` and uses robot track width. It
    normally requires no persistent state. ``Robot`` sends the returned
    ``WheelSpeeds`` to the wheel-speed controller.
    """

    __slots__ = ()

    def wheel_speeds(self, command):
        """Convert one MotionCommand into target WheelSpeeds."""
        raise NotImplementedError


class OdometryBase(_ConfiguredComponent):
    """Own the pose estimate produced from measured wheel-distance increments.

    Implementations maintain the latest ``Pose`` after ``reset``. ``Robot``
    passes increments from ``SensorModel`` and publishes the returned pose for
    navigation, mission logic, and telemetry. Simulator truth is not an input.
    """

    __slots__ = ()

    def reset(self, initial_pose):
        """Establish and return the pose for a new run."""
        raise NotImplementedError

    def update(self, left_increment_mm, right_increment_mm):
        """Integrate one measured differential-drive increment into Pose."""
        raise NotImplementedError

    @property
    def pose(self):
        """Return the latest Pose after reset()."""
        raise NotImplementedError


class NavigationControllerBase:
    """Own progress through ordered world-frame navigation goals.

    Implementations maintain the active goal and any navigation mode. Mission
    code supplies the latest odometry ``Pose`` and sends the returned
    ``MotionCommand`` to ``Robot``.
    """

    __slots__ = ("_config",)

    def __init__(self, config):
        if not isinstance(config, NavigationConfig):
            raise TypeError("config must be a NavigationConfig")
        self._config = config

    @property
    def config(self):
        return self._config

    def start(self, goals):
        """Store an ordered navigation-goal sequence and begin it."""
        raise NotImplementedError

    def update(self, pose):
        """Return the next MotionCommand from the latest odometry Pose."""
        raise NotImplementedError

    def current_goal(self):
        """Return the active NavigationGoal, or None after completion."""
        raise NotImplementedError

    def is_complete(self):
        """Return whether every required position and heading is complete."""
        raise NotImplementedError


class GridPlannerBase:
    """Own shortest-path search over free four-neighbor grid cells.

    Search state may remain local to ``plan``. Mission code converts the
    returned ``GridPath`` to navigation goals; no robot service calls this
    component inside the measured control loop.
    """

    __slots__ = ()

    def plan(self, grid, start, goal):
        """Return a shortest GridPath, or None when no valid path exists."""
        raise NotImplementedError
