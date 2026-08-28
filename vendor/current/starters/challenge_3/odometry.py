# Estimate planar robot position and heading from measured wheel travel.

from ucsb_xrp import Pose
from ucsb_xrp.student_api import OdometryBase


class Odometry(OdometryBase):
    # Keep the latest Pose between successive update() calls.

    def reset(self, initial_pose):
        # Store and return the initial Pose in world mm and rad.
        raise NotImplementedError("Complete Odometry.reset")

    def update(self, left_increment_mm, right_increment_mm):
        # Return the Pose after one pair of measured wheel increments. Both
        # arguments are signed distances in mm since the preceding sample. Use
        # self.config.track_width_mm and update the stored x, y, and wrapped
        # heading. Odometry uses measurements, not commands or simulator pose.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        # Return the most recently stored Pose in world mm and rad.
        raise NotImplementedError("Complete Odometry.pose")
