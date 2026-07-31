"""Run the initial Challenge 1 data-flow check without motor motion."""

from challenge import TARGET_TIME_S, TRAVEL_DISTANCE_MM
from course_setup import make_sensor_model, make_wheel_speed_controller
from robot_config import ROBOT_CONFIG, STRAIGHT_CONFIG
from ucsb_xrp import StraightLineController, WheelSpeeds, XRPBot


if not ROBOT_CONFIG.is_motion_locked:
    raise RuntimeError("the initial Challenge 1 check must remain motion-locked")

bot = None
try:
    bot = XRPBot(ROBOT_CONFIG)
    bot.reset_encoders()

    sensor_model = make_sensor_model(ROBOT_CONFIG)
    wheel_controller = make_wheel_speed_controller(ROBOT_CONFIG)
    wheel_controller.reset()

    sensor_model.reset(bot.read())
    measurements = sensor_model.update(bot.read())

    straight = StraightLineController(STRAIGHT_CONFIG)
    straight.start(measurements, TRAVEL_DISTANCE_MM)
    planned_command = straight.update(measurements)
    planned_wheel_speeds = WheelSpeeds(
        planned_command.forward_speed_mm_s,
        planned_command.forward_speed_mm_s,
    )
    efforts = wheel_controller.update(
        planned_wheel_speeds,
        measurements.wheel_speeds,
    )
    bot.set_efforts(efforts)

    print("Challenge 1 no-motion check")
    print("travel_distance_mm:", TRAVEL_DISTANCE_MM)
    print("target_time_s:", TARGET_TIME_S)
    print("planned_speed_mm_s:", planned_command.forward_speed_mm_s)
    print("measured_speed_mm_s:", measurements.wheel_speeds)
    print("applied_motor_efforts:", efforts)
    print("motion_locked:", ROBOT_CONFIG.is_motion_locked)
finally:
    if bot is not None:
        bot.stop()
