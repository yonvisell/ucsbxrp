"""Convert encoder and ultrasonic readings into physical measurements."""

from ucsb_xrp.student_api import SensorModelBase


class SensorModel(SensorModelBase):
    def reset(self, raw):
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # Keep positive finite numbers; return their median or None if too few.
        raise NotImplementedError("Complete SensorModel.estimate_range")
