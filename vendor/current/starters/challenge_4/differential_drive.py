"""Convert forward speed and turn rate to left and right wheel speeds."""

from ucsb_xrp.student_api import DifferentialDriveBase


class DifferentialDrive(DifferentialDriveBase):
    def wheel_speeds(self, command):
        raise NotImplementedError("Complete DifferentialDrive.wheel_speeds")
