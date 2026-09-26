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


robot = make_robot(ROBOT_CONFIG)  # Create the robot instance.
follower = make_line_follower(LINE_FOLLOWER_SETTINGS)  # Create the line controller.
follower.reset()  # Clear previous error and integral values.
lap = LapProgress()  # Initialize checkpoint and finish-bar counters.
try:  # Run the loop; finally stops the motors when this block exits.
    state = robot.start(INITIAL_POSE, read_reflectance=True)  # Initialize estimated pose; reset measurements; read floor sensors.
    start_ms = state.measurements.time_ms  # Save the run start timestamp.
    while True:  # Update steering each sample until the lap ends or the line is lost.
        apply_line_controls(follower)  # Copy current slider values into the controller.
        readings = state.measurements.reflectance
        if readings is None:
            result = "reflectance_unavailable"
            break
        on_finish = min(readings.left, readings.right) >= FINISH_THRESHOLD  # Both sensors detect dark tape.
        if lap.update(state.pose, on_finish, FINISH_CONFIRM_SAMPLES):
            result = "complete"
            break
        if not lap.observe_line(readings, state.measurements.dt_s, LINE_VISIBLE_THRESHOLD):
            command = STOP_COMMAND  # Stop while neither sensor detects the line.
            if lap.lost_line_s >= MAXIMUM_LOST_LINE_S:
                result = "line_lost"
                break
        else:
            command = follower.update(readings, state.measurements.dt_s)  # Calculate forward speed and turn rate.
        publish_line_values(
            readings, command, follower.line_error, lap.checkpoints_reached,
            "line_lost_stopping" if lap.lost_line_s else "following",
        )
        state = robot.step(command, read_reflectance=True)  # Apply motion and read the next sample.
    print("Line circuit: result={} checkpoints={}/{} elapsed_s={}".format(
        result, lap.checkpoints_reached, len(CHECKPOINTS_MM),
        elapsed_time_s(state.measurements.time_ms, start_ms),
    ))
finally:
    robot.stop()  # Stop after completion, a break, or an exception.
