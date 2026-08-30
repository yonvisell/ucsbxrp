# Limit forward speed from measured speed and available forward range.

from ucsb_xrp.student_api import RangeSafetyControllerBase


class RangeSafetyController(RangeSafetyControllerBase):
    # RangeSafetyControllerBase validates and stores the four settings.

    def update(self, requested_speed_mm_s, measured_speed_mm_s, range_mm):
        # Return a nonnegative speed in mm/s no greater than the request or
        # self.maximum_speed_mm_s. Use zero when range is unavailable or the
        # configured stopping margin cannot be preserved.
        raise NotImplementedError("Complete RangeSafetyController.update")
