"""Read XRP sensors without commanding motion."""

from ucsb_xrp import DriveCommand, RobotConfig, XRPBot


def read_sensors():
    """Read and print one sensor sample while retaining zero motor command."""
    bot = XRPBot(RobotConfig())
    try:
        bot.set_drive(DriveCommand(0.0, 0.0))
        sensors = bot.read(include_range=True)

        print("motor_command:", "zero")
        print("time_ms:", sensors.time_ms)
        print("left_encoder_count:", sensors.left_encoder_count)
        print("right_encoder_count:", sensors.right_encoder_count)
        print("range_mm:", sensors.range_mm)
        print("button_pressed:", sensors.button_pressed)
        return sensors
    finally:
        bot.stop()


read_sensors()
