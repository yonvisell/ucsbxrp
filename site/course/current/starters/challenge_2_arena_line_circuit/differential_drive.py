# Reuse your DifferentialDrive from Challenge 2.2: Circular Driving.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase


class DifferentialDrive(DifferentialDriveBase):
    def wheel_speeds(self, command):
        # Task: convert forward speed and steering rate to left and right wheel speeds.
        # Use command.forward_speed_mm_s, command.turn_rate_rad_s and
        # self.config.track_width_mm (wheel separation [mm]).
        # The wheel speeds average to the forward speed; positive steering turns left.
        # Return the two speeds as WheelSpeeds(left_mm_s, right_mm_s).
        raise NotImplementedError("Complete DifferentialDrive.wheel_speeds")
