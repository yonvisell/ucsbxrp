# Lesson 6: use short, bounded commands to draw an L with the virtual XRP.

from time import sleep_ms

from ucsb_xrp import DriveCommand, RobotConfig, XRPBot


bot = XRPBot(RobotConfig(max_drive_command=0.4))


def command_for(left, right, duration_ms):
    bot.set_drive(DriveCommand(left, right))
    sleep_ms(duration_ms)
    bot.stop()


try:
    command_for(0.32, 0.32, 1000)
    command_for(-0.28, 0.28, 650)
    command_for(0.32, 0.32, 700)
    print("virtual drawing complete")
finally:
    bot.stop()
