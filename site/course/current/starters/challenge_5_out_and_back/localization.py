"""Predict changes in position and heading from measured wheel travel.

The pose locates the midpoint between the driven wheels: x/y in millimeters,
heading counterclockwise from world +x in radians. The supplied update() combines
this prediction with camera based gps corrections to provide navigation's pose.
"""
from math import cos, sin
from ucsb_xrp import Pose
from ucsb_xrp.student_api import LocalizationBase


class Localization(LocalizationBase):
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
