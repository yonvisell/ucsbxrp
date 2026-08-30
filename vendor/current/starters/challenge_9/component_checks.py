from course_setup import make_line_follower
from robot_config import LINE_FOLLOWER_SETTINGS
from ucsb_xrp import MotionCommand, ReflectanceReadings


def check_line_follower():
    follower = make_line_follower(LINE_FOLLOWER_SETTINGS)
    follower.reset()
    centered = follower.update(ReflectanceReadings(0.6, 0.6), 0.02)
    left = follower.update(ReflectanceReadings(0.8, 0.2), 0.02)
    right = follower.update(ReflectanceReadings(0.2, 0.8), 0.02)
    if not all(isinstance(item, MotionCommand) for item in (centered, left, right)):
        raise AssertionError("update() must return MotionCommand")
    if centered.turn_rate_rad_s != 0.0:
        raise AssertionError("equal readings must request no turn")
    if left.turn_rate_rad_s <= 0.0 or right.turn_rate_rad_s >= 0.0:
        raise AssertionError("the turn must point toward the darker sensor")
    print("PASS · centered, line-left, and line-right examples")


check_line_follower()
