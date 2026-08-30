"""Supplied Challenge 7 wall-range pose-correction component."""

from math import isfinite

from ucsb_xrp.records import Pose
from ucsb_xrp.student_api import PoseCorrectorBase


class PoseCorrector(PoseCorrectorBase):
    """Maintain a translation from raw odometry into the corrected map frame."""

    __slots__ = ("_x_offset_mm", "_y_offset_mm", "_ready")

    def __init__(self, sensor_forward_offset_mm):
        PoseCorrectorBase.__init__(self, sensor_forward_offset_mm)
        self._x_offset_mm = 0.0
        self._y_offset_mm = 0.0
        self._ready = False

    @staticmethod
    def _require_pose(pose):
        if not isinstance(pose, Pose):
            raise TypeError("raw_pose must be a Pose")

    @staticmethod
    def _distance(value, name, positive=False):
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(name + " must be numeric")
        value = float(value)
        if not isfinite(value) or (positive and value <= 0.0):
            raise ValueError(name + " is outside its allowed range")
        return value

    def reset(self, raw_pose):
        self._require_pose(raw_pose)
        self._x_offset_mm = 0.0
        self._y_offset_mm = 0.0
        self._ready = True
        return raw_pose

    def corrected_pose(self, raw_pose):
        self._require_pose(raw_pose)
        if not self._ready:
            raise RuntimeError("reset() must be called first")
        return Pose(
            raw_pose.x_mm + self._x_offset_mm,
            raw_pose.y_mm + self._y_offset_mm,
            raw_pose.heading_rad,
        )

    def observe_x(self, raw_pose, range_mm, wall_x_mm, facing_positive_x):
        self._require_pose(raw_pose)
        if not self._ready:
            raise RuntimeError("reset() must be called first")
        if not isinstance(facing_positive_x, bool):
            raise TypeError("facing_positive_x must be Boolean")
        range_mm = self._distance(range_mm, "range_mm", positive=True)
        wall_x_mm = self._distance(wall_x_mm, "wall_x_mm")
        signed_distance = range_mm + self.sensor_forward_offset_mm
        observed_x_mm = (
            wall_x_mm - signed_distance
            if facing_positive_x
            else wall_x_mm + signed_distance
        )
        self._x_offset_mm = observed_x_mm - raw_pose.x_mm
        return self.corrected_pose(raw_pose)

    def observe_y(self, raw_pose, range_mm, wall_y_mm, facing_positive_y):
        self._require_pose(raw_pose)
        if not self._ready:
            raise RuntimeError("reset() must be called first")
        if not isinstance(facing_positive_y, bool):
            raise TypeError("facing_positive_y must be Boolean")
        range_mm = self._distance(range_mm, "range_mm", positive=True)
        wall_y_mm = self._distance(wall_y_mm, "wall_y_mm")
        signed_distance = range_mm + self.sensor_forward_offset_mm
        observed_y_mm = (
            wall_y_mm - signed_distance
            if facing_positive_y
            else wall_y_mm + signed_distance
        )
        self._y_offset_mm = observed_y_mm - raw_pose.y_mm
        return self.corrected_pose(raw_pose)
