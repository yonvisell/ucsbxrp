"""Student implementations for Challenge 1."""

from ucsb_xrp.student_api import SensorModelBase, WheelSpeedControllerBase


class SensorModel(SensorModelBase):
    """Convert raw encoder readings to wheel measurements."""

    def reset(self, raw):
        # Week 2: record the encoder and time origins, then return zero travel.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # Week 2: calculate wheel positions, increments, and speeds.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # Week 7 adds the range-estimation portion of SensorModel.
        raise NotImplementedError("Complete SensorModel.estimate_range in Week 7")


class WheelSpeedController(WheelSpeedControllerBase):
    """Convert target and measured wheel speeds to motor efforts."""

    def reset(self):
        # Add state initialization here if your controller stores history.
        pass

    def update(self, target, measured):
        # Week 3: calculate and return one MotorEfforts value.
        raise NotImplementedError("Complete WheelSpeedController.update")
