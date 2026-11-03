"""Estimate position and heading using wheel travel and camera based gps.

The pose locates the midpoint between the driven wheels: x/y in millimeters,
heading counterclockwise from world +x in radians. update_pose() uses predict()
for wheel movement, then replaces the result when a new GPS pose is available.
LocalizationBase.update() handles GPS reception and time alignment.
"""
from math import cos, sin
from ucsb_xrp import Pose
from ucsb_xrp.student_api import LocalizationBase


class Localization(LocalizationBase):
    def update_pose(self, pose, left_increment_mm, right_increment_mm, gps_pose=None):
        """Update the pose from wheel travel and a new camera based gps pose."""
        predicted_pose = self.predict(pose, left_increment_mm, right_increment_mm)
        # gps_pose includes wheel movement since image capture, up to this sample.
        if gps_pose is not None:
            return gps_pose
        return predicted_pose

    def predict(self, pose, left_increment_mm, right_increment_mm):
        """Return a new Pose after two wheel travel increments [mm]; forward is positive."""
        # Use mean wheel travel for the wheel midpoint's travel [mm].
        # Use the right-minus-left travel and self.config.track_width_mm for
        # the heading change [rad]; more right-wheel travel turns left.
        # Approximate this short step by projecting travel onto world x/y with
        # cos and sin of the direction halfway between starting and final headings.
        # Add that displacement to pose.x_mm and pose.y_mm. The returned
        # Pose's heading is the final orientation, after the full heading change.
        # Calculate from the arguments; the supplied base retains pose history.
        raise NotImplementedError("Complete Localization.predict")
