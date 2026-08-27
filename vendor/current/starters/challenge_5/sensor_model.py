"""Convert encoder and ultrasonic readings into physical measurements."""

from ucsb_xrp.student_api import SensorModelBase


class SensorModel(SensorModelBase):
    """Retain wheel-measurement history and reduce repeated range readings."""

    def reset(self, raw):
        # Keep the encoder/time behavior completed in Challenge 1.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # Keep the encoder/time behavior completed in Challenge 1.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # Keep positive finite numbers. Return their median, or None if fewer
        # than minimum_usable readings remain.
        raise NotImplementedError("Complete SensorModel.estimate_range")
