# Execute a checked Tutorial 2 drawing on the Virtual XRP.

from course_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_config import ROBOT_CONFIG
from student_work import build_drawing
from ucsb_xrp import Pose


SIDE_SPEED_MM_S = 120.0
SIDE_STEPS = 125
TURN_RATE_RAD_S = 1.3
TURN_STEPS = 70


def run_drawing():
    checks_passed = run_exercise_checks()
    if not checks_passed:
        print("Example checks differ; running the current virtual drawing")

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
