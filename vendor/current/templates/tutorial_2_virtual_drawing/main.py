# Execute a checked Tutorial 2 drawing on the Virtual XRP.

from math import pi

from course_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_config import ROBOT_CONFIG
from student_work import build_drawing
from ucsb_xrp import Pose


SIDE_SPEED_MM_S = 250.0
SIDE_STEPS = 60
TURN_RATE_RAD_S = pi
TURN_STEPS = 25


def run_drawing():
    if not run_exercise_checks():
        print("Restore the runnable example before drawing")
        return

    segments = build_drawing(
        side_speed_mm_s=SIDE_SPEED_MM_S,
        side_steps=SIDE_STEPS,
        turn_rate_rad_s=TURN_RATE_RAD_S,
        turn_steps=TURN_STEPS,
    )
    robot = make_robot(ROBOT_CONFIG)
    try:
        state = robot.start(Pose(0.0, 0.0, 0.0))
        for segment in segments:
            command = segment.command()
            for _ in range(segment.steps):
                state = robot.step(command)
    finally:
        robot.stop()
    print("Tutorial 2 drawing complete")
    print("final_pose:", state.pose)


run_drawing()
