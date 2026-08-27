"""Convert encoder readings and device time into wheel measurements."""

from ucsb_xrp.student_api import SensorModelBase


class SensorModel(SensorModelBase):
    def reset(self, raw):
        # Store this run's count and time origins; return zero wheel travel.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # Convert the current raw sample to positions, increments, and speeds.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # Range estimation is introduced in Challenge 5.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
