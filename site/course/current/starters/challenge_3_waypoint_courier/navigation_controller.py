"""Calculate motion toward the active world-coordinate goal.

pose gives the current world position x_mm/y_mm [mm] and heading_rad [rad].
goal gives a target world position and an optional heading for alignment.
config supplies speeds and limits.
Return MotionCommand(forward_speed, turn_rate), in mm/s and rad/s; positive turn
rate is counterclockwise.

Each supplied parent class provides execute(), which selects the next behavior.
While its behavior continues, it calls this class's command() with the current
pose, goal and config. The controller retains progress and reuses these objects.
"""

from math import atan2
from ucsb_xrp import (
    MotionCommand, clamp, distance_to_goal, wrap_angle_rad,
)
from ucsb_xrp.navigation import (
    NavigationControllerBase, TurnToGoalState, DriveToGoalState, AlignAtGoalState,
)

TURN_GAIN = 2.0      # Turn rate per heading error when turning in place [1/s].
HEADING_GAIN = 2.0   # Turn rate per heading error while driving [1/s].


class TurnToGoal(TurnToGoalState):
    def command(self, pose, goal, config):
        """Request an in-place turn toward the goal position."""
        # Find world displacement from robot to goal; atan2(y, x) gives its direction.
        # Use wrap_angle_rad for the shortest signed turn from pose.heading_rad
        # toward that direction.
        # Scale the error by TURN_GAIN; clamp to +/- config.turn_rate_rad_s.
        # Return zero forward speed and the calculated turn rate.
        raise NotImplementedError("Complete TurnToGoal.command")


class DriveToGoal(DriveToGoalState):
    def command(self, pose, goal, config):
        """Request forward travel with steering toward the goal position."""
        # Recalculate the goal direction and signed heading error as in TurnToGoal.
        # Use HEADING_GAIN here and the same turn-rate limit.
        # Find remaining distance [mm] with distance_to_goal(pose, goal).
        # Beyond config.slowdown_distance_mm, request config.cruise_speed_mm_s.
        # At or inside that distance, scale config.approach_speed_mm_s by the
        # fraction of the slowdown distance remaining, allowing time to steer.
        # Return the forward speed and turn rate together in a MotionCommand.
        raise NotImplementedError("Complete DriveToGoal.command")


class AlignAtGoal(AlignAtGoalState):
    def command(self, pose, goal, config):
        """Request an in-place turn to the heading required at the reached goal."""
        # Use goal.heading_rad as the target orientation, replacing goal direction.
        # Wrap its error from the current heading; apply TURN_GAIN and the limit.
        # Return zero forward speed and the calculated turn rate.
        raise NotImplementedError("Complete AlignAtGoal.command")


# Connect the three command classes to the supplied controller's state selection.
class NavigationController(NavigationControllerBase):
    turn_state_class = TurnToGoal
    drive_state_class = DriveToGoal
    align_state_class = AlignAtGoal
