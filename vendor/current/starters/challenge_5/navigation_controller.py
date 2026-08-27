"""Calculate robot motion for an ordered sequence of world-coordinate goals."""

from ucsb_xrp import MotionCommand, STOP_COMMAND
from ucsb_xrp.student_api import NavigationControllerBase


class NavigationController(NavigationControllerBase):
    """Retain route progress and calculate one motion request per update."""

    def start(self, goals):
        """Store an ordered NavigationGoal sequence and return None.

        Goal positions use world mm; heading_rad is either a final heading in
        rad or None. An empty sequence is immediately complete.
        """
        raise NotImplementedError("Complete NavigationController.start")

    def update(self, pose):
        """Return the next MotionCommand from the latest odometry Pose.

        The result contains forward speed in mm/s and counterclockwise turn
        rate in rad/s. Visit goals in order and return STOP_COMMAND after the
        final position and any requested final heading are complete.
        """
        raise NotImplementedError("Complete NavigationController.update")

    def current_goal(self):
        """Return the active NavigationGoal, or None after completion."""
        raise NotImplementedError("Complete NavigationController.current_goal")

    def is_complete(self):
        """Return True after every requested position and heading is complete."""
        raise NotImplementedError("Complete NavigationController.is_complete")
