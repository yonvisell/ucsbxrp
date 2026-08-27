"""Construct the robot and call the Tutorial 3 student program."""

from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from student_work import run_robot_program


def run_tutorial():
    """Construct the robot and run the student's bounded program."""
    robot = make_robot(ROBOT_CONFIG)
    try:
        try:
            final_state = run_robot_program(robot)
        except NotImplementedError as error:
            print("NOT COMPLETED ·", error)
            return None
        print("Tutorial 3 run complete")
        print("final_pose:", final_state.pose)
        return final_state
    finally:
        # The student's function performs the normal stop. This second stop is
        # harmless and also covers an incomplete function during development.
        robot.stop()


run_tutorial()
