"""Calculate robot motion for an ordered sequence of waypoint goals."""

from ucsb_xrp.student_api import NavigationControllerBase


class NavigationController(NavigationControllerBase):
    """Retain route progress and calculate one motion request per update."""

    def start(self, goals):
        """Store an ordered NavigationGoal sequence and return None.

        Goal positions use mm; an optional final heading uses rad.
        """
        # Store a private copy of goals and select the first one, if present.
        raise NotImplementedError("Complete NavigationController.start")

    def update(self, pose):
        """Return a MotionCommand from the latest Pose in mm and rad.

        The result contains forward speed in mm/s and turn rate in rad/s.
        """
        # Return one turn, drive, final-heading, or stopped MotionCommand.
        raise NotImplementedError("Complete NavigationController.update")

    def current_goal(self):
        """Return the active NavigationGoal, or None after completion."""
        # Return the active NavigationGoal, or None after the route.
        raise NotImplementedError("Complete NavigationController.current_goal")

    def is_complete(self):
        """Return True after every position and requested heading is complete."""
        # True only after every position and requested heading is complete.
        raise NotImplementedError("Complete NavigationController.is_complete")
