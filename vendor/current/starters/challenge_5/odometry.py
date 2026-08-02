"""Student implementation of differential-drive odometry."""

from ucsb_xrp.student_api import OdometryBase


class Odometry(OdometryBase):
    def reset(self, initial_pose):
        raise NotImplementedError("Complete Odometry.reset")

    def update(self, left_increment_mm, right_increment_mm):
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        raise NotImplementedError("Complete Odometry.pose")
