# Draw a square from measured wheel travel and estimated heading.

from math import pi

from robot_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_setup import ROBOT_CONFIG
from student_work import build_drawing
from ucsb_xrp import elapsed_time_s, load_world


SIDE_SPEED_MM_S = 140.0  # Requested forward speed on each square side, mm/s.
SIDE_DISTANCE_MM = 180.0  # Measured axle-center travel required for each side, mm.
TURN_RATE_RAD_S = 1.5  # Requested counterclockwise turn rate at each corner, rad/s.
TURN_ANGLE_RAD = pi / 2.0  # Estimated heading change required at each corner: 90 degrees.
MAXIMUM_SEGMENT_TIME_S = 8.0  # Stop a segment that has not completed within 8 s.


checks_passed = run_exercise_checks()
# The example check reports differences; the current program still runs.
if not checks_passed:
    print("Example checks differ; running the current virtual drawing")

segments = build_drawing(
    side_speed_mm_s=SIDE_SPEED_MM_S,
    side_distance_mm=SIDE_DISTANCE_MM,
    turn_rate_rad_s=TURN_RATE_RAD_S,
    turn_angle_rad=TURN_ANGLE_RAD,
)
robot = make_robot(ROBOT_CONFIG)
try:  # Ensure finally stops motors on exit.
    state = robot.start(load_world().initial_pose)  # Initialize estimated pose; reset measurements.
    # Compare each side or turn with its own starting state; bound stalled segments.
    for segment in segments:
        segment_start = state
        while elapsed_time_s(state.measurements.time_ms, segment_start.measurements.time_ms) < MAXIMUM_SEGMENT_TIME_S:
            if segment.is_complete(segment_start, state):
                break
            state = robot.step(segment.command())
        else:
            # This block runs if elapsed time reached the limit before completion.
            raise RuntimeError("No measured completion for " + segment.name)
finally:
    robot.stop()
print("Tutorial 2 drawing complete")
print("final_pose:", state.pose)
