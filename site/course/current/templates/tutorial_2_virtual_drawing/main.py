# Draw a square from measured wheel travel and estimated heading.

from math import pi

from course_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_config import ROBOT_CONFIG
from student_work import build_drawing
from ucsb_xrp import load_world


SIDE_SPEED_MM_S = 140.0
SIDE_DISTANCE_MM = 180.0
TURN_RATE_RAD_S = 1.5
TURN_ANGLE_RAD = pi / 2.0
MAXIMUM_SEGMENT_SAMPLES = 400  # Fault stop if sensing or motion makes no progress.


checks_passed = run_exercise_checks()
if not checks_passed:
    print("Example checks differ; running the current virtual drawing")

segments = build_drawing(
    side_speed_mm_s=SIDE_SPEED_MM_S,
    side_distance_mm=SIDE_DISTANCE_MM,
    turn_rate_rad_s=TURN_RATE_RAD_S,
    turn_angle_rad=TURN_ANGLE_RAD,
)
robot = make_robot(ROBOT_CONFIG)
try:
    state = robot.start(load_world().initial_pose)
    for segment in segments:
        segment_start = state
        for _ in range(MAXIMUM_SEGMENT_SAMPLES):
            if segment.is_complete(segment_start, state):
                break
            state = robot.step(segment.command())
        else:
            raise RuntimeError("No measured completion for " + segment.name)
finally:  # Stop motors whenever this motion block exits.
    robot.stop()
print("Tutorial 2 drawing complete")
print("final_pose:", state.pose)
