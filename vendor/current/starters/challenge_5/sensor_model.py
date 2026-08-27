"""Convert encoder and ultrasonic readings into physical measurements."""

from ucsb_xrp.student_api import SensorModelBase


class SensorModel(SensorModelBase):
    """Retain wheel-measurement history and reduce repeated range readings."""

    def reset(self, raw):
        """Return zero-travel Measurements from the first RawSensors sample."""
        # Keep the encoder/time behavior completed in Challenge 1.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        """Return Measurements for the next chronological RawSensors sample."""
        # Keep the encoder/time behavior completed in Challenge 1.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        """Return median usable range in mm, or None when too few remain.

        samples contains numerical ranges in mm and possibly None values.
        minimum_usable is the required positive integer count.
        """
        # Keep positive finite numbers. Return their median, or None if fewer
        # than minimum_usable readings remain.
        raise NotImplementedError("Complete SensorModel.estimate_range")
