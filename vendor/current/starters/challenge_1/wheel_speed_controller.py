"""Student implementation of left/right wheel-speed control."""

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase


class WheelSpeedController(WheelSpeedControllerBase):
    def reset(self):
        # Initialize state here if your controller stores history.
        pass

    def update(self, target, measured):
        # Week 3: calculate and return DriveCommand(left, right).
        raise NotImplementedError("Complete WheelSpeedController.update")
