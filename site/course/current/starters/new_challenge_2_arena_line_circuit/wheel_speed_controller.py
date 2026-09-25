# Student feedback from wheel speeds to normalized motor commands.

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase

# WheelSpeedController — Convert wheel-speed targets and measurements into motor commands.
# Called by: Robot.step() after DifferentialDrive and SensorModel.
# Methods: reset(), update().
# Inputs: Target and measured WheelSpeeds (mm/s).
# State: Feedback history reset before each run.
# Returns: DriveCommand with normalized left/right values.

class WheelSpeedController(WheelSpeedControllerBase):
    def reset(self):
        # Clear state here if your controller retains any.
        pass

    def update(self, target, measured):
        # target and measured contain left/right wheel speeds in mm/s.
        # Return DriveCommand(left, right) with normalized values bounded
        # by self.config.max_drive_command. A zero target needs zero command.
        raise NotImplementedError("Complete WheelSpeedController.update")
