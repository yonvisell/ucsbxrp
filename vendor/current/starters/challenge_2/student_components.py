"""Student implementations accumulated through Challenge 2."""

from ucsb_xrp.student_api import (
    DifferentialDriveBase,
    OdometryBase,
    SensorModelBase,
    WheelSpeedControllerBase,
)


class SensorModel(SensorModelBase):
    def reset(self, raw):
        raise NotImplementedError("Complete SensorModel.reset")

    def update(self, raw):
        raise NotImplementedError("Complete SensorModel.update")

    def estimate_range(self, samples, minimum_usable):
        raise NotImplementedError("Complete SensorModel.estimate_range in Challenge 5")


class WheelSpeedController(WheelSpeedControllerBase):
    def reset(self):
        pass

    def update(self, target, measured):
        raise NotImplementedError("Complete WheelSpeedController.update")


class DifferentialDrive(DifferentialDriveBase):
    def wheel_speeds(self, command):
        raise NotImplementedError("Complete DifferentialDrive.wheel_speeds")


class Odometry(OdometryBase):
    def reset(self, initial_pose):
        raise NotImplementedError("Complete Odometry.reset")

    def update(self, left_increment_mm, right_increment_mm):
        raise NotImplementedError("Complete Odometry.update")

    @property
    def pose(self):
        raise NotImplementedError("Complete Odometry.pose")
