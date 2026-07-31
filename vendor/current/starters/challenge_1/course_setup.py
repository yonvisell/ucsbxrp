"""Select supplied or student Challenge 1 components."""

from student_components import SensorModel as StudentSensorModel
from student_components import WheelSpeedController as StudentWheelController
from ucsb_xrp_reference import SensorModel as SuppliedSensorModel
from ucsb_xrp_reference import WheelSpeedController as SuppliedWheelController


# Change one flag only after its student component passes software tests.
USE_STUDENT_SENSOR_MODEL = False
USE_STUDENT_WHEEL_SPEED_CONTROLLER = False


def make_sensor_model(config):
    if USE_STUDENT_SENSOR_MODEL:
        return StudentSensorModel(config)
    return SuppliedSensorModel(config)


def make_wheel_speed_controller(config):
    if USE_STUDENT_WHEEL_SPEED_CONTROLLER:
        return StudentWheelController(config)
    return SuppliedWheelController(config)
