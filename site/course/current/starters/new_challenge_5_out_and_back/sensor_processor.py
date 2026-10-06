# Student wheel measurements from encoder counts and sample time.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorProcessorBase

# SensorProcessor — Convert raw encoder, time, range and floor samples into measurements.
# Called by: Robot.start(), Robot.step(), and range collection.
# Methods: reset(), update(), estimate_range().
# Inputs: RawSensors encoder counts/time (counts, ms); optional range samples (mm).
# State: Starting counts, preceding sample, and values used to estimate speed.
# Returns: Measurements with wheel positions (mm), speeds (mm/s), and dt_s (s).

class SensorProcessor(SensorProcessorBase):
    def reset(self, raw):
        # raw.time_ms and raw.left_encoder_count/right_encoder_count mark the
        # first sample of this run. Store them on self so update() can use them.
        # Return Measurements with zero position, increment, speed, and dt_s.
        # Robot reads this record's named fields. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into the corresponding fields.
        raise NotImplementedError("Complete SensorProcessor.reset")

    def update(self, raw):
        # raw is the next sensor record: timestamp in ms and encoder counts.
        # Convert counts to wheel position and increment in mm using the
        # config's left_encoder_sign, right_encoder_sign, wheel_diameter_mm,
        # and encoder_counts_per_revolution. Derive dt_s from sample times and
        # estimate wheel speeds in mm/s. Use preceding estimates or recent samples
        # to reduce jumps from individual counts; use measured elapsed time and
        # wheel_speed_filter_time_constant_ms to set the response time.
        # Keep each latest wheel increment unsmoothed for odometry. Copy raw.range_mm,
        # raw.button_pressed, and raw.reflectance into Measurements.
        raise NotImplementedError("Complete SensorProcessor.update")

    def estimate_range(self, samples, minimum_usable):
        # samples contains range readings in mm or None. Exclude nonfinite,
        # Boolean, zero, and negative readings; return the median usable value
        # in mm, or None when fewer than minimum_usable values remain.
        raise NotImplementedError("Complete SensorProcessor.estimate_range in Challenge 5")
