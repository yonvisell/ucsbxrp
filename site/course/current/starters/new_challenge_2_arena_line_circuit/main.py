# Follow the dark line for one lap; stop if the line is lost.
from challenge import CHECKPOINTS_MM, INITIAL_POSE, MAXIMUM_LOST_LINE_S
from robot_setup import make_line_follower, make_robot
from lap_progress import LapProgress
from live_variables import publish_line_values
from robot_setup import (
    FINISH_CONFIRM_TIME_S,
    FINISH_THRESHOLD,
    LINE_FOLLOWER_SETTINGS,
    LINE_VISIBLE_THRESHOLD,
    ROBOT_CONFIG,
    apply_line_controls,
)
from ucsb_xrp import STOP_COMMAND, elapsed_time_s


robot = make_robot(ROBOT_CONFIG)  # Assemble the selected sensing, wheel-control, drive, and odometry objects.
follower = make_line_follower(LINE_FOLLOWER_SETTINGS)  # Create the line controller with its own saved sensor errors.
follower.reset()  # Clear previous error and integral values.
lap = LapProgress()  # Save checkpoint progress and finish/line-loss durations in one object.
try:  # Run the loop; finally stops the motors when this block exits.
    state = robot.start(INITIAL_POSE, read_reflectance=True)  # Initialize estimated pose; reset measurements; read floor sensors.
    start_ms = state.measurements.time_ms  # Save the run start timestamp.
    while True:  # Update steering each sample until the lap ends or the line is lost.
        apply_line_controls(follower)  # Update controller settings without resetting its saved sensor errors.
        readings = state.measurements.reflectance
        if readings is None:
            result = "reflectance_unavailable"
            break
        on_finish = min(readings.left, readings.right) >= FINISH_THRESHOLD  # Both sensors detect dark tape.
        if lap.update(state.pose, on_finish, state.measurements.dt_s, FINISH_CONFIRM_TIME_S):
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
        state = robot.step(command, read_reflectance=True)  # Convert motion to wheel targets, apply feedback, and return new measurements/pose.
    print("Line circuit: result={} checkpoints={}/{} elapsed_s={}".format(
        result, lap.checkpoints_reached, len(CHECKPOINTS_MM),
        elapsed_time_s(state.measurements.time_ms, start_ms),
    ))
finally:
    robot.stop()  # Stop after completion, a break, or an exception.
