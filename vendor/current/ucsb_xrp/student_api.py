"""Small component interfaces implemented progressively by students."""

from math import isfinite

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
    """Find a connected route through free occupancy-grid cells.

    Search data may remain local to :meth:`plan`. Mission code converts the
    returned ``GridPath`` to navigation goals before the measured robot loop
    follows them.
    """

    __slots__ = ()

    def plan(self, grid, start, goal):
        """Return a valid GridPath, or None when no connected route exists."""
        raise NotImplementedError


class LineFollowerBase:
    """Convert two floor-reflectance readings into local robot motion.

    Reflectance is normalized from 0 (light) to 1 (dark). Positive line error
    means the line is nearer the left sensor and therefore requests a positive
    (counterclockwise) turn rate. Implementations may retain feedback state
    between calls; :meth:`reset` clears it before each run.
    """

    __slots__ = ("settings", "last_error", "integral_error", "line_error")

    def __init__(self, settings):
        if not isinstance(settings, dict):
            raise TypeError("settings must be a dict")
        self.settings = settings
        self.reset()

    def reset(self):
        """Clear retained feedback state before a run."""
        self.last_error = 0.0
        self.integral_error = 0.0
        self.line_error = 0.0

    def update(self, reflectance, dt_s):
        """Return a MotionCommand from the latest reflectance sample."""
        raise NotImplementedError


class RangeSafetyControllerBase:
    """Interface for a forward-range speed limiter.

    Inputs and outputs use millimeters and seconds. ``update`` must return a
    finite, nonnegative forward speed no greater than the requested speed or
    configured maximum. Missing range must return zero.
    """

    __slots__ = (
        "response_time_s",
        "minimum_deceleration_mm_s2",
        "stop_margin_mm",
        "maximum_speed_mm_s",
    )

    def __init__(
        self,
        response_time_s,
        minimum_deceleration_mm_s2,
        stop_margin_mm,
        maximum_speed_mm_s,
    ):
        values = (
            response_time_s,
            minimum_deceleration_mm_s2,
            stop_margin_mm,
            maximum_speed_mm_s,
        )
        if any(
            isinstance(value, bool) or not isinstance(value, (int, float))
            for value in values
        ):
            raise TypeError("range-safety settings must be numeric")
        values = tuple(float(value) for value in values)
        if any(not isfinite(value) for value in values):
            raise ValueError("range-safety settings must be finite")
        if (
            values[0] < 0.0
            or values[1] <= 0.0
            or values[2] < 0.0
            or values[3] <= 0.0
        ):
            raise ValueError("range-safety settings are outside their allowed range")
        self.response_time_s = values[0]
        self.minimum_deceleration_mm_s2 = values[1]
        self.stop_margin_mm = values[2]
        self.maximum_speed_mm_s = values[3]

    def update(self, requested_speed_mm_s, measured_speed_mm_s, range_mm):
        """Return the safe forward-speed request in millimeters per second."""
        raise NotImplementedError


class PoseCorrectorBase:
    """Interface for retained known-wall translation corrections.

    Mission code accepts observations only while the robot is stationary and
    aligned with the stated wall normal. Implementations correct position only
    and preserve the raw odometry heading.
    """

    __slots__ = ("sensor_forward_offset_mm",)

    def __init__(self, sensor_forward_offset_mm):
        if isinstance(sensor_forward_offset_mm, bool) or not isinstance(
            sensor_forward_offset_mm, (int, float)
        ):
            raise TypeError("sensor_forward_offset_mm must be numeric")
        if not isfinite(sensor_forward_offset_mm) or sensor_forward_offset_mm < 0.0:
            raise ValueError("sensor_forward_offset_mm must be finite and nonnegative")
        self.sensor_forward_offset_mm = float(sensor_forward_offset_mm)

    def reset(self, raw_pose):
        """Clear retained corrections and establish the raw odometry frame."""
        raise NotImplementedError

    def corrected_pose(self, raw_pose):
        """Return raw_pose with the retained x/y translation applied."""
        raise NotImplementedError

    def observe_x(self, raw_pose, range_mm, wall_x_mm, facing_positive_x):
        """Update x from one accepted x-normal known-wall observation."""
        raise NotImplementedError

    def observe_y(self, raw_pose, range_mm, wall_y_mm, facing_positive_y):
        """Update y from one accepted y-normal known-wall observation."""
        raise NotImplementedError


class VisitOrderPlannerBase:
    """Interface for a bounded, directed visit-order optimization."""

    __slots__ = ()

    def plan(self, cost_table, start_index, required_indices, finish_index):
        """Return the least-cost complete route, or None when none exists.

        ``cost_table[a][b]`` is the directed cost from node ``a`` to node
        ``b``; ``None`` marks an unavailable directed segment. The result
        starts at ``start_index``, contains each required index exactly once,
        and ends at ``finish_index``. Equal-cost routes use lexicographic tuple
        order.
        """
        raise NotImplementedError
