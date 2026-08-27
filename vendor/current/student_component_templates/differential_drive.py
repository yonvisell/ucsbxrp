"""Convert robot forward speed and turn rate to two wheel-speed targets."""

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase


class DifferentialDrive(DifferentialDriveBase):
    """Calculate wheel-speed requests without retaining state between calls."""

    def wheel_speeds(self, command):
        """Return WheelSpeeds for one MotionCommand.

        command contains robot forward speed in mm/s and counterclockwise turn
        rate in rad/s. Use self.config.track_width_mm. Equal targets produce
        straight travel; a positive turn rate makes the right target greater
        than the left. Returned wheel speeds use mm/s.
        """
        raise NotImplementedError("Complete DifferentialDrive.wheel_speeds")
