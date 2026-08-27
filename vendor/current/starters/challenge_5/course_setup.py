"""Select components and assemble the Challenge 5 robot and mission."""

import differential_drive as student_differential_drive
import grid_planner as student_grid_planner
import navigation_controller as student_navigation_controller
import odometry as student_odometry
import sensor_model as student_sensor_model
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    GridPlanner,
    NavigationController,
    Odometry,
    SensorModel,
    WheelSpeedController,
)
import wheel_speed_controller as student_wheel_speed_controller


# False selects the supplied class. Change one flag to True only after
# the matching student class passes the Test components examples.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_ODOMETRY = False
USE_STUDENT_NAVIGATION_CONTROLLER = False
USE_STUDENT_GRID_PLANNER = False


def _selected(flag, student_class, supplied_class):
    return student_class if flag else supplied_class


def make_robot(config):
    return Robot(
        config,
        XRPBot(config),
        _selected(
            USE_STUDENT_SENSOR_MODEL,
            student_sensor_model.SensorModel,
            SensorModel,
        )(config),
        _selected(
            USE_STUDENT_WHEEL_SPEED_CONTROLLER,
            student_wheel_speed_controller.WheelSpeedController,
            WheelSpeedController,
        )(config),
        _selected(
            USE_STUDENT_DIFFERENTIAL_DRIVE,
            student_differential_drive.DifferentialDrive,
            DifferentialDrive,
        )(config),
        _selected(
            USE_STUDENT_ODOMETRY,
            student_odometry.Odometry,
            Odometry,
        )(config),
    )


def make_navigation_controller(config):
    return _selected(
        USE_STUDENT_NAVIGATION_CONTROLLER,
        student_navigation_controller.NavigationController,
        NavigationController,
    )(config)


def make_grid_planner():
    return _selected(
        USE_STUDENT_GRID_PLANNER,
        student_grid_planner.GridPlanner,
        GridPlanner,
    )()
