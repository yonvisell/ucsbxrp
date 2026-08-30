# Calculate motor commands from requested and measured wheel speeds.

from ucsb_xrp import DriveCommand
from ucsb_xrp.student_api import WheelSpeedControllerBase


class WheelSpeedController(WheelSpeedControllerBase):
    # Control each wheel independently and limit the resulting motor commands.

    def reset(self):
        # Clear any controller state retained from the preceding run.
        # Initialize state here if your controller stores history.
        pass

    def update(self, target, measured):
        # target contains requested wheel speeds from DifferentialDrive;
        # measured contains encoder-derived speed estimates from SensorModel.
        # Both use mm/s. Return a normalized DriveCommand limited by
        # self.config. A zero target must produce zero command for that wheel.
        raise NotImplementedError("Complete WheelSpeedController.update")
