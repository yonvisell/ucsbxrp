# Replace this file with your tested SensorProcessor from the preceding motion challenge.

from ucsb_xrp import Measurements
from ucsb_xrp.student_api import SensorProcessorBase


class SensorProcessor(SensorProcessorBase):
    def reset(self, raw):
        # Store the starting encoder counts and time from raw. Return Measurements
        # with zero wheel position, increment, speed, and dt_s; preserve the other raw readings.
        raise NotImplementedError("Reuse your tested SensorProcessor.reset in sensor_processor.py")

    def update(self, raw):
        # Convert raw.left_encoder_count and raw.right_encoder_count to wheel positions
        # and unsmoothed increments [mm]. Use the elapsed raw.time_ms and your existing
        # speed estimator to return left/right speeds [mm/s] in Measurements.
        raise NotImplementedError("Reuse your tested SensorProcessor.update in sensor_processor.py")
