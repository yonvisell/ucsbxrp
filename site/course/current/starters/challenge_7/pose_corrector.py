# Correct odometry position from stationary observations of known walls.

from ucsb_xrp.student_api import PoseCorrectorBase

# PoseCorrector — Correct estimated position from known-wall range observations.
# Called by: Wall-range pose correction task.
# Methods: reset(), corrected_pose(), observe_x(), observe_y().
# Inputs: Pose and wall-range measurements (mm).
# State: Retained x/y translation offsets; inherited sensor forward offset (mm).
# Returns: Corrected Pose (mm, rad).

class PoseCorrector(PoseCorrectorBase):
    # PoseCorrectorBase validates and stores sensor_forward_offset_mm.

    def reset(self, raw_pose):
        # raw_pose is the current odometry Pose in arena-frame mm and radians.
        # Clear retained x/y translation offsets and return raw_pose unchanged.
        raise NotImplementedError("Complete PoseCorrector.reset")

    def corrected_pose(self, raw_pose):
        # Add the retained x/y translation offsets (mm) to raw_pose.x_mm and
        # raw_pose.y_mm; preserve raw_pose.heading_rad. reset() must establish
        # the offsets before this method applies them.
        raise NotImplementedError("Complete PoseCorrector.corrected_pose")

    def observe_x(self, raw_pose, range_mm, wall_x_mm, facing_positive_x):
        # raw_pose is the odometry Pose measured while stationary and facing
        # along the arena x axis. range_mm is the forward sensor-to-wall distance
        # in mm; wall_x_mm is that wall's fixed arena x coordinate in mm.
        # facing_positive_x is True toward increasing x, False toward decreasing
        # x. Account for self.sensor_forward_offset_mm between axle midpoint
        # and sensor; update only the retained x correction. Return a Pose with
        # raw_pose.heading_rad unchanged.
        raise NotImplementedError("Complete PoseCorrector.observe_x")

    def observe_y(self, raw_pose, range_mm, wall_y_mm, facing_positive_y):
        # raw_pose is the odometry Pose measured while stationary and facing
        # along the arena y axis. range_mm is the forward sensor-to-wall distance
        # in mm; wall_y_mm is that wall's fixed arena y coordinate in mm.
        # facing_positive_y is True toward increasing y, False toward decreasing
        # y. Account for self.sensor_forward_offset_mm between axle midpoint
        # and sensor; update only the retained y correction. Return a Pose with
        # raw_pose.heading_rad unchanged.
        raise NotImplementedError("Complete PoseCorrector.observe_y")
