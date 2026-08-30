# Use two normalized reflectance readings to follow the line locally.

from ucsb_xrp import LineFollowerBase


class LineFollower(LineFollowerBase):
    def update(self, reflectance, dt_s):
        # Return MotionCommand(forward_speed_mm_s, turn_rate_rad_s).
        # reflectance.left and .right are 0 on a light floor and 1 on a dark line.
        raise NotImplementedError("Complete LineFollower.update")
