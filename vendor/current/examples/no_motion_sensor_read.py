"""Read XRP sensors without commanding motion."""

from ucsb_xrp import MotorEfforts, RobotConfig, XRPBot


config = RobotConfig()
bot = None
try:
    bot = XRPBot(config)
    bot.set_efforts(MotorEfforts(0.0, 0.0))
    sensors = bot.read(include_range=True)

    print("motor_command:", "zero")
    print("time_ms:", sensors.time_ms)
    print("left_encoder_count:", sensors.left_encoder_count)
    print("right_encoder_count:", sensors.right_encoder_count)
    print("range_mm:", sensors.range_mm)
    print("button_pressed:", sensors.button_pressed)
finally:
    if bot is not None:
        bot.stop()
