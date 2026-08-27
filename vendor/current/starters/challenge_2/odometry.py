"""Estimate planar robot position and heading from measured wheel travel."""

from ucsb_xrp.student_api import OdometryBase


class Odometry(OdometryBase):
    """Retain the latest Pose and update it from measured wheel travel."""

    def reset(self, initial_pose):
        """Store and return the initial Pose in mm and rad."""
        # Store and return the pose at the beginning of the run.
        raise NotImplementedError("Complete Odometry.reset")

    def update(self, left_increment_mm, right_increment_mm):
        """Return the updated Pose after two measured wheel increments in mm."""
        # Apply one straight or curved wheel-travel increment to the saved pose.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        """Return the most recently stored Pose in mm and rad."""
        # Return the most recently stored pose.
        raise NotImplementedError("Complete Odometry.pose")
