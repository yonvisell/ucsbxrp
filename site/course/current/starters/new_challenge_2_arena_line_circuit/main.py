# Follow the dark line for one lap; stop if the line is lost.
from challenge import CHECKPOINTS_MM, INITIAL_POSE, MAXIMUM_LOST_LINE_S
from course_setup import make_line_follower, make_robot
from lap_progress import LapProgress
from live_variables import publish_line_values
from robot_config import (
    FINISH_CONFIRM_SAMPLES,
    FINISH_THRESHOLD,
    LINE_FOLLOWER_SETTINGS,
    LINE_VISIBLE_THRESHOLD,
    ROBOT_CONFIG,
    apply_line_controls,
)
from ucsb_xrp import STOP_COMMAND, elapsed_time_s


robot = make_robot(ROBOT_CONFIG)
follower = make_line_follower(LINE_FOLLOWER_SETTINGS)
follower.reset()
lap = LapProgress()
try:
    state = robot.start(INITIAL_POSE, read_reflectance=True)
    start_ms = state.measurements.time_ms
    while True:
        apply_line_controls(follower)
        readings = state.measurements.reflectance
        if readings is None:
            result = "reflectance_unavailable"
            break
        on_finish = min(readings.left, readings.right) >= FINISH_THRESHOLD
        if lap.update(state.pose, on_finish, FINISH_CONFIRM_SAMPLES):
            result = "complete"
            break
        if not lap.observe_line(readings, state.measurements.dt_s, LINE_VISIBLE_THRESHOLD):
            command = STOP_COMMAND
            if lap.lost_line_s >= MAXIMUM_LOST_LINE_S:
                result = "line_lost"
                break
        else:
            command = follower.update(readings, state.measurements.dt_s)
        publish_line_values(
            readings, command, follower.line_error, lap.checkpoints_reached,
            "line_lost_stopping" if lap.lost_line_s else "following",
        )
        state = robot.step(command, read_reflectance=True)
    print("Line circuit: result={} checkpoints={}/{} elapsed_s={}".format(
        result, lap.checkpoints_reached, len(CHECKPOINTS_MM),
        elapsed_time_s(state.measurements.time_ms, start_ms),
    ))
finally:  # Stop the motors when the loop finishes or raises an error.
    robot.stop()
