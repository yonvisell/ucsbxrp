"""Convert encoder, time, range, and button readings into Measurements."""

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorModelBase


class SensorModel(SensorModelBase):
    """Retain measurement history for one run and return physical values."""

    def reset(self, raw):
        """Return zero-travel Measurements from the first RawSensors sample.

        raw contains device time in ms, encoder counts, range in mm or None,
        and the USER-button state. Save the count and time origins needed by
        later update() calls. The returned position, increment, speed, and
        elapsed-time fields are zero; range and button state match raw.
        """
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        """Return Measurements for the next chronological RawSensors sample.

        Wheel positions and increments are in mm, wheel speeds are in mm/s,
        and dt_s is in s. Use the encoder signs and geometry in self.config.
        Wheel increments describe only the latest sample. Wheel-speed estimates
        use recent encoder positions and times so a single encoder-count step
        does not appear as an instantaneous speed change.
        """
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        """Return a median usable range in mm, or None when too few remain.

        Challenge 5 introduces this method. samples may contain numerical
        ranges and None. Ignore missing, nonfinite, Boolean, zero, and negative
        values. minimum_usable is a positive integer.
        """
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
