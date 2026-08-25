# Lesson 4: reject invalid input and stop the robot even after an error.

from time import sleep_ms

from ucsb_xrp import DriveCommand, RobotConfig, XRPBot


def drive_for(bot, command, duration_ms):
    if duration_ms <= 0:
        raise ValueError("duration_ms must be positive")
    bot.set_drive(command)
    try:
        sleep_ms(duration_ms)
    finally:
        # This cleanup runs whether sleep_ms finishes or raises an exception.
        bot.stop()


bot = XRPBot(RobotConfig(max_drive_command=0.35))
safe_segments = 0
try:
    drive_for(bot, DriveCommand(0.28, 0.28), 400)
    safe_segments += 1

    # The invalid duration demonstrates a controlled, expected failure.
    drive_for(bot, DriveCommand(0.28, 0.28), -100)
except ValueError as error:
    print("Rejected setting:", error)
finally:
    bot.stop()

print("Lesson 4 complete:", safe_segments, "safe segment")
