"""Estimate planar robot position and heading from measured wheel travel."""

from ucsb_xrp import Pose
from ucsb_xrp.student_api import OdometryBase


class Odometry(OdometryBase):
    """Retain the latest Pose and update it from wheel-distance increments."""

    def reset(self, initial_pose):
        """Store and return the initial Pose in world mm and rad."""
        raise NotImplementedError("Complete Odometry.reset")

    def update(self, left_increment_mm, right_increment_mm):
        """Return the Pose after one pair of measured wheel increments.

        Both arguments are signed distances in mm since the preceding sample.
        Use self.config.track_width_mm. Update the stored x position, y
        position, and wrapped heading; do not use requested speeds, motor
        commands, or simulator ground truth.
        """
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        """Return the most recently stored Pose in world mm and rad."""
        raise NotImplementedError("Complete Odometry.pose")
