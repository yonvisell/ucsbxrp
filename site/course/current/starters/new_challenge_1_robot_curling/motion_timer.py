# Measure motion duration and confirm rest from recorded wheel speeds.
# This class reads measurements; it neither selects speed nor commands the robot.

from ucsb_xrp import elapsed_time_s


class MotionTimer:
    # Inputs: initial timestamp (ms), stationary speed (mm/s), confirmation time (s).
    # Results: motion_time_s, moved, and stop_confirmed after each update().
    def __init__(self, start_ms, stationary_speed_mm_s, stationary_duration_s):
        self.start_ms = start_ms
        self.stationary_speed_mm_s = stationary_speed_mm_s
        self.stationary_duration_s = stationary_duration_s
        self.first_motion_s = None
        self.motion_end_s = 0.0
        self.was_moving = False
        self.stationary_s = 0.0
        self.motion_time_s = 0.0
        self.moved = False
        self.stop_confirmed = False

    def update(self, measurements, stop_requested):
        elapsed_s = elapsed_time_s(measurements.time_ms, self.start_ms)
        speeds = measurements.wheel_speeds
        moving = max(abs(speeds.left_mm_s), abs(speeds.right_mm_s)) > self.stationary_speed_mm_s
        if moving:
            if self.first_motion_s is None:
                self.first_motion_s = max(0.0, elapsed_s - measurements.dt_s)  # Start of the first moving sample.
            self.motion_end_s = elapsed_s
        elif self.was_moving:
            self.motion_end_s = elapsed_s  # First sample at rest after motion.
        self.was_moving = moving
        self.stationary_s = self.stationary_s + measurements.dt_s if stop_requested and not moving else 0.0
        self.moved = self.first_motion_s is not None
        self.motion_time_s = self.motion_end_s - self.first_motion_s if self.moved else 0.0
        self.stop_confirmed = self.stationary_s >= self.stationary_duration_s
