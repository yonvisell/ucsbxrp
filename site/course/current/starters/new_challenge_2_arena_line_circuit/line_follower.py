# Saved starting values for each Run; Monitor changes last for that Run only.
# Tune the target you use. Virtual values are independent of physical calibration.
from sys import platform

if platform == "rp2":
    CRUISE_SPEED_MM_S = 100.0  # Requested forward speed; zero pauses motion.
    P_GAIN_RAD_S = 1.8  # Proportional steering gain, rad/s.
    I_GAIN_RAD_S2 = 0.0  # Integral steering gain, rad/s^2.
    D_GAIN_RAD = 0.025  # Derivative steering gain, rad.
else:
    CRUISE_SPEED_MM_S = 100.0
    P_GAIN_RAD_S = 1.8
    I_GAIN_RAD_S2 = 0.0
    D_GAIN_RAD = 0.025

from ucsb_xrp import LineFollowerBase


class LineFollower(LineFollowerBase):
    def reset(self):
        super().reset()  # Clear preceding error, accumulated error, and line_error.
        self.p_term_rad_s = 0.0  # Actual proportional contribution before the turn limit.
        self.i_term_rad_s = 0.0  # Actual integral contribution before the turn limit.
        self.d_term_rad_s = 0.0  # Actual derivative contribution before the turn limit.

    def update(self, reflectance, dt_s):
        # Return MotionCommand(forward_speed_mm_s, turn_rate_rad_s).
        # Left minus right is self.line_error; positive error requests a left turn.
        # Use self.settings for cruise, gains, and supplied operating limits.
        # Accumulate error using dt_s; bound the integral; avoid division by zero.
        # Store the actual P/I/D terms above; unused terms remain zero.
        # Both readings >= waypoint_dark_threshold hide lateral error: hold the
        # preceding trajectory, without integrating or differentiating the bar.
        # Resume without a derivative kick. Zero cruise always requests a stop.
        # Bound speed by cruise (even below minimum_speed_mm_s) and turning by
        # maximum_turn_rate_rad_s. reset() must clear any additional history.
        raise NotImplementedError("Complete LineFollower.update")
