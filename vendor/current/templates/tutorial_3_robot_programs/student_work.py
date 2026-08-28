# Complete the RobotState calculation and finite sampled run for Tutorial 3.

from ucsb_xrp import MotionCommand, Pose, Robot, RobotState


# Return the mean of the latest left and right wheel positions.
def mean_wheel_position_mm(state: RobotState) -> float:
    # Read state.measurements, then average its two wheel-position fields.
    raise NotImplementedError("complete mean_wheel_position_mm")


# Run one fixed-duration straight motion and return the final RobotState.
def run_robot_program(
    robot: Robot,
    forward_speed_mm_s: float,
    sample_count: int,
) -> RobotState:
    # Validate the speed and sample count before starting the robot.
    # In try: start once, step sample_count times, and return the latest state.
    # In finally: call robot.stop(). Do not add a separate delay.
    raise NotImplementedError("complete run_robot_program")
