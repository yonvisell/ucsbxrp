"""Student implementations accumulated through Challenge 4."""

from ucsb_xrp.student_api import (
    DifferentialDriveBase,
    GridPlannerBase,
    NavigationControllerBase,
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


class NavigationController(NavigationControllerBase):
    def start(self, goals):
        raise NotImplementedError("Complete NavigationController.start")

    def update(self, pose):
        raise NotImplementedError("Complete NavigationController.update")

    def current_goal(self):
        raise NotImplementedError("Complete NavigationController.current_goal")

    def is_complete(self):
        raise NotImplementedError("Complete NavigationController.is_complete")


class GridPlanner(GridPlannerBase):
    def plan(self, grid, start, goal):
        # Use a frontier, visited/predecessor records, and reconstruct the path.
        raise NotImplementedError("Complete GridPlanner.plan")
