"""Calculate robot motion for an ordered sequence of waypoint goals."""

from ucsb_xrp.student_api import NavigationControllerBase


class NavigationController(NavigationControllerBase):
    def start(self, goals):
        # Store a private route and select its first goal, if present.
        raise NotImplementedError("Complete NavigationController.start")

    def update(self, pose):
        # Return the next turn, drive, final-alignment, or stop command.
        raise NotImplementedError("Complete NavigationController.update")

    def current_goal(self):
        # Return the active NavigationGoal, or None after the route.
        raise NotImplementedError("Complete NavigationController.current_goal")

    def is_complete(self):
        # Report whether every position and required final heading is complete.
        raise NotImplementedError("Complete NavigationController.is_complete")
