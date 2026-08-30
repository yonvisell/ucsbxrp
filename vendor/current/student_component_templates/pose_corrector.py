# Correct odometry position from stationary observations of known walls.

from ucsb_xrp.student_api import PoseCorrectorBase


class PoseCorrector(PoseCorrectorBase):
    # PoseCorrectorBase validates and stores sensor_forward_offset_mm.

    def reset(self, raw_pose):
        raise NotImplementedError("Complete PoseCorrector.reset")

    def corrected_pose(self, raw_pose):
        raise NotImplementedError("Complete PoseCorrector.corrected_pose")

    def observe_x(self, raw_pose, range_mm, wall_x_mm, facing_positive_x):
        # Correct x only. range_mm begins at the forward sensor origin.
        raise NotImplementedError("Complete PoseCorrector.observe_x")

    def observe_y(self, raw_pose, range_mm, wall_y_mm, facing_positive_y):
        # Correct y only. Preserve the raw odometry heading.
        raise NotImplementedError("Complete PoseCorrector.observe_y")
