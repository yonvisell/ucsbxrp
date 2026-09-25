# Read RobotState and run one straight motion to a measured wheel-travel target.

from ucsb_xrp import MotionCommand, Robot, RobotState, load_world


MAXIMUM_SAMPLES = 400  # Fault stop if a sensor or wheel reports no progress.


def mean_wheel_position_mm(state: RobotState) -> float:
    # The axle midpoint has traveled the mean of the signed wheel positions.
    measurements = state.measurements
    return (measurements.left_position_mm + measurements.right_position_mm) / 2.0


def run_robot_program(
    robot: Robot,
    forward_speed_mm_s: float,
    target_distance_mm: float,
) -> RobotState:
    # Request forward_speed_mm_s until measured wheel travel reaches
    # target_distance_mm. Return the final RobotState; always stop the robot.
    if forward_speed_mm_s <= 0.0 or target_distance_mm <= 0.0:
        raise ValueError("speed and target distance must be positive")
    try:
        state = robot.start(load_world().initial_pose)
        start_position_mm = mean_wheel_position_mm(state)
        command = MotionCommand(forward_speed_mm_s, 0.0)
        for _ in range(MAXIMUM_SAMPLES):
            if mean_wheel_position_mm(state) - start_position_mm >= target_distance_mm:
                return state
            state = robot.step(command)
        raise RuntimeError("Measured wheel travel did not reach the target")
    finally:  # Stop the motors after completion or a Python exception.
        robot.stop()
