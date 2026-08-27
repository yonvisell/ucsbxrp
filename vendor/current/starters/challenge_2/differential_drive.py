"""Convert forward speed and turn rate to left and right wheel speeds."""

from ucsb_xrp.student_api import DifferentialDriveBase


class DifferentialDrive(DifferentialDriveBase):
    """Calculate wheel-speed requests; no state is retained between calls."""

    def wheel_speeds(self, command):
        # Use both MotionCommand fields and self.config.track_width_mm.
        # Return WheelSpeeds(left_mm_s, right_mm_s).
        raise NotImplementedError("Complete DifferentialDrive.wheel_speeds")
