# Estimate pose (position and heading) using wheel travel and camera based gps.
#
# When camera based gps is received, the predicted pose is set to gps_pose
#
# Otherwise predict() updates the pose based on the wheel travel increments and heading

from math import cos, sin
from ucsb_xrp import Pose
from ucsb_xrp.student_api import LocalizationBase


class Localization(LocalizationBase):
    def update_pose(self, pose, left_increment_mm, right_increment_mm, gps_pose=None):
        # Update the pose from either gps or wheel travel:
        predicted_pose = self.predict(pose, left_increment_mm, right_increment_mm)
        if gps_pose is not None:
            return gps_pose
        return predicted_pose

    def predict(self, pose, left_increment_mm, right_increment_mm):
        # Compute and return new pose using arguments
        # pose: prior position and heading x_mm, y_mm, heading_rad
        # left_increment_mm, right_increment_mm: wheel travel increments
        pose_new = None
        raise NotImplementedError("Complete Localization.predict")
        return pose_new
