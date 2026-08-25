# Lesson 5: import and reuse a tested motion function from another file.

from ucsb_xrp import RobotConfig, XRPBot

from tutorial_helpers import drive_for


route = (
    ("first line", 0.30, 0.30, 500),
    ("left turn", -0.28, 0.28, 600),
    ("second line", 0.30, 0.30, 500),
)

bot = XRPBot(RobotConfig(max_drive_command=0.35))
try:
    for name, left_command, right_command, duration_ms in route:
        print("running:", name)
        drive_for(bot, left_command, right_command, duration_ms)
finally:
    bot.stop()

print("Lesson 5 complete: imported helper ran", len(route), "segments")
