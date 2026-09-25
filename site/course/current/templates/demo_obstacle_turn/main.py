# Drive to an obstacle, turn left, then drive to the next obstacle.

from math import pi

from challenge import WORLD, TURN_TOLERANCE_RAD, TURN_TIMEOUT_S
from course_setup import make_robot
from live_variables import CLOSE_RANGE_MM, FORWARD_SPEED_MM_S, TURN_RATE_RAD_S, TURN_DIRECTION, SECOND_APPROACH, publish_heading_error, publish_phase, publish_range
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND, elapsed_time_s, wrap_angle_rad


def drive_until_close(robot, state):
    # A stopped reading also handles an obstacle already close at the start.
    state = robot.step(STOP_COMMAND, read_range=True)
    publish_phase("driving")
    while True:
        range_mm = state.measurements.range_mm
        publish_range(range_mm)
        if range_mm is not None and range_mm <= CLOSE_RANGE_MM.value:
            return state
        # No usable echo is normal in open space; keep looking for an obstacle.
        state = robot.step(MotionCommand(FORWARD_SPEED_MM_S.value, 0.0), read_range=True)


def turn_quarter_turn(robot, state):
    direction = 1.0 if TURN_DIRECTION.value == "left" else -1.0
    target_heading = wrap_angle_rad(state.pose.heading_rad + direction * pi / 2.0)
    started_ms = state.measurements.time_ms
    publish_phase("turning " + TURN_DIRECTION.value)
    while True:
        error_rad = wrap_angle_rad(target_heading - state.pose.heading_rad)
        publish_heading_error(error_rad)
        if abs(error_rad) <= TURN_TOLERANCE_RAD:
            return state
        if elapsed_time_s(state.measurements.time_ms, started_ms) >= TURN_TIMEOUT_S:
            raise RuntimeError("Rotation did not finish within 8 s; check wheel motion and encoder readings")
        direction = 1.0 if error_rad > 0.0 else -1.0
        # Slow near the target; correct either sign of heading error after overshoot.
        turn_rate = direction * min(TURN_RATE_RAD_S.value, 3.0 * abs(error_rad))
        state = robot.step(MotionCommand(0.0, turn_rate))


robot = make_robot(ROBOT_CONFIG)
try:  # The finally block stops the motors when this sequence exits.
    state = robot.start(WORLD.initial_pose)
    state = drive_until_close(robot, state)
    state = turn_quarter_turn(robot, state)
    if SECOND_APPROACH.value:
        state = drive_until_close(robot, state)
    publish_phase("complete")
    print("Obstacle-turn demo complete")
    print("final_pose:", state.pose)
finally:  # Runs after normal completion, a Python error, or cooperative Stop.
    robot.stop()
