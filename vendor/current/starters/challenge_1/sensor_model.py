"""Student implementation of encoder and range measurement."""

from ucsb_xrp.student_api import SensorModelBase


class SensorModel(SensorModelBase):
    def reset(self, raw):
        # Week 2: record the encoder and time origins, then return zero travel.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # Week 2: calculate wheel positions, increments, and speeds.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # Week 7 adds the range-estimation portion of SensorModel.
        raise NotImplementedError("Complete SensorModel.estimate_range in Week 7")
