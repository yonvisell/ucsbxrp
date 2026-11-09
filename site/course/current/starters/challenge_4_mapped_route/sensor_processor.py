# Compute wheel measurements from encoder counts and sample time

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorProcessorBase

class SensorProcessor(SensorProcessorBase):
    def reset(self, raw):
        # Store initial encoder counts and sample time
        # raw: time_ms, left_encoder_count, right_encoder_count
        # Return Measurements with zero wheel position, increment, speed and dt_s
        # Copy raw.range_mm, raw.button_pressed and raw.reflectance
        raise NotImplementedError("TODO: Complete SensorProcessor.reset")

    def update(self, raw):
        # Compute wheel position and travel increments in mm, speed in mm/s and dt_s in seconds
        # raw: new sample time and encoder counts; use previous samples stored on self
        # self.config: encoder signs, wheel_diameter_mm and encoder_counts_per_revolution
        # Smooth wheel speeds using measured dt_s and wheel_speed_filter_time_constant_ms
        # Keep wheel travel increments unsmoothed; copy range, button and reflectance into Measurements
        raise NotImplementedError("TODO: Complete SensorProcessor.update")

    def estimate_range(self, samples, minimum_usable):
        # Compute and return the median usable range in mm
        # samples: readings in mm or None; exclude nonfinite, Boolean and nonpositive values
        # Return None if fewer than minimum_usable readings remain
        raise NotImplementedError("TODO: Complete SensorProcessor.estimate_range in Challenge 5")
