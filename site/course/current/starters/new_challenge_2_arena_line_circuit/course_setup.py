# Choose one implementation of each component and assemble the line circuit.

from differential_drive import DifferentialDrive as StudentDifferentialDrive
from line_follower import LineFollower as StudentLineFollower
from ucsb_xrp_reference.challenge_9 import LineFollower as SuppliedLineFollower
from sensor_model import SensorModel as StudentSensorModel
from ucsb_xrp import Robot, XRPBot
from ucsb_xrp_reference import (
    DifferentialDrive as SuppliedDifferentialDrive,
    Odometry as SuppliedOdometry,
    SensorModel as SuppliedSensorModel,
    WheelSpeedController as SuppliedWheelSpeedController,
)
from wheel_speed_controller import (
    WheelSpeedController as StudentWheelSpeedController,
)


# True: use this project's class. False: use the supplied class.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_LINE_FOLLOWER = False


# Select project or supplied components before binding them to one Robot.
def make_robot(config):
    SensorModel = StudentSensorModel if USE_STUDENT_SENSOR_MODEL else SuppliedSensorModel
    WheelSpeedController = StudentWheelSpeedController if USE_STUDENT_WHEEL_SPEED_CONTROLLER else SuppliedWheelSpeedController
    DifferentialDrive = StudentDifferentialDrive if USE_STUDENT_DIFFERENTIAL_DRIVE else SuppliedDifferentialDrive
    return Robot(config, XRPBot(config), SensorModel(config), WheelSpeedController(config), DifferentialDrive(config), SuppliedOdometry(config))

# Local line steering is selected independently of wheel-speed control.
def make_line_follower(settings):
    if USE_STUDENT_LINE_FOLLOWER:
        return StudentLineFollower(settings)
    return SuppliedLineFollower(settings)
