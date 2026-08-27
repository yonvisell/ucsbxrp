"""Calculate limited motor commands from requested and measured wheel speeds."""

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase


class WheelSpeedController(WheelSpeedControllerBase):
    """Calculate one independent, limited motor command for each wheel."""

    def reset(self):
        """Clear any controller state retained from the preceding run."""
        # Initialize state here if your controller stores history.
        pass

    def update(self, target, measured):
        """Return DriveCommand from target and measured WheelSpeeds.

        Both inputs use mm/s. The returned left and right motor commands are
        normalized, dimensionless values.
        """
        # Use target, measured, and self.config. Return DriveCommand(left, right).
        raise NotImplementedError("Complete WheelSpeedController.update")
