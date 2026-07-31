"""Exercise Challenge 1 components with recorded values and no hardware."""

from math import pi

from ucsb_xrp import RawSensors, RobotConfig, WheelSpeeds
from ucsb_xrp_reference import SensorModel, WheelSpeedController


# These calibration values make the arithmetic visible. This program never
# constructs XRPBot, so it cannot write the values to physical motors.
config = RobotConfig(
    wheel_diameter_mm=60.0,
    encoder_counts_per_revolution=600.0,
    left_encoder_sign=1,
    right_encoder_sign=-1,
    left_start_effort=0.10,
    right_start_effort=0.12,
    left_speed_effort_gain=0.002,
    right_speed_effort_gain=0.002,
    wheel_speed_kp=0.001,
    max_effort=0.40,
)

sensor_model = SensorModel(config)
sensor_model.reset(RawSensors(1000, 40, -20, None, False))
measurements = sensor_model.update(RawSensors(1100, 60, -40, None, False))

wheel_controller = WheelSpeedController(config)
efforts = wheel_controller.update(
    WheelSpeeds(80.0, 80.0),
    measurements.wheel_speeds,
)

expected_increment_mm = pi * 2.0
print("wheel_increment_mm:", measurements.left_increment_mm)
print("expected_increment_mm:", expected_increment_mm)
print("wheel_speed_mm_s:", measurements.left_speed_mm_s)
print("calculated_motor_efforts:", efforts)
