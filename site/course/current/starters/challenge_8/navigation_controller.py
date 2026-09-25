# Receive NavigationGoal sequences and Pose samples, retain route progress,
# and return one MotionCommand for each update.

from ucsb_xrp import MotionCommand, STOP_COMMAND
from ucsb_xrp.student_api import NavigationControllerBase

# NavigationController — Convert ordered arena-frame targets and estimated pose into motion.
# Called by: Route execution in main.py or mission_steps.py.
# Methods: start(), update(), current_goal(), is_complete(); inherited set_config().
# Inputs: Ordered NavigationGoal targets and estimated Pose in the arena frame.
# State: Saved goals, active-goal index, and turn/drive/align phase.
# Returns: MotionCommand (forward mm/s, turn rad/s) and completion status.

class NavigationController(NavigationControllerBase):
    # Keep the active-goal index and whether the robot is turning toward a
    # target, driving to it, or aligning to its requested final heading.
    # config.position_tolerance_mm is the permitted distance from the target;
    # config.heading_tolerance_rad is the permitted final heading error.
    # config.realign_heading_rad is the error above which forward travel pauses
    # so the robot can turn toward the target in place.

    def start(self, goals):
        # goals is an ordered tuple or list of NavigationGoal objects. Each goal's
        # x_mm and y_mm locate a target in the fixed arena coordinate frame.
        # Its heading_rad is the required final angle from the positive x axis,
        # counterclockwise in radians; None means no final-angle requirement.
        # Save this route and discard previous progress. If goals is empty,
        # is_complete() returns True and update() returns STOP_COMMAND.
        raise NotImplementedError("Complete NavigationController.start")

    def update(self, pose):
        # pose is the latest estimated Pose(x_mm, y_mm, heading_rad) in the
        # fixed arena frame (mm, mm, rad). Use the current goal to choose
        # turning, forward travel, or final-heading alignment; advance when its
        # required position and heading are reached. Return
        # MotionCommand(forward_speed_mm_s, turn_rate_rad_s), with positive
        # turn rate counterclockwise. Return STOP_COMMAND when no goal remains.
        raise NotImplementedError("Complete NavigationController.update")

    def current_goal(self):
        # Return the saved NavigationGoal currently being approached, or
        # None when no goal remains.
        raise NotImplementedError("Complete NavigationController.current_goal")

    def is_complete(self):
        # Return True after every saved goal has been accepted in order.
        # Accept each position within config.position_tolerance_mm and each
        # specified final heading within config.heading_tolerance_rad.
        # Return True immediately for an empty route.
        raise NotImplementedError("Complete NavigationController.is_complete")
