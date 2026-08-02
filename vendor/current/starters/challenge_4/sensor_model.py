"""Student implementation of encoder and range measurement."""

from ucsb_xrp.student_api import SensorModelBase


class SensorModel(SensorModelBase):
    def reset(self, raw):
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
