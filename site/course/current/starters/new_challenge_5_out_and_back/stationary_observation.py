# Confirm measured rest before collecting ultrasound readings.

from challenge import STATIONARY_DURATION_S, STATIONARY_SPEED_MM_S, MAXIMUM_STOP_WAIT_S
from ucsb_xrp import STOP_COMMAND, elapsed_time_s


# Inputs: started Robot and its latest RobotState.
# Returns: latest RobotState and True if both wheels remained below the speed
# threshold for the required duration; False if the stopping wait expired.
def wait_until_stationary(robot, state):
    stationary_s = 0.0
    start_ms = state.measurements.time_ms
    while stationary_s < STATIONARY_DURATION_S and elapsed_time_s(
        state.measurements.time_ms, start_ms
    ) <= MAXIMUM_STOP_WAIT_S:  # Wait for low wheel speeds, up to the stop-wait limit.
        state = robot.step(STOP_COMMAND)  # Request zero motion and read wheel speeds.
        speeds = state.measurements.wheel_speeds
        if max(abs(speeds.left_mm_s), abs(speeds.right_mm_s)) <= STATIONARY_SPEED_MM_S:
            stationary_s += state.measurements.dt_s  # Accumulate time with both wheel speeds at or below the threshold.
        else:
            stationary_s = 0.0  # The low-speed interval must be continuous.
    return state, stationary_s >= STATIONARY_DURATION_S
