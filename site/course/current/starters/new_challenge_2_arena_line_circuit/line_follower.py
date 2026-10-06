# Use two normalized reflectance readings to follow the line locally.

from ucsb_xrp import LineFollowerBase

# LineFollower — Convert paired floor readings into local steering.
# Called by: Line Circuit control loop.
# Methods: update().
# Inputs: ReflectanceReadings (0 light to 1 dark), elapsed time (s).
# State: last_error and integral_error save preceding and accumulated sensor error.
# Returns: MotionCommand (mm/s, rad/s).

class LineFollower(LineFollowerBase):
    def update(self, reflectance, dt_s):
        # Return MotionCommand(forward_speed_mm_s, turn_rate_rad_s).
        # reflectance.left and .right range from 0 (light) to 1 (dark).
        # Store left minus right as self.line_error for Monitor.
        # A darker left reading should request a positive (left) turn;
        # a darker right reading should request a negative (right) turn.
        # dt_s is elapsed seconds since the preceding floor reading. Use the
        # gain and speed entries in self.settings; bound forward speed by
        # minimum_speed_mm_s and cruise_speed_mm_s and turning by
        # maximum_turn_rate_rad_s. The inherited reset() sets last_error,
        # integral_error, and line_error to zero.
        raise NotImplementedError("Complete LineFollower.update")
