"""Delivery-task record and supplied Challenge 5 mission sequence."""

from ._validation import (
    require_bool,
    require_int,
    require_nonnegative,
    require_positive,
)
from .maps import ArenaMap, OccupancyGrid
from .records import NavigationGoal, Pose, STOP_COMMAND, _ValueRecord


class DeliveryTask(_ValueRecord):
    """All task-specific values needed for one delivery mission."""

    __slots__ = (
        "_initial_pose",
        "_arena",
        "_grid_resolution_mm",
        "_clearance_mm",
        "_destination",
        "_observed_feature_name",
        "_range_sample_count",
        "_minimum_usable_range_count",
        "_blocked_range_threshold_mm",
        "_assume_blocked_without_range",
    )
    _field_names = (
        "initial_pose",
        "arena",
        "grid_resolution_mm",
        "clearance_mm",
        "destination",
        "observed_feature_name",
        "range_sample_count",
        "minimum_usable_range_count",
        "blocked_range_threshold_mm",
        "assume_blocked_without_range",
    )

    def __init__(
        self,
        initial_pose,
        arena,
        grid_resolution_mm,
        clearance_mm,
        destination,
        observed_feature_name,
        range_sample_count,
        minimum_usable_range_count,
        blocked_range_threshold_mm,
        assume_blocked_without_range,
    ):
        if not isinstance(initial_pose, Pose):
            raise TypeError("initial_pose must be a Pose")
        if not isinstance(arena, ArenaMap):
            raise TypeError("arena must be an ArenaMap")
        if not isinstance(destination, NavigationGoal):
            raise TypeError("destination must be a NavigationGoal")
        if (
            not isinstance(observed_feature_name, str)
            or observed_feature_name not in arena.feature_names
        ):
            raise ValueError("observed_feature_name must name an arena feature")
        range_sample_count = require_int(
            "range_sample_count", range_sample_count, minimum=1
        )
        minimum_usable_range_count = require_int(
            "minimum_usable_range_count",
            minimum_usable_range_count,
            minimum=1,
        )
        if minimum_usable_range_count > range_sample_count:
            raise ValueError(
                "minimum_usable_range_count must not exceed range_sample_count"
            )
        self._initial_pose = initial_pose
        self._arena = arena
        self._grid_resolution_mm = require_positive(
            "grid_resolution_mm", grid_resolution_mm
        )
        self._clearance_mm = require_nonnegative("clearance_mm", clearance_mm)
        self._destination = destination
        self._observed_feature_name = observed_feature_name
        self._range_sample_count = range_sample_count
        self._minimum_usable_range_count = minimum_usable_range_count
        self._blocked_range_threshold_mm = require_positive(
            "blocked_range_threshold_mm", blocked_range_threshold_mm
        )
        self._assume_blocked_without_range = require_bool(
            "assume_blocked_without_range", assume_blocked_without_range
        )

    @property
    def initial_pose(self):
        return self._initial_pose

    @property
    def arena(self):
        return self._arena

    @property
    def grid_resolution_mm(self):
        return self._grid_resolution_mm

    @property
    def clearance_mm(self):
        return self._clearance_mm

    @property
    def destination(self):
        return self._destination

    @property
    def observed_feature_name(self):
        return self._observed_feature_name

    @property
    def range_sample_count(self):
        return self._range_sample_count

    @property
    def minimum_usable_range_count(self):
        return self._minimum_usable_range_count

    @property
    def blocked_range_threshold_mm(self):
        return self._blocked_range_threshold_mm

    @property
    def assume_blocked_without_range(self):
        return self._assume_blocked_without_range


class DeliveryMission:
    """Supplied observation, planning, and delivery orchestration."""

    __slots__ = (
        "_task",
        "_navigation",
        "_planner",
        "_maximum_navigation_steps",
        "_range_estimate_mm",
        "_feature_blocked",
        "_planned_path",
        "_navigation_step_count",
        "_result",
    )

    def __init__(
        self,
        task,
        navigation,
        planner,
        maximum_navigation_steps=None,
    ):
        if not isinstance(task, DeliveryTask):
            raise TypeError("task must be a DeliveryTask")
        if not all(
            callable(getattr(navigation, name, None))
            for name in ("start", "update", "is_complete")
        ):
            raise TypeError("navigation must implement the NavigationController interface")
        if not callable(getattr(planner, "plan", None)):
            raise TypeError("planner must implement the GridPlanner interface")
        self._task = task
        self._navigation = navigation
        self._planner = planner
        self._maximum_navigation_steps = (
            None
            if maximum_navigation_steps is None
            else require_int(
                "maximum_navigation_steps",
                maximum_navigation_steps,
                minimum=1,
            )
        )
        self._range_estimate_mm = None
        self._feature_blocked = None
        self._planned_path = None
        self._navigation_step_count = 0
        self._result = None

    @property
    def task(self):
        return self._task

    @property
    def result(self):
        return self._result

    @property
    def maximum_navigation_steps(self):
        return self._maximum_navigation_steps

    @property
    def range_estimate_mm(self):
        return self._range_estimate_mm

    @property
    def feature_blocked(self):
        return self._feature_blocked

    @property
    def planned_path(self):
        return self._planned_path

    @property
    def navigation_step_count(self):
        return self._navigation_step_count

    def run(self, robot):
        self._range_estimate_mm = None
        self._feature_blocked = None
        self._planned_path = None
        self._navigation_step_count = 0
        self._result = None
        state = None
        try:
            state = robot.start(self.task.initial_pose)
            samples = []
            for _ in range(self.task.range_sample_count):
                state = robot.step(STOP_COMMAND, read_range=True)
                samples.append(state.measurements.range_mm)
            estimate = robot.estimate_range(
                samples,
                self.task.minimum_usable_range_count,
            )
            self._range_estimate_mm = estimate
            blocked = (
                self.task.assume_blocked_without_range
                if estimate is None
                else estimate <= self.task.blocked_range_threshold_mm
            )
            self._feature_blocked = blocked
            arena = self.task.arena.with_feature_blocked(
                self.task.observed_feature_name,
                blocked,
            )
            grid = OccupancyGrid.from_arena(
                arena,
                self.task.grid_resolution_mm,
                self.task.clearance_mm,
            )
            start = grid.world_to_cell(state.pose.x_mm, state.pose.y_mm)
            goal = grid.world_to_cell(
                self.task.destination.x_mm,
                self.task.destination.y_mm,
            )
            path = self._planner.plan(grid, start, goal)
            self._planned_path = path
            if path is None:
                self._result = "no_path"
                return state

            goals = path.to_goals(grid, self.task.destination.heading_rad)
            self._navigation.start(goals)
            steps = 0
            while not self._navigation.is_complete():
                if (
                    self.maximum_navigation_steps is not None
                    and steps >= self.maximum_navigation_steps
                ):
                    self._result = "step_limit"
                    return state
                state = robot.step(self._navigation.update(state.pose))
                steps += 1
                self._navigation_step_count = steps
            self._result = "delivered"
            return state
        finally:
            robot.stop()
