# Student wheel measurements from encoder counts and sample time.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorModelBase

# SensorModel — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Count/time origin and recent wheel positions used for speed estimates.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorModel(SensorModelBase):
    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store those origins and return Measurements
        # with zero wheel position, increment, speed, and dt_s. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        # raw holds the next time_ms and signed left/right encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s from several recent positions so one
        # encoder count does not cause a large speed jump. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")
