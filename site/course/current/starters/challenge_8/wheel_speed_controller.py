# Calculate motor commands from requested and measured wheel speeds.

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase

# WheelSpeedController — Convert wheel-speed targets and measurements into motor commands.
# Called by: Robot.step() after DifferentialDrive and SensorProcessor.
# Methods: reset(), update().
# Inputs: Target and measured WheelSpeeds (mm/s).
# State: Any saved speed errors are set to their starting values before a run.
# Returns: DriveCommand with normalized left/right values.

class WheelSpeedController(WheelSpeedControllerBase):
    # Control each wheel independently and limit the resulting motor commands.

    def reset(self):
        # Set any saved speed error or accumulated error to zero before a run.
        pass

    def update(self, target, measured):
        # target.left_mm_s/right_mm_s are requested wheel speeds from
        # DifferentialDrive; measured.left_mm_s/right_mm_s are encoder-based
        # estimates. Return DriveCommand(left, right) with dimensionless
        # motor requests bounded by self.config.max_drive_command. A target
        # of zero mm/s must produce a zero request for that wheel.
        raise NotImplementedError("Complete WheelSpeedController.update")
