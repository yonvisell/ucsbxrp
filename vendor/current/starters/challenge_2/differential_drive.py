"""Convert forward speed and turn rate to left and right wheel speeds."""

from ucsb_xrp.student_api import DifferentialDriveBase


class DifferentialDrive(DifferentialDriveBase):
    def wheel_speeds(self, command):
        # Use command speeds and self.config.track_width_mm.
        raise NotImplementedError("Complete DifferentialDrive.wheel_speeds")
