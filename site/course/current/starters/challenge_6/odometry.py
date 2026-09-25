# Estimate planar robot position and heading from measured wheel travel.

from ucsb_xrp import Pose
from ucsb_xrp.student_api import OdometryBase

# Odometry — Update arena-frame position and heading from measured wheel travel.
# Called by: Robot.start() and Robot.step().
# Methods: reset(), update(), pose().
# Inputs: Initial Pose and signed left/right wheel travel since last sample (mm).
# State: Latest estimated Pose in the fixed arena coordinate frame.
# Returns: Pose(x_mm, y_mm, heading_rad), measured in mm, mm, rad.

class Odometry(OdometryBase):
    # Keep the latest Pose between successive update() calls.

    def reset(self, initial_pose):
        # Store and return initial_pose: x_mm and y_mm locate the robot's
        # axle midpoint in the fixed arena frame; heading_rad is its angle
        # from the positive x axis, measured counterclockwise in radians.
        raise NotImplementedError("Complete Odometry.reset")

    def update(self, left_increment_mm, right_increment_mm):
        # left_increment_mm and right_increment_mm are signed distances
        # traveled by each wheel since the preceding sample. The config's
        # track_width_mm is the distance between the two wheels. Update the
        # retained axle-midpoint x_mm/y_mm in the fixed arena frame and wrap
        # heading_rad in radians; return that Pose. Use measured travel rather
        # than requested commands or simulator ground truth.
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        # Return the retained Pose(x_mm, y_mm, heading_rad) after reset()
        # or update(); positions are arena-frame mm and heading is radians.
        raise NotImplementedError("Complete Odometry.pose")
