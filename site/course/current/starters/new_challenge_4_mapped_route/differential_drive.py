# Convert robot forward speed and turn rate to two wheel-speed targets.

from ucsb_xrp import WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase

# DifferentialDrive — Convert body motion to left/right wheel-speed targets.
# Called by: Robot.step() before wheel-speed feedback.
# Methods: wheel_speeds().
# Inputs: MotionCommand (forward mm/s, counterclockwise rad/s); wheel separation (mm).
# State: No per-call history; config is inherited from the base class.
# Returns: WheelSpeeds (mm/s).

class DifferentialDrive(DifferentialDriveBase):
    # This calculation uses only the current command and robot geometry.

    def wheel_speeds(self, command):
        # command.forward_speed_mm_s is axle-center speed in mm/s;
        # command.turn_rate_rad_s is counterclockwise turn rate in rad/s.
        # self.config.track_width_mm is left/right wheel separation in mm.
        # Return WheelSpeeds(left_mm_s, right_mm_s). Equal speeds drive
        # straight; a positive turn rate needs a faster right wheel.
        raise NotImplementedError("Complete DifferentialDrive.wheel_speeds")
