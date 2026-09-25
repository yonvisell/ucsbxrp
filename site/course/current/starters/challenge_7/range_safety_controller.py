# Limit forward speed from measured speed and available forward range.

from ucsb_xrp.student_api import RangeSafetyControllerBase

# RangeSafetyController — Limit forward motion using measured speed and available range.
# Called by: Range-constrained stopping loop.
# Methods: update().
# Inputs: Requested and measured forward speed (mm/s); range (mm or None).
# State: Inherited response time, minimum deceleration, margin, speed limit; no history.
# Returns: Nonnegative forward-speed request (mm/s).

class RangeSafetyController(RangeSafetyControllerBase):
    # RangeSafetyControllerBase validates and stores the four settings.

    def update(self, requested_speed_mm_s, measured_speed_mm_s, range_mm):
        # requested_speed_mm_s is the desired forward speed; measured_speed_mm_s
        # is the current forward speed. range_mm is clearance ahead in mm or
        # None when unavailable. Return a nonnegative speed in mm/s no greater
        # than the request or self.maximum_speed_mm_s. Return zero if range is
        # unavailable or stopping cannot leave self.stop_margin_mm of clearance.
        raise NotImplementedError("Complete RangeSafetyController.update")
