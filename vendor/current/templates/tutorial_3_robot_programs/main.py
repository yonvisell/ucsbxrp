# Construct the Virtual XRP and call the checked Tutorial 3 program.

from course_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_config import ROBOT_CONFIG
from student_work import mean_wheel_position_mm, run_robot_program


FORWARD_SPEED_MM_S = 120.0
SAMPLE_COUNT = 125


def run_tutorial():
    checks_passed = run_exercise_checks()
    if not checks_passed:
        print("Example checks differ; running the current virtual program")

    final_state = run_robot_program(
        make_robot(ROBOT_CONFIG),
        FORWARD_SPEED_MM_S,
        SAMPLE_COUNT,
    )
    print("Tutorial 3 run complete")
    print("mean_wheel_position_mm:", mean_wheel_position_mm(final_state))
    print("final_pose:", final_state.pose)
    return final_state


run_tutorial()
