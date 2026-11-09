# Convert forward speed and steering rate to wheel speeds

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

class DifferentialDrive(DifferentialDriveBase):
    def wheel_speeds(self, command):
        # Compute and return WheelSpeeds(left_mm_s, right_mm_s)
        # command: forward_speed_mm_s and steering_rate_rad_s (positive turns left)
        # self.config.track_width_mm: wheel separation in mm
        raise NotImplementedError("TODO: Complete DifferentialDrive.wheel_speeds")
