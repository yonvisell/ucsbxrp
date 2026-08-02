"""Supplied Challenge 2 differential-drive and odometry components."""

from math import cos, sin

from ucsb_xrp._validation import require_number
from ucsb_xrp.records import MotionCommand, Pose, WheelSpeeds
from ucsb_xrp.student_api import DifferentialDriveBase, OdometryBase


class DifferentialDrive(DifferentialDriveBase):
    """Convert body velocity into left and right wheel velocities."""

    __slots__ = ()

    def wheel_speeds(self, command):
        if not isinstance(command, MotionCommand):
            raise TypeError("command must be a MotionCommand")
        half_track = self.config.track_width_mm / 2.0
        turn_component = command.turn_rate_rad_s * half_track
        return WheelSpeeds(
            command.forward_speed_mm_s - turn_component,
            command.forward_speed_mm_s + turn_component,
        )


class Odometry(OdometryBase):
    """Integrate measured wheel increments using exact planar arc geometry."""

    __slots__ = ("_pose",)

    def __init__(self, config):
        super().__init__(config)
        self._pose = None

    @property
    def pose(self):
        if self._pose is None:
            raise RuntimeError("call reset(initial_pose) before reading pose")
        return self._pose

    def reset(self, initial_pose):
        if not isinstance(initial_pose, Pose):
            raise TypeError("initial_pose must be a Pose")
        self._pose = initial_pose
        return self._pose

    def update(self, left_increment_mm, right_increment_mm):
        if self._pose is None:
            raise RuntimeError("call reset(initial_pose) before update")
        left = require_number("left_increment_mm", left_increment_mm)
        right = require_number("right_increment_mm", right_increment_mm)
        center = (left + right) / 2.0
        heading_change = (right - left) / self.config.track_width_mm
        heading = self._pose.heading_rad
        if abs(heading_change) < 1e-9:
            x_mm = self._pose.x_mm + center * cos(heading)
            y_mm = self._pose.y_mm + center * sin(heading)
        else:
            radius = center / heading_change
            next_heading = heading + heading_change
            x_mm = self._pose.x_mm + radius * (sin(next_heading) - sin(heading))
            y_mm = self._pose.y_mm - radius * (cos(next_heading) - cos(heading))
        self._pose = Pose(x_mm, y_mm, heading + heading_change)
        return self._pose
