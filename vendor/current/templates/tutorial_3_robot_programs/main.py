# Construct the robot and call the Tutorial 3 student program.

from course_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_config import ROBOT_CONFIG
from student_work import run_robot_program


def run_tutorial():
    # Do not construct the robot until the software-only exercise passes.
    if not run_exercise_checks():
        print("Complete the remaining exercise in student_work.py")
        return None

    robot = make_robot(ROBOT_CONFIG)
    # The checked student function owns its final stop, including error paths.
    final_state = run_robot_program(robot)
    print("Tutorial 3 run complete")
    print("final_pose:", final_state.pose)
    return final_state


run_tutorial()
