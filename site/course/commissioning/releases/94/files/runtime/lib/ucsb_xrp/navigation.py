"""Supplied route lifecycle and transitions for student navigation commands."""

from ._build_config import DEBUG_VALIDATION
from .config import NavigationConfig
from .records import NavigationGoal, Pose, STOP_COMMAND
from .utils import bearing_to_goal, distance_to_goal, wrap_angle_rad


class TurnToGoalState:
    """Turn toward a goal outside its position tolerance."""

    __slots__ = ()

    def execute(self, pose, goal, navigation):
        """Choose the next state or calculate this state's command."""
        config = navigation.config
        if distance_to_goal(pose, goal) <= config.position_tolerance_mm:
            return navigation._align_state
        error = wrap_angle_rad(bearing_to_goal(pose, goal) - pose.heading_rad)
        if abs(error) <= config.heading_tolerance_rad:
            return navigation._drive_state
        navigation._command = self.command(pose, goal, config)
        return self

    def command(self, pose, goal, config):
        """Return zero forward speed and bounded bearing-error feedback."""
        raise NotImplementedError("Complete TurnToGoal.command")


class DriveToGoalState:
    """Drive with heading feedback until arrival or required realignment."""

    __slots__ = ()

    def execute(self, pose, goal, navigation):
        """Choose the next state or calculate this state's command."""
        config = navigation.config
        if distance_to_goal(pose, goal) <= config.position_tolerance_mm:
            return navigation._align_state
        error = wrap_angle_rad(bearing_to_goal(pose, goal) - pose.heading_rad)
        if abs(error) > config.realign_heading_rad:
            return navigation._turn_state
        navigation._command = self.command(pose, goal, config)
        return self

    def command(self, pose, goal, config):
        """Return distance-dependent forward speed and heading feedback."""
        raise NotImplementedError("Complete DriveToGoal.command")


class AlignAtGoalState:
    """Align the final heading while the goal position remains reached."""

    __slots__ = ()

    def execute(self, pose, goal, navigation):
        """Choose the next state or calculate this state's command."""
        config = navigation.config
        if distance_to_goal(pose, goal) > config.position_tolerance_mm:
            return navigation._turn_state
        if goal.heading_rad is None:
            return navigation._complete_state
        error = wrap_angle_rad(goal.heading_rad - pose.heading_rad)
        if abs(error) <= config.heading_tolerance_rad:
            return navigation._complete_state
        navigation._command = self.command(pose, goal, config)
        return self

    def command(self, pose, goal, config):
        """Return zero forward speed and bounded final-heading feedback."""
        raise NotImplementedError("Complete AlignAtGoal.command")


class _CompleteState:
    __slots__ = ()

    def execute(self, pose, goal, navigation):
        navigation._command = STOP_COMMAND
        return self


class NavigationControllerBase:
    """Supply ordered-goal bookkeeping around three command implementations.

    A subclass selects ``turn_state_class``, ``drive_state_class``, and
    ``align_state_class``. Each state is created once and receives the current
    NavigationConfig on every command call.
    """

    __slots__ = (
        "_config", "_goals", "_goal_index", "_state", "_turn_state",
        "_drive_state", "_align_state", "_complete_state", "_command",
    )
    turn_state_class = TurnToGoalState
    drive_state_class = DriveToGoalState
    align_state_class = AlignAtGoalState

    def __init__(self, config):
        self.set_config(config)
        self._turn_state = self.turn_state_class()
        self._drive_state = self.drive_state_class()
        self._align_state = self.align_state_class()
        self._complete_state = _CompleteState()
        self._goals = ()
        self._goal_index = 0
        self._state = self._complete_state
        self._command = STOP_COMMAND

    @property
    def config(self):
        return self._config

    def set_config(self, config):
        """Replace settings without changing the active goal or state."""
        if not isinstance(config, NavigationConfig):
            raise TypeError("config must be a NavigationConfig")
        self._config = config

    def start(self, goals):
        """Copy a tuple/list of NavigationGoal values and begin a new route."""
        if not isinstance(goals, (tuple, list)):
            raise TypeError("goals must be a tuple or list")
        values = tuple(goals)
        if any(not isinstance(goal, NavigationGoal) for goal in values):
            raise TypeError("goals must contain only NavigationGoal values")
        self._goals = values
        self._goal_index = 0
        self._state = self._turn_state if values else self._complete_state

    def current_goal(self):
        """Return the active goal, or None before start/after completion."""
        if self._goal_index >= len(self._goals):
            return None
        return self._goals[self._goal_index]

    def is_complete(self):
        """Return whether the route has no remaining goals."""
        return self.current_goal() is None

    def update(self, pose):
        """Return one motion command, advancing at most one goal per call."""
        if DEBUG_VALIDATION and not isinstance(pose, Pose):
            raise TypeError("pose must be a Pose")
        self._command = STOP_COMMAND
        goal = self.current_goal()
        if goal is None:
            return STOP_COMMAND

        # Allow two transitions and the resulting state's action, including
        # alignment -> turn -> drive after a GPS change. Never scan the route.
        for _ in range(3):
            previous_state = self._state
            self._state = self._state.execute(pose, goal, self)
            if self._state is previous_state:
                break

        if self._state is self._complete_state:
            self._goal_index += 1
            if not self.is_complete():
                self._state = self._turn_state
            return STOP_COMMAND
        return self._command
