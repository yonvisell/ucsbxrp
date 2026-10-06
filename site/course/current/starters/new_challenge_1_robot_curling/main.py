# Drive distance d using measured wheel travel and your stopping controller.

from challenge import INITIAL_POSE, TRAVEL_DISTANCE_MM, MAXIMUM_RUN_TIME_S
from challenge import STATIONARY_SPEED_MM_S, STATIONARY_DURATION_S
from live_variables import publish_curling_trial, publish_curling_values
from motion_timer import MotionTimer
from robot_setup import ROBOT_CONFIG, make_robot
from stopping_controller import speed_for_distance
from ucsb_xrp import MotionCommand, elapsed_time_s


robot = make_robot(ROBOT_CONFIG)  # Assemble the hardware reader and selected component objects.
try:  # Normal completion or a Python exception reaches the motor stop in finally.
    state = robot.start(INITIAL_POSE)  # Set encoder travel and saved component values to zero; set the starting pose.
    first = state.measurements  # A record with named time, position, increment, and speed fields.
    initial_position_mm = (first.left_position_mm + first.right_position_mm) / 2.0
    publish_curling_trial(TRAVEL_DISTANCE_MM, initial_position_mm)  # Save this trial's distance and measurement origin for CSV export.
    timer = MotionTimer(first.time_ms, STATIONARY_SPEED_MM_S, STATIONARY_DURATION_S)
    travel_mm = 0.0
    stop_requested = False

    while True:  # Use the latest measurements to choose the next straight-motion request.
        remaining_mm = TRAVEL_DISTANCE_MM - travel_mm
        speed_mm_s = 0.0 if stop_requested else speed_for_distance(remaining_mm)
        command = MotionCommand(speed_mm_s, 0.0)  # Forward mm/s; zero turn rate in rad/s.
        if command.forward_speed_mm_s < 0.0:
            raise ValueError("speed_for_distance must return a nonnegative speed")
        stop_requested = stop_requested or speed_mm_s == 0.0  # Keep requesting zero after the first stop decision.
        state = robot.step(command)  # Set motor commands, wait for the sample, then read and process encoders.
        measured = state.measurements
        travel_mm = (measured.left_position_mm + measured.right_position_mm) / 2.0 - initial_position_mm
        remaining_mm = TRAVEL_DISTANCE_MM - travel_mm
        timer.update(measured, stop_requested)  # Estimate motion duration and consecutive time at rest.
        if elapsed_time_s(measured.time_ms, first.time_ms) >= MAXIMUM_RUN_TIME_S:
            robot.stop()  # Remove motor effort immediately at the first sample reaching two minutes.
            timer.motion_time_s = MAXIMUM_RUN_TIME_S  # A timed-out trial reports 120 s, including a stalled trial.
            publish_curling_values(remaining_mm, 0.0, timer.motion_time_s, True)
            reason = "time_limit"  # Retain this sample's distance; do not measure later coasting.
            break
        publish_curling_values(remaining_mm, command.forward_speed_mm_s, timer.motion_time_s)
        if timer.stop_confirmed:
            reason = "stationary" if timer.moved else "no_motion"
            break

    print("Straight trial: result={} motion_time_s={:.2f} remaining_mm={:.1f}".format(
        reason, timer.motion_time_s, remaining_mm,
    ))
finally:
    robot.stop()  # Zero motor effort after completion or a Python exception; IDE Stop also stops through the target service.
