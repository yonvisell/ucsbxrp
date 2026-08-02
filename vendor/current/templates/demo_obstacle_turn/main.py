# Drive to an obstacle, turn left, then drive to the next obstacle.

from math import pi, sqrt

from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, Pose, wrap_angle_rad


CLOSE_RANGE_MM = 180.0
FORWARD_SPEED_MM_S = 120.0
TURN_RATE_RAD_S = 0.75
TURN_TOLERANCE_RAD = 0.06
MAX_FORWARD_TRAVEL_MM = 1100.0
MAX_TURN_STEPS = 300

robot = make_robot(ROBOT_CONFIG)
state = None


def drive_until_close():
    global state
    start_pose = state.pose
    range_samples = []
    while True:
        state = robot.step(
            MotionCommand(FORWARD_SPEED_MM_S, 0.0),
            read_range=True,
        )
        range_samples.append(state.measurements.range_mm)
        range_samples = range_samples[-5:]
        range_mm = robot.estimate_range(range_samples, minimum_usable=3)
        if range_mm is not None and range_mm <= CLOSE_RANGE_MM:
            return

        dx_mm = state.pose.x_mm - start_pose.x_mm
        dy_mm = state.pose.y_mm - start_pose.y_mm
        travel_mm = sqrt(dx_mm * dx_mm + dy_mm * dy_mm)
        if travel_mm >= MAX_FORWARD_TRAVEL_MM:
            raise RuntimeError("No obstacle detected within the demo distance")


def turn_left():
    global state
    target_heading = wrap_angle_rad(state.pose.heading_rad + pi / 2.0)
    for _ in range(MAX_TURN_STEPS):
        error = wrap_angle_rad(target_heading - state.pose.heading_rad)
        if abs(error) <= TURN_TOLERANCE_RAD:
            return
        state = robot.step(MotionCommand(0.0, TURN_RATE_RAD_S))
    raise RuntimeError("The XRP did not complete the left turn")


try:
    print("Press and release USER to start the obstacle-turn demo")
    state = robot.start(Pose(0.0, 0.0, 0.0))
    drive_until_close()
    turn_left()
    drive_until_close()
    print("Obstacle-turn demo complete")
    print("final_pose:", state.pose)
finally:
    robot.stop()
