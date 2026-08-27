"""Construct the robot and call the Tutorial 3 student program."""

from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from student_work import run_robot_program


robot = make_robot(ROBOT_CONFIG)
try:
    try:
        final_state = run_robot_program(robot)
    except NotImplementedError as error:
        print("NOT COMPLETED ·", error)
    else:
        print("Tutorial 3 run complete")
        print("final_pose:", final_state.pose)
finally:
    # The student's function owns the normal stop; this outer stop also covers
    # an incomplete or incorrect function during tutorial development.
    robot.stop()
