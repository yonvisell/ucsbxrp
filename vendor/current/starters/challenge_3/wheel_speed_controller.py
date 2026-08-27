"""Calculate motor commands from requested and measured wheel speeds."""

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase


class WheelSpeedController(WheelSpeedControllerBase):
    """Calculate one independent, limited motor command for each wheel."""

    def reset(self):
        """Clear any controller state retained from the preceding run."""
        # Initialize state here if your controller stores history.
        pass

    def update(self, target, measured):
        """Return DriveCommand from two WheelSpeeds values.

        target contains the requested left and right speeds from
        DifferentialDrive. measured contains the encoder-derived speed
        estimates from SensorModel. Both use mm/s. Return normalized,
        dimensionless left and right motor commands, limited by self.config.
        A zero target for one wheel must return zero command for that wheel.
        """
        raise NotImplementedError("Complete WheelSpeedController.update")
