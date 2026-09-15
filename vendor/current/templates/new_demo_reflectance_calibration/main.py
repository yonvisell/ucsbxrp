"""No motion: collect floor/tape readings for a fixed 10 s interval."""
from calibration import LEFT_DARK, LEFT_LIGHT, RIGHT_DARK, RIGHT_LIGHT, contrast
from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, elapsed_time_s, live, load_world

def run_demo():
    robot = make_robot(ROBOT_CONFIG)
    try:
        state = robot.start(load_world().initial_pose, read_reflectance=True)
        start_ms = state.measurements.time_ms
        sample_count = 0
        while elapsed_time_s(state.measurements.time_ms, start_ms) < 10.0:
            readings = state.measurements.reflectance
            if readings is None:
                raise RuntimeError("Reflectance unavailable: check the selected target and line sensors")
            live.plot("left_raw", readings.left)
            live.plot("right_raw", readings.right)
            live.plot("left_contrast", contrast(readings.left, LEFT_LIGHT, LEFT_DARK))
            live.plot("right_contrast", contrast(readings.right, RIGHT_LIGHT, RIGHT_DARK))
            state = robot.step(MotionCommand(0.0, 0.0), read_reflectance=True)
            sample_count += 1
        print("Reflectance calibration capture complete; samples:", sample_count)
        return state
    finally:  # Stop the motors after normal completion or a Python exception.
        robot.stop()

run_demo()
