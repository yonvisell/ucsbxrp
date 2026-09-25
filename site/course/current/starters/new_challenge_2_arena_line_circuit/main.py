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


# Assemble selected wheel and sensing components separately from local steering.
robot = make_robot(ROBOT_CONFIG)
follower = make_line_follower(LINE_FOLLOWER_SETTINGS)
follower.reset()
lap = LapProgress()  # Track ordered checkpoints and return to the finish bar.
try:
    # Establish encoder/time origins and request floor readings on every step.
    state = robot.start(INITIAL_POSE, read_reflectance=True)
    start_ms = state.measurements.time_ms
    while True:  # Read sensors and request motion until lap completion or line loss.
        apply_line_controls(follower)
        readings = state.measurements.reflectance
        if readings is None:
            result = "reflectance_unavailable"
            break
        # Both sensors must see the wide bar; pose supplies ordered checkpoints.
        on_finish = min(readings.left, readings.right) >= FINISH_THRESHOLD
        if lap.update(state.pose, on_finish, FINISH_CONFIRM_SAMPLES):
            result = "complete"
            break
        # An unseen line requests zero motion while the loss duration accumulates.
        if not lap.observe_line(readings, state.measurements.dt_s, LINE_VISIBLE_THRESHOLD):
            command = STOP_COMMAND
            if lap.lost_line_s >= MAXIMUM_LOST_LINE_S:
                result = "line_lost"
                break
        else:
            command = follower.update(readings, state.measurements.dt_s)
        # Publish the decision made from this sample before acquiring the next.
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
