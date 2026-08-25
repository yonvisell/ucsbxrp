# Lesson 3: objects keep each motion segment's data and behavior together.

from time import sleep_ms

from ucsb_xrp import DriveCommand, RobotConfig, XRPBot


class MotionSegment:
    def __init__(self, name, left_command, right_command, duration_ms):
        self.name = name
        self.command = DriveCommand(left_command, right_command)
        self.duration_ms = duration_ms

    def run(self, bot):
        if self.duration_ms <= 0:
            raise ValueError("duration_ms must be positive")
        print("running:", self.name)
        bot.set_drive(self.command)
        sleep_ms(self.duration_ms)
        bot.stop()


route = (
    MotionSegment("first line", 0.30, 0.30, 500),
    MotionSegment("left turn", -0.28, 0.28, 450),
    MotionSegment("second line", 0.30, 0.30, 500),
)

bot = XRPBot(RobotConfig(max_drive_command=0.35))
try:
    for segment in route:
        segment.run(bot)
finally:
    bot.stop()

print("Lesson 3 complete:", len(route), "motion segments")
