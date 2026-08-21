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
    """Convert raw sensor readings into measured robot motion and range.

    A sensor model keeps the encoder and time origins established by
    :meth:`reset`, plus any state required to estimate wheel speed.  Its
    :meth:`update` method returns the wheel distances, increments, and speeds
    used by the wheel controller, odometry, and mission code.
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
    """Convert requested and measured wheel speeds into motor commands.

    ``Robot`` supplies the requested speeds from ``DifferentialDrive`` and the
    measured speeds from ``SensorModel``.  An implementation may keep
    controller state between calls and must return a bounded ``DriveCommand``.
    """

    __slots__ = ()

    def reset(self):
        """Clear controller state before a run."""
        raise NotImplementedError

    def update(self, target, measured):
        """Return a DriveCommand for target and measured WheelSpeeds."""
        raise NotImplementedError


class DifferentialDriveBase(_ConfiguredComponent):
    """Convert a requested body motion into left and right wheel speeds.

    The calculation uses the robot track width from ``RobotConfig``.  Each call
    is independent; an implementation need not retain information from an
    earlier call.  ``Robot`` sends the returned speeds to the wheel controller.
    """

    __slots__ = ()

    def wheel_speeds(self, command):
        """Convert one MotionCommand into target WheelSpeeds."""
        raise NotImplementedError


class OdometryBase(_ConfiguredComponent):
    """Estimate robot pose from measured left and right wheel travel.

    After :meth:`reset`, an implementation keeps the latest ``Pose``. ``Robot``
    passes the wheel-distance increments returned by ``SensorModel`` and uses
    the updated pose for navigation, mission logic, and telemetry.  Simulator
    ground truth is never an input to this component.
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
    """Generate motion commands for an ordered sequence of navigation goals.

    An implementation keeps the goal sequence, the active goal, and any
    internal navigation mode. Mission code supplies the latest odometry
    ``Pose`` and sends the returned ``MotionCommand`` to ``Robot``.
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
    """Find a shortest route through free neighboring occupancy-grid cells.

    Search data may remain local to :meth:`plan`. Mission code converts the
    returned ``GridPath`` to navigation goals before the measured robot loop
    follows them.
    """

    __slots__ = ()

    def plan(self, grid, start, goal):
        """Return a shortest GridPath, or None when no valid path exists."""
        raise NotImplementedError
