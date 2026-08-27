"""Calculate robot motion for an ordered sequence of waypoint goals."""

from ucsb_xrp.student_api import NavigationControllerBase


class NavigationController(NavigationControllerBase):
    """Retain route progress and calculate one motion request per update."""

    def start(self, goals):
        # Store a private copy of goals and select the first one, if present.
        raise NotImplementedError("Complete NavigationController.start")

    def update(self, pose):
        # Return one turn, drive, final-heading, or stopped MotionCommand.
        raise NotImplementedError("Complete NavigationController.update")

    def current_goal(self):
        # Return the active NavigationGoal, or None after the route.
        raise NotImplementedError("Complete NavigationController.current_goal")

    def is_complete(self):
        # True only after every position and requested heading is complete.
        raise NotImplementedError("Complete NavigationController.is_complete")
