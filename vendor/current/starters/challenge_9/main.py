# Experimental Challenge 9: follow the closed circuit for one lap.

from challenge import INITIAL_POSE
from course_setup import make_line_follower, make_robot
from robot_config import (
    FINISH_CONFIRM_SAMPLES,
    FINISH_THRESHOLD,
    LINE_FOLLOWER_SETTINGS,
    LINE_VISIBLE_THRESHOLD,
    ROBOT_CONFIG,
)
from ucsb_xrp import MotionCommand, live


def run_challenge():
    robot = make_robot(ROBOT_CONFIG)
    follower = make_line_follower(LINE_FOLLOWER_SETTINGS)
    follower.reset()
    left_start = False
    finish_samples = 0
    try:
        state = robot.start(INITIAL_POSE, read_reflectance=True)
        while True:
            readings = state.measurements.reflectance
            if readings is None:
                raise RuntimeError("Challenge 9 requires two reflectance sensors")

            both_on_finish = (
                readings.left >= FINISH_THRESHOLD
                and readings.right >= FINISH_THRESHOLD
            )
            if not both_on_finish:
                left_start = True
                finish_samples = 0
            elif left_start:
                finish_samples += 1
                if finish_samples >= FINISH_CONFIRM_SAMPLES:
                    print("Challenge 9 complete: one circuit with the line retained")
                    break

            if max(readings.left, readings.right) < LINE_VISIBLE_THRESHOLD:
                command = MotionCommand(0.0, 0.0)
            else:
                command = follower.update(readings, state.measurements.dt_s)
            live.plot("reflectance_left", readings.left)
            live.plot("reflectance_right", readings.right)
            live.plot("line_error", follower.line_error)
            state = robot.step(command, read_reflectance=True)
        return state
    finally:
        robot.stop()


run_challenge()
