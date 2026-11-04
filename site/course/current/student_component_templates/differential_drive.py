# Convert forward speed and turn rate to wheel speeds

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

class DifferentialDrive(DifferentialDriveBase):
    def wheel_speeds(self, command):
        # Compute and return WheelSpeeds(left_mm_s, right_mm_s)
        # command: forward_speed_mm_s and turn_rate_rad_s (positive turns left)
        # self.config.track_width_mm: wheel separation in mm
        raise NotImplementedError("Complete DifferentialDrive.wheel_speeds")
