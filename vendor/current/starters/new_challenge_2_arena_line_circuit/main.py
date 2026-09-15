"""Follow one qualified circuit; stop with an explicit result if the line is lost."""
from challenge import INITIAL_POSE
from course_setup import make_line_follower, make_robot
from lap_progress import LapProgress
from robot_config import (
    FINISH_CONFIRM_SAMPLES,
    FINISH_THRESHOLD,
    LINE_FOLLOWER_SETTINGS,
    LINE_VISIBLE_THRESHOLD,
    ROBOT_CONFIG,
)
from ucsb_xrp import MotionCommand, elapsed_time_s, live

MAXIMUM_RUN_TIME_S = 100.0
MAXIMUM_LOST_LINE_S = 0.4

def run_challenge():
    robot = make_robot(ROBOT_CONFIG)
    follower = make_line_follower(LINE_FOLLOWER_SETTINGS)
    follower.reset()
    lap = LapProgress()
    lost_line_s = 0.0
    result = "timeout"
    try:
        state = robot.start(INITIAL_POSE, read_reflectance=True)
        start_ms = state.measurements.time_ms
        while elapsed_time_s(state.measurements.time_ms, start_ms) < MAXIMUM_RUN_TIME_S:
            readings = state.measurements.reflectance
            if readings is None:
                result = "reflectance_unavailable"
                break
            on_finish = min(readings.left, readings.right) >= FINISH_THRESHOLD
            if lap.update(state.pose, on_finish, FINISH_CONFIRM_SAMPLES):
                result = "complete"
                break
            if max(readings.left, readings.right) < LINE_VISIBLE_THRESHOLD:
                command = MotionCommand(0.0, 0.0)
                lost_line_s += state.measurements.dt_s
                if lost_line_s >= MAXIMUM_LOST_LINE_S:
                    result = "line_lost"
                    break
            else:
                command = follower.update(readings, state.measurements.dt_s)
                lost_line_s = 0.0
            live.plot("reflectance_left", readings.left)
            live.plot("reflectance_right", readings.right)
            live.plot("line_error", follower.line_error)
            live.watch("checkpoints_reached", lap.checkpoints_reached)
            live.watch("phase", "line_lost_stopping" if lost_line_s else "following")
            state = robot.step(command, read_reflectance=True)
        print("Line circuit: result={} checkpoints={}/4 elapsed_s={}".format(result, lap.checkpoints_reached, elapsed_time_s(state.measurements.time_ms, start_ms)))
        return state
    finally:  # Stop the motors after normal completion or a Python exception.
        robot.stop()

run_challenge()
