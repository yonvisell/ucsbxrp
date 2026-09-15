# Convert robot forward speed and turn rate to two wheel-speed targets.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase


class DifferentialDrive(DifferentialDriveBase):
    # This calculation uses only the current command and robot geometry.

    def wheel_speeds(self, command):
        # Return WheelSpeeds for one MotionCommand. command contains forward
        # speed in mm/s and counterclockwise turn rate in rad/s. Use
        # self.config.track_width_mm. Equal wheel speeds drive straight; a
        # positive turn rate makes the right target greater than the left.
        raise NotImplementedError("Complete DifferentialDrive.wheel_speeds")
