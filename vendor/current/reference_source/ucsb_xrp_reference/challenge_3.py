"""Supplied Challenge 3 world-coordinate navigation component."""

from ucsb_xrp.records import MotionCommand, NavigationGoal, Pose, STOP_COMMAND
from ucsb_xrp.student_api import NavigationControllerBase
from ucsb_xrp.utils import bearing_to_goal, clamp, distance_to_goal, wrap_angle_rad


class NavigationController(NavigationControllerBase):
    """A legible turn-drive-align state machine for ordered goals."""

    __slots__ = ("_goals", "_index", "_mode")

    def __init__(self, config):
        super().__init__(config)
        self._goals = ()
        self._index = 0
        self._mode = "complete"

    def start(self, goals):
        if not isinstance(goals, (tuple, list)):
            raise TypeError("goals must be a tuple or list")
        values = tuple(goals)
        if any(not isinstance(goal, NavigationGoal) for goal in values):
            raise TypeError("goals must contain only NavigationGoal values")
        self._goals = values
        self._index = 0
        self._mode = "turn" if values else "complete"

    def current_goal(self):
        if self._index >= len(self._goals):
            return None
        return self._goals[self._index]

    def is_complete(self):
        return self.current_goal() is None

    def update(self, pose):
        if not isinstance(pose, Pose):
            raise TypeError("pose must be a Pose")
        while True:
            goal = self.current_goal()
            if goal is None:
                self._mode = "complete"
                return STOP_COMMAND

            distance = distance_to_goal(pose, goal)
            if distance <= self.config.position_tolerance_mm:
                if goal.heading_rad is not None:
                    error = wrap_angle_rad(goal.heading_rad - pose.heading_rad)
                    if abs(error) > self.config.heading_tolerance_rad:
                        self._mode = "align"
                        return MotionCommand(
                            0.0,
                            self.config.turn_rate_rad_s if error > 0 else -self.config.turn_rate_rad_s,
                        )
                self._index += 1
                self._mode = "turn"
                continue

            heading_error = wrap_angle_rad(bearing_to_goal(pose, goal) - pose.heading_rad)
            if self._mode != "drive":
                if abs(heading_error) > self.config.heading_tolerance_rad:
                    self._mode = "turn"
                    return MotionCommand(
                        0.0,
                        self.config.turn_rate_rad_s
                        if heading_error > 0
                        else -self.config.turn_rate_rad_s,
                    )
                self._mode = "drive"
            elif abs(heading_error) >= self.config.realign_heading_rad:
                self._mode = "turn"
                continue

            speed = (
                self.config.approach_speed_mm_s
                if distance <= self.config.slowdown_distance_mm
                else self.config.cruise_speed_mm_s
            )
            correction = clamp(
                2.0 * heading_error,
                -self.config.turn_rate_rad_s,
                self.config.turn_rate_rad_s,
            )
            return MotionCommand(speed, correction)
