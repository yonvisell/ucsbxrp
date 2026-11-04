# Navigate goal sequence using the behavior classes

from math import atan2, sqrt
from ucsb_xrp import MotionCommand, STOP_COMMAND, clamp, wrap_angle_rad

K_Heading = 2.0  # Turn rate per heading error [1/s].

class NavigationController:

    def __init__(self, config):
        self.config = config
        self.start(())

    def start(self, goals):     # Load navigation goal sequence and reset progress
        self.goals = tuple(goals)
        self.goal_index = 0
        self.current_state = TurnToGoal() if self.goals else RouteComplete()

    def update(self, pose):     # Execute the active behavior, retain its next state and return its command
        command, self.current_state = self.current_state.execute(pose, self.current_goal(), self)
        return command

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

class TurnToGoal:  # Turn toward goal without driving forward
    def execute(self, pose, goal, navigation):
        # Upon reaching a goal either align or continue to next
        if distance_to_goal(pose, goal) <= navigation.config.position_tolerance_mm:
            if goal.heading_rad is not None:
                return STOP_COMMAND, AlignAtGoal()
            return STOP_COMMAND, navigation.advance_goal()

        error_radians = heading_error(pose,goal)
        if abs(error_radians) <= navigation.config.heading_tolerance_rad:
            return STOP_COMMAND, DriveToGoal()

        turn_rate = None       # Complete the calculation for the turn rate using gain K_Heading
                               # Constrain to maximum turn rate (navigation.config.turn_rate_rad_s) if desired
        raise NotImplementedError("Complete TurnToGoal.execute: turn_rate")
        return MotionCommand(0.0, turn_rate), self

class DriveToGoal:  # Drive toward goal while correcting heading
    def execute(self, pose, goal, navigation):
        # Upon reaching a goal either align or continue to next ***
        if distance_to_goal(pose, goal) <= navigation.config.position_tolerance_mm:
            if goal.heading_rad is not None:
                return STOP_COMMAND, AlignAtGoal()
            return STOP_COMMAND, navigation.advance_goal()

        target_heading = None  # Complete the calculations
        error_radians = None   # for the heading to target and the heading error

        # Drive forward while correcting the heading, using the heading error returned by heading_error(pose,goal)
        #    Optional: slow down if heading error very large; other dynamic speed changes can also be optionally used
        #    Optional: Reduce speed if within slowdown distance (navigation.config.slowdown_distance_mm)
        forward_speed = navigation.config.cruise_speed_mm_s
        turn_rate = None       # Complete the calculation for the yaw (turn) rate to correct for error_radians, using gain K_Heading
                               # Constrain to maximum turn rate (navigation.config.turn_rate_rad_s) if desired

        raise NotImplementedError("Complete DriveToGoal.execute: turn_rate")
        return MotionCommand(forward_speed, turn_rate), self

class AlignAtGoal:  # Turn to required heading at goal
    def execute(self, pose, goal, navigation):
        if distance_to_goal(pose, goal) > navigation.config.position_tolerance_mm:
            return STOP_COMMAND, TurnToGoal()

        error_radians = None   # Complete the calculation for the error between goal.heading_rad and pose.heading_rad
        raise NotImplementedError("Complete AlignAtGoal.execute: heading error")
        if abs(error_radians) <= navigation.config.heading_tolerance_rad:
            return STOP_COMMAND, navigation.advance_goal()

        turn_rate = None       # Complete the calculation for the turn rate using gain K_Heading
                               # Constrain to maximum turn rate (navigation.config.turn_rate_rad_s) if desired
        raise NotImplementedError("Complete AlignAtGoal.execute: turn_rate")
        return MotionCommand(0.0, turn_rate), self

class RouteComplete:
    def execute(self, pose, goal, navigation):
        return STOP_COMMAND, self

def distance_to_goal(pose,goal):
    # Complete this to compute and return the distance to the goal in mm
    raise NotImplementedError("Complete distance_to_goal")

def heading_error(pose,goal):
    # Complete this to compute and return the heading error.
    raise NotImplementedError("Complete heading_error")
