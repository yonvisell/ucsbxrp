# Lesson 6: use repeated range measurements to decide when to stop.

from ucsb_xrp import RobotConfig, XRPBot

from tutorial_helpers import drive_until_close


STOP_RANGE_MM = 320.0
TIME_LIMIT_MS = 3500

bot = XRPBot(RobotConfig(max_drive_command=0.45))
try:
    final_range_mm = drive_until_close(
        bot,
        left_command=0.42,
        right_command=0.42,
        stop_range_mm=STOP_RANGE_MM,
        time_limit_ms=TIME_LIMIT_MS,
    )
finally:
    bot.stop()

if final_range_mm is None:
    print("Lesson 6 complete: time limit reached")
else:
    print("Lesson 6 complete: obstacle detected at", round(final_range_mm), "mm")
