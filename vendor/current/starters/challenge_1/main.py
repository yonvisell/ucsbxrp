"""Challenge 1: drive the requested straight-line distance."""

try:
    from time import sleep_ms
except ImportError:
    from time import sleep

    def sleep_ms(duration_ms):
        sleep(duration_ms / 1000)

from challenge import TARGET_TIME_S, TRAVEL_DISTANCE_MM
from course_setup import make_sensor_model, make_wheel_speed_controller
from robot_config import ROBOT_CONFIG, STRAIGHT_CONFIG
from ucsb_xrp import StraightLineController, WheelSpeeds, XRPBot


bot = XRPBot(ROBOT_CONFIG)
try:
    print("Press and release USER to start Challenge 1")
    bot.wait_for_button()
    bot.reset_encoders()

    sensor_model = make_sensor_model(ROBOT_CONFIG)
    wheel_controller = make_wheel_speed_controller(ROBOT_CONFIG)
    wheel_controller.reset()
    measurements = sensor_model.reset(bot.read())

    straight = StraightLineController(STRAIGHT_CONFIG)
    straight.start(measurements, TRAVEL_DISTANCE_MM)

    while not straight.is_complete():
        command = straight.update(measurements)
        target = WheelSpeeds(
            command.forward_speed_mm_s,
            command.forward_speed_mm_s,
        )
        bot.set_efforts(wheel_controller.update(target, measurements.wheel_speeds))
        sleep_ms(ROBOT_CONFIG.sample_period_ms)
        measurements = sensor_model.update(bot.read())

    print("Challenge 1 complete")
    print("target_distance_mm:", TRAVEL_DISTANCE_MM)
    print("target_time_s:", TARGET_TIME_S)
finally:
    bot.stop()
