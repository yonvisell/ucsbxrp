"""Read physical XRP sensors while the course configuration is motion-locked.

This example requires XRPLib on an XRP. It never requests nonzero motor effort
and repeats an explicit stop in ``finally``. It is not a motor-motion test.
"""

from ucsb_xrp import MotorEfforts, RobotConfig, XRPBot


config = RobotConfig()
if not config.is_motion_locked:
    raise RuntimeError("no-motion example requires a motion-locked RobotConfig")

bot = None
try:
    bot = XRPBot(config)
    bot.set_efforts(MotorEfforts(0.0, 0.0))
    sensors = bot.read(include_range=True)

    print("motion_locked:", config.is_motion_locked)
    print("time_ms:", sensors.time_ms)
    print("left_encoder_count:", sensors.left_encoder_count)
    print("right_encoder_count:", sensors.right_encoder_count)
    print("range_mm:", sensors.range_mm)
    print("button_pressed:", sensors.button_pressed)
finally:
    if bot is not None:
        bot.stop()
