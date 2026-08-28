# Collect and report a bounded zero-motion physical-XRP preflight.

from course_setup import make_robot
from exercise_checks import run_exercise_checks
from robot_config import ROBOT_CONFIG
from student_work import preflight_report
from ucsb_xrp import Pose, STOP_COMMAND


SAMPLE_COUNT = 125


def collect_stationary_samples(robot):
    # Robot.step maintains the sample schedule; no additional delay is needed.
    states = []
    try:
        state = robot.start(Pose(0.0, 0.0, 0.0))
        states.append(state)
        for _ in range(SAMPLE_COUNT):
            state = robot.step(STOP_COMMAND, read_range=True)
            states.append(state)
        return tuple(states)
    finally:
        robot.stop()


def run_preflight():
    if not run_exercise_checks():
        print("Complete preflight_report before running the preflight")
        return None

    states = collect_stationary_samples(make_robot(ROBOT_CONFIG))
    report = preflight_report(states)
    print("Zero-motion preflight complete")
    print("sample_count:", report["sample_count"])
    print("elapsed_time_s:", report["elapsed_time_s"])
    print(
        "maximum_abs_wheel_position_mm:",
        report["maximum_abs_wheel_position_mm"],
    )
    print("usable_range_count:", report["usable_range_count"])
    print("nearest_range_mm:", report["nearest_range_mm"])
    print("button_was_pressed:", report["button_was_pressed"])
    return report


run_preflight()
