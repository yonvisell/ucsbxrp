# Drive toward the target using measured distance and your stopping rule.

from challenge import INITIAL_POSE, TRAVEL_DISTANCE_MM
from challenge import STATIONARY_SPEED_MM_S, STATIONARY_DURATION_S
from live_variables import publish_curling_values
from motion_timer import MotionTimer
from robot_setup import ROBOT_CONFIG, make_robot
from stopping_controller import speed_for_distance
from ucsb_xrp import MotionCommand


robot = make_robot(ROBOT_CONFIG)  # Create the robot and its components.
try:  # Always execute the motor stop in finally.
    state = robot.start(INITIAL_POSE)  # Initialize estimated pose and reset measurements.
    first = state.measurements
    initial_position_mm = (first.left_position_mm + first.right_position_mm) / 2.0
    timer = MotionTimer(first.time_ms, STATIONARY_SPEED_MM_S, STATIONARY_DURATION_S)
    travel_mm = 0.0
    stop_requested = False

    while True:  # Choose speed, apply it, and read the next sample.
        remaining_mm = TRAVEL_DISTANCE_MM - travel_mm
        speed_mm_s = 0.0 if stop_requested else speed_for_distance(remaining_mm)
        command = MotionCommand(speed_mm_s, 0.0)  # Validate numeric speed; request no turning.
        if command.forward_speed_mm_s < 0.0:
            raise ValueError("speed_for_distance must return a nonnegative speed")
        stop_requested = stop_requested or speed_mm_s == 0.0  # The first zero request ends forward motion.
        state = robot.step(command)  # Apply motion, then read encoders and update measurements.
        measured = state.measurements
        travel_mm = (measured.left_position_mm + measured.right_position_mm) / 2.0 - initial_position_mm
        remaining_mm = TRAVEL_DISTANCE_MM - travel_mm
        timer.update(measured, stop_requested)  # Measure motion time and confirm the wheels have stopped.
        publish_curling_values(remaining_mm, command.forward_speed_mm_s, timer.motion_time_s)
        if timer.stop_confirmed:
            break

    reason = "stationary" if timer.moved else "no_motion"
    print("Straight trial: result={} motion_time_s={:.2f} remaining_mm={:.1f}".format(
        reason, timer.motion_time_s, remaining_mm,
    ))
finally:
    robot.stop()  # Stop after completion, Stop, or an exception.
