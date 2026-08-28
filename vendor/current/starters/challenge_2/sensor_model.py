# Convert encoder, time, range, and button readings into Measurements.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorModelBase


class SensorModel(SensorModelBase):
    # Keep the prior sensor values needed to calculate change over time.

    def reset(self, raw):
        # Start a run from the first RawSensors sample. raw contains device time
        # in ms, encoder counts, range in mm or None, and the USER-button state.
        # Save the count and time origins needed by update(). Return zero for
        # wheel travel, wheel speed, and elapsed time in this first sample.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # Convert the next chronological RawSensors sample into Measurements.
        # Wheel positions and increments use mm, speeds use mm/s, and dt_s uses
        # s. Use the encoder signs and geometry in self.config. Estimate speed
        # from several recent positions and times so one encoder-count step does
        # not appear as a large instantaneous change.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # Challenge 5: return the median usable range in mm, or None when fewer
        # than minimum_usable readings remain. Ignore None, nonfinite values,
        # Booleans, zero, and negative readings.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
