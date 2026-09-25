# Select either the supplied reference class or the class in each project file.

from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive,
    Odometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelController,
)
from wheel_speed_controller import WheelSpeedController as StudentWheelController


# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False


def make_robot(config):
    SensorModel = StudentSensorModel if USE_STUDENT_SENSOR_MODEL else SuppliedSensorModel
    WheelSpeedController = StudentWheelController if USE_STUDENT_WHEEL_SPEED_CONTROLLER else SuppliedWheelController
    return Robot(config, XRPBot(config), SensorModel(config), WheelSpeedController(config), DifferentialDrive(config), Odometry(config))
