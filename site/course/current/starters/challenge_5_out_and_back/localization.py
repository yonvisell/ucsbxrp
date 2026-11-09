# Estimate pose using wheel travel and camera based gps.
# Add wheel displacement since image capture before applying each new GPS pose.

from array import array
from math import cos, sin
from ucsb_xrp import Pose, wrap_angle_rad
from ucsb_xrp.localization import ticks_diff

HISTORY_SAMPLES = 32  # Wheel motion retained for GPS delay compensation.


class Localization:
    def __init__(self, config):
        self.config = config

    def reset(self, initial_pose, time_ms):
        self.pose = initial_pose
        self.sample_number = 0
        self.gps_capture_time_ms = None
        # Preallocate sample times and cumulative wheel displacement in world coordinates.
        self.sample_times = array('i', [time_ms] * HISTORY_SAMPLES)
        self.motion_x = array('f', [0.0] * HISTORY_SAMPLES)
        self.motion_y = array('f', [0.0] * HISTORY_SAMPLES)
        self.motion_heading = array('f', [0.0] * HISTORY_SAMPLES)
        return self.pose

    def apply_gps(self, gps_fix):
        # Locate the samples around image capture and add the subsequent wheel motion.
        current = self.sample_number % HISTORY_SAMPLES
        newer = current
        for offset in range(1, min(self.sample_number + 1, HISTORY_SAMPLES)):
            older = (self.sample_number - offset) % HISTORY_SAMPLES
            if ticks_diff(gps_fix.capture_time_ms, self.sample_times[older]) >= 0:
                fraction = ticks_diff(gps_fix.capture_time_ms, self.sample_times[older]) / ticks_diff(self.sample_times[newer], self.sample_times[older])
                self.pose = Pose(
                    gps_fix.pose.x_mm + self.motion_x[current] - self.motion_x[older] - fraction * (self.motion_x[newer] - self.motion_x[older]),
                    gps_fix.pose.y_mm + self.motion_y[current] - self.motion_y[older] - fraction * (self.motion_y[newer] - self.motion_y[older]),
                    wrap_angle_rad(gps_fix.pose.heading_rad + self.motion_heading[current] - self.motion_heading[older] - fraction * (self.motion_heading[newer] - self.motion_heading[older])),
                )
                self.gps_capture_time_ms = gps_fix.capture_time_ms
                return
            newer = older

    def update_pose(self, measurements, gps_fix=None):
        predicted = self.predict(self.pose, measurements.left_increment_mm, measurements.right_increment_mm)
        previous = self.sample_number % HISTORY_SAMPLES
        self.sample_number += 1
        current = self.sample_number % HISTORY_SAMPLES
        # Retain wheel displacement; GPS corrections are not robot movement.
        self.sample_times[current] = measurements.time_ms
        self.motion_x[current] = self.motion_x[previous] + predicted.x_mm - self.pose.x_mm
        self.motion_y[current] = self.motion_y[previous] + predicted.y_mm - self.pose.y_mm
        self.motion_heading[current] = self.motion_heading[previous] + wrap_angle_rad(predicted.heading_rad - self.pose.heading_rad)
        self.pose = predicted
        if gps_fix is not None:
            self.apply_gps(gps_fix)
        return self.pose

    def predict(self, pose, left_increment_mm, right_increment_mm):
        # Compute new pose from the prior pose and the pair of wheel travel increments.
        pose_new = None
        raise NotImplementedError("TODO: Complete Localization.predict")
        return pose_new
