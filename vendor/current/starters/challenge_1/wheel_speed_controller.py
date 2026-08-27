"""Calculate bounded motor commands from requested and measured wheel speeds."""

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase


class WheelSpeedController(WheelSpeedControllerBase):
    def reset(self):
        # Initialize state here if your controller stores history.
        pass

    def update(self, target, measured):
        # Calculate the independent left and right terms, limit, and return them.
        raise NotImplementedError("Complete WheelSpeedController.update")
