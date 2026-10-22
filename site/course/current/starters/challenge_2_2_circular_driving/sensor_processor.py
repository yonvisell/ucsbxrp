# Reuse your tested SensorProcessor from Robot Curling.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorProcessorBase


class SensorProcessor(SensorProcessorBase):
    def reset(self, raw):
        # Task: establish the encoder and time origins for this run.
        # Store raw.time_ms, raw.left_encoder_count and raw.right_encoder_count.
        # Return Measurements with zero wheel travel, speed and dt_s.
        # Preserve raw.range_mm, raw.button_pressed and raw.reflectance.
        raise NotImplementedError("Reuse your tested SensorProcessor.reset in sensor_processor.py")

    def update(self, raw):
        # Task: convert encoder counts and timestamps to wheel travel and speed.
        # Convert counts to mm using self.config.wheel_diameter_mm and
        # self.config.encoder_counts_per_revolution. Apply left_encoder_sign
        # and right_encoder_sign from self.config so forward travel is positive.
        # Calculate dt_s with elapsed_time_s(); retain your tested speed estimator.
        # Return Measurements with unsmoothed wheel increments for odometry.
        raise NotImplementedError("Reuse your tested SensorProcessor.update in sensor_processor.py")
