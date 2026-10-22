# Calculate forward speed and steering rate from calibrated IR reflectance.
from ucsb_xrp import LineFollowerBase, MotionCommand


class LineFollower(LineFollowerBase):
    def reset(self):
        # Initialize a straight cruise command for the starting bar and any additional history.
        super().reset()  # Clear the current, previous and accumulated reflectance errors.
        self.p = 0.0  # Proportional steering contribution [rad/s].
        self.i = 0.0  # Integral steering contribution [rad/s].
        self.d = 0.0  # Derivative steering contribution [rad/s].

    def update(self, reflectance, dt_s):
        # Task: use calibrated reflectance to calculate forward speed and steering rate.
        # First store reflectance.left - reflectance.right in self.line_error; positive means turn left.
        # Calculate self.p, self.i and self.d with the gains "kp_rad_s", "ki_rad_s2" and "kd_rad" in self.settings.
        # Use self.last_error and dt_s for the derivative; use zero when dt_s is zero.
        # Keep self.i at zero unless you implement the optional accumulated error in self.integral_error.
        # For a bar, both readings reach "waypoint_dark_threshold": continue the preceding trajectory.
        # Hold error history and set p = i = d = 0 on a bar; use zero derivative on the first sample afterward.
        # Limit p + i + d to +/- "maximum_turn_rate_rad_s" and reduce "cruise_speed_mm_s" using "turn_slowdown".
        # Apply "minimum_speed_mm_s" without exceeding cruise; zero cruise stops both speed and steering.
        # Return a MotionCommand containing the resulting forward speed and steering rate.
        raise NotImplementedError("Complete LineFollower.update")
