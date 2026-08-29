# Runnable RobotState calculation and finite sampled run for Tutorial 3.

from ucsb_xrp import MotionCommand, Pose, Robot, RobotState


# Return the mean of the latest left and right wheel positions.
def mean_wheel_position_mm(state: RobotState) -> float:
    measurements = state.measurements
    return (
        measurements.left_position_mm + measurements.right_position_mm
    ) / 2.0


# Run one fixed-duration straight motion and return the final RobotState.
def run_robot_program(
    robot: Robot,
    forward_speed_mm_s: float,
    sample_count: int,
) -> RobotState:
    if forward_speed_mm_s <= 0.0:
        raise ValueError("forward speed must be positive")
    if not isinstance(sample_count, int) or sample_count <= 0:
        raise ValueError("sample count must be a positive integer")
    try:
        state = robot.start(Pose(0.0, 0.0, 0.0))
        command = MotionCommand(forward_speed_mm_s, 0.0)
        for _ in range(sample_count):
            state = robot.step(command)
        return state
    finally:
        robot.stop()
