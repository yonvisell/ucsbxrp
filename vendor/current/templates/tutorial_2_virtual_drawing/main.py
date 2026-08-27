"""Execute a checked Tutorial 2 drawing on the Virtual XRP."""

from course_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_config import ROBOT_CONFIG
from student_work import build_drawing
from ucsb_xrp import MotionCommand, Pose


def run_drawing():
    if not run_exercise_checks():
        print("Complete the remaining exercises in student_work.py")
        return

    segments = build_drawing()
    robot = make_robot(ROBOT_CONFIG)
    state = robot.start(Pose(0.0, 0.0, 0.0))
    try:
        for segment in segments:
            command = MotionCommand(
                segment.forward_speed_mm_s,
                segment.turn_rate_rad_s,
            )
            for _ in range(segment.steps):
                state = robot.step(command)
    finally:
        robot.stop()
    print("Tutorial 2 drawing complete")
    print("final_pose:", state.pose)


run_drawing()
