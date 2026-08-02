"""Student implementation of encoder and range measurement."""

from ucsb_xrp.student_api import SensorModelBase


class SensorModel(SensorModelBase):
    def reset(self, raw):
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # Reject unusable readings and return the median when enough remain.
        raise NotImplementedError("Complete SensorModel.estimate_range")
