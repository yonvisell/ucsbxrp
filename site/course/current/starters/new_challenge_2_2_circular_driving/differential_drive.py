# Implement the body-to-wheel speed conversion; no previous sample is needed.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase


class DifferentialDrive(DifferentialDriveBase):
    def wheel_speeds(self, command):
        # Use command.forward_speed_mm_s [mm/s], command.turn_rate_rad_s [rad/s],
        # and self.config.track_width_mm [mm]. The mean wheel speed must equal
        # the axle-midpoint speed. A positive turn rate requires a faster right wheel.
        # Calculate the two speeds and return WheelSpeeds(left_mm_s, right_mm_s).
        raise NotImplementedError("Complete DifferentialDrive.wheel_speeds in differential_drive.py")
