# Check stationary sensors, then request one short straight motion.

from course_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_config import ROBOT_CONFIG
from student_work import preflight_report
from ucsb_xrp import MotionCommand, Pose, STOP_COMMAND


STATIONARY_SAMPLE_COUNT = 50
MOTION_SAMPLE_COUNT = 25
MOTION_SPEED_MM_S = 60.0


def collect_stationary_samples(robot):
    # Robot.step maintains the sample schedule; no additional delay is needed.
    states = []
    try:
        state = robot.start(Pose(0.0, 0.0, 0.0))
        states.append(state)
        for _ in range(STATIONARY_SAMPLE_COUNT):
            state = robot.step(STOP_COMMAND, read_range=True)
            states.append(state)
        return tuple(states)
    finally:
        robot.stop()


def run_short_motion(robot):
    # This fixed-time motion verifies motors and encoders; it is not distance control.
    try:
        initial_state = robot.start(Pose(0.0, 0.0, 0.0))
        state = initial_state
        command = MotionCommand(MOTION_SPEED_MM_S, 0.0)
        for _ in range(MOTION_SAMPLE_COUNT):
            state = robot.step(command)
        return initial_state, state
    finally:
        robot.stop()


def mean_wheel_position_mm(state):
    measurements = state.measurements
    return (
        measurements.left_position_mm + measurements.right_position_mm
    ) / 2.0


def run_preflight():
    if not run_exercise_checks():
        print("Restore the runnable report example before running the XRP")
        return None

    robot = make_robot(ROBOT_CONFIG)
    states = collect_stationary_samples(robot)
    report = preflight_report(states)
    print("Stationary preflight complete")
    for name in (
        "sample_count",
        "elapsed_time_s",
        "maximum_abs_wheel_position_mm",
        "usable_range_count",
        "nearest_range_mm",
        "button_was_pressed",
    ):
        print(name + ":", report[name])

    initial_state, final_state = run_short_motion(robot)
    wheel_travel_mm = mean_wheel_position_mm(final_state) - mean_wheel_position_mm(
        initial_state
    )
    print("Short motion check complete")
    print("motion_wheel_travel_mm:", wheel_travel_mm)
    print("final_pose:", final_state.pose)
    return report


run_preflight()
