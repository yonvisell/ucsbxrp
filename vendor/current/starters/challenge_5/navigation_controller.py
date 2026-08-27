"""Calculate robot motion for an ordered sequence of waypoint goals."""

from ucsb_xrp.student_api import NavigationControllerBase


class NavigationController(NavigationControllerBase):
    def start(self, goals):
        raise NotImplementedError("Complete NavigationController.start")

    def update(self, pose):
        raise NotImplementedError("Complete NavigationController.update")

    def current_goal(self):
        raise NotImplementedError("Complete NavigationController.current_goal")

    def is_complete(self):
        raise NotImplementedError("Complete NavigationController.is_complete")
