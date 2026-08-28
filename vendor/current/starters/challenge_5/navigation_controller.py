# Calculate robot motion for an ordered sequence of world-coordinate goals.

from ucsb_xrp import MotionCommand, STOP_COMMAND
from ucsb_xrp.student_api import NavigationControllerBase


class NavigationController(NavigationControllerBase):
    # Store which goal is active so repeated update() calls advance the route.

    def start(self, goals):
        # Store the NavigationGoal values in order. Goal positions use world
        # mm. heading_rad is a final heading in rad, or None when no final
        # heading is required. An empty sequence is already complete.
        raise NotImplementedError("Complete NavigationController.start")

    def update(self, pose):
        # Return the next MotionCommand from the latest odometry Pose. The
        # command contains forward speed in mm/s and counterclockwise turn rate
        # in rad/s. Visit goals in order and return STOP_COMMAND when finished.
        raise NotImplementedError("Complete NavigationController.update")

    def current_goal(self):
        # Return the active NavigationGoal, or None after completion.
        raise NotImplementedError("Complete NavigationController.current_goal")

    def is_complete(self):
        # Return True after every requested position and heading is complete.
        raise NotImplementedError("Complete NavigationController.is_complete")
