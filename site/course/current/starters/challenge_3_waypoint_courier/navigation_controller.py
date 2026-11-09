# Navigate goal sequence using the behavior classes

from math import atan2, sqrt
from ucsb_xrp import MotionCommand, STOP_COMMAND, clamp, wrap_angle_rad

K_Heading = 2.0  # Steering rate per heading error [1/s].
STEERING_FILTER_TIME_S = 0.06  # Steering filter time [s].


class NavigationController:
    def __init__(self, config):
        self.config = config
        self.start(())

    def start(self, goals):     # Load navigation goal sequence and reset progress
        self.goals = tuple(goals)
        self.goal_index = 0
        self.current_state = TurnToGoal() if self.goals else RouteComplete()
        self.steering_rate = 0.0

    def update(self, pose, dt_s=0.02):     # Execute active behavior, retain its next state and filter steering
        command, self.current_state = self.current_state.execute(pose, self.current_goal(), self)
        if self.is_complete():
            self.steering_rate = 0.0
            return STOP_COMMAND

        gain = 1.0 if STEERING_FILTER_TIME_S == 0 else dt_s / (STEERING_FILTER_TIME_S + dt_s)
        self.steering_rate += gain * (command.steering_rate_rad_s - self.steering_rate)
        return MotionCommand(command.forward_speed_mm_s, self.steering_rate)

    def current_goal(self):
        if self.is_complete():
            return None
        return self.goals[self.goal_index]

    def advance_goal(self):     # Advance to next goal if any remain
        self.goal_index += 1
        return RouteComplete() if self.is_complete() else TurnToGoal()

    def is_complete(self):
        return self.goal_index >= len(self.goals)

    def set_config(self, config):
        self.config = config
        self.steering_rate = clamp(self.steering_rate, -config.steering_rate_rad_s, config.steering_rate_rad_s)


class TurnToGoal:  # Turn toward goal without driving forward
    def execute(self, pose, goal, navigation):
        if distance_to_goal(pose, goal) <= navigation.config.position_tolerance_mm:
            if goal.heading_rad is not None:
                return STOP_COMMAND, AlignAtGoal()
            return STOP_COMMAND, navigation.advance_goal()

        error_radians = heading_error(pose, goal)
        if abs(error_radians) <= navigation.config.heading_tolerance_rad:
            return STOP_COMMAND, DriveToGoal()

        steering_rate = None    # Complete the steering rate using error_radians and K_Heading
                               # Constrain to maximum steering rate (navigation.config.steering_rate_rad_s) if desired
        raise NotImplementedError("TODO: Complete TurnToGoal.execute: steering_rate")
        return MotionCommand(0.0, steering_rate), self


class DriveToGoal:  # Drive toward goal while correcting heading
    def execute(self, pose, goal, navigation):
        # Upon reaching a goal either align or continue to next
        distance = distance_to_goal(pose, goal)
        if distance <= navigation.config.position_tolerance_mm:
            if goal.heading_rad is not None:
                return STOP_COMMAND, AlignAtGoal()
            return STOP_COMMAND, navigation.advance_goal()

        error_radians = heading_error(pose, goal)
        forward_speed = navigation.config.cruise_speed_mm_s
        # Optional: reduce speed if within navigation.config.slowdown_distance_mm
        steering_rate = None    # Complete the steering rate using error_radians and K_Heading
                               # Constrain to maximum steering rate (navigation.config.steering_rate_rad_s) if desired
        raise NotImplementedError("TODO: Complete DriveToGoal.execute: steering_rate")
        return MotionCommand(forward_speed, steering_rate), self


class AlignAtGoal:  # Turn to required heading at goal
    def execute(self, pose, goal, navigation):
        error_radians = None   # Complete the error between goal.heading_rad and pose.heading_rad
        raise NotImplementedError("TODO: Complete AlignAtGoal.execute: heading error")
        if abs(error_radians) <= navigation.config.heading_tolerance_rad:
            if distance_to_goal(pose, goal) <= navigation.config.position_tolerance_mm:
                return STOP_COMMAND, navigation.advance_goal()
            return STOP_COMMAND, TurnToGoal()

        steering_rate = None    # Complete the steering rate using error_radians and K_Heading
                               # Constrain to maximum steering rate (navigation.config.steering_rate_rad_s) if desired
        raise NotImplementedError("TODO: Complete AlignAtGoal.execute: steering_rate")
        return MotionCommand(0.0, steering_rate), self


class RouteComplete:
    def execute(self, pose, goal, navigation):
        return STOP_COMMAND, self


def distance_to_goal(pose, goal):
    # Complete this to compute and return the distance to the goal in mm
    raise NotImplementedError("TODO: Complete distance_to_goal")


def heading_error(pose, goal):
    # Complete this to compute and return the heading error.
    raise NotImplementedError("TODO: Complete heading_error")
