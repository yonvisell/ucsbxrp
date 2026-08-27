"""Estimate planar robot position and heading from measured wheel travel."""

from ucsb_xrp.student_api import OdometryBase


class Odometry(OdometryBase):
    def reset(self, initial_pose):
        # Store and return the pose at the beginning of the run.
        raise NotImplementedError("Complete Odometry.reset")

    def update(self, left_increment_mm, right_increment_mm):
        # Integrate one straight or circular-arc wheel-travel increment.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        # Return the most recently stored pose.
        raise NotImplementedError("Complete Odometry.pose")
