"""Calculate limited motor commands from requested and measured wheel speeds."""

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase


class WheelSpeedController(WheelSpeedControllerBase):
    def reset(self):
        pass

    def update(self, target, measured):
        # Return DriveCommand(left, right).
        raise NotImplementedError("Complete WheelSpeedController.update")
