"""Supplied controller for experimental Challenge 9: Arena Circuit."""

from ucsb_xrp import LineFollowerBase, MotionCommand


class LineFollower(LineFollowerBase):
    """Transparent PID line follower; mission completion stays in main.py."""

    __slots__ = ()

    def update(self, reflectance, dt_s):
        if reflectance is None:
            raise ValueError("reflectance is required")
        if (
            not isinstance(dt_s, (int, float))
            or isinstance(dt_s, bool)
            or dt_s < 0.0
        ):
            raise ValueError("dt_s must be nonnegative")

        self.line_error = reflectance.left - reflectance.right
        self.integral_error += self.line_error * dt_s
        limit = self.settings["integral_limit_s"]
        self.integral_error = min(max(self.integral_error, -limit), limit)
        derivative = 0.0 if dt_s == 0.0 else (self.line_error - self.last_error) / dt_s
        self.last_error = self.line_error

        turn_rate = (
            self.settings["kp_rad_s"] * self.line_error
            + self.settings["ki_rad_s2"] * self.integral_error
            + self.settings["kd_rad"] * derivative
        )
        maximum_turn = self.settings["maximum_turn_rate_rad_s"]
        turn_rate = min(max(turn_rate, -maximum_turn), maximum_turn)
        speed_fraction = 1.0 - self.settings["turn_slowdown"] * (
            abs(turn_rate) / maximum_turn
        )
        forward_speed = self.settings["cruise_speed_mm_s"] * speed_fraction
        forward_speed = max(forward_speed, self.settings["minimum_speed_mm_s"])
        return MotionCommand(forward_speed, turn_rate)
