from course_setup import make_robot
from experiments import EXPERIMENT, EXPERIMENTS
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, elapsed_time_s, live, load_world

def run_demo():
    robot = make_robot(ROBOT_CONFIG)
    try:
        state = robot.start(load_world().initial_pose)
        for index, (command, duration_s) in enumerate(EXPERIMENTS[EXPERIMENT]):
            if duration_s <= 0 or duration_s > 10:
                raise ValueError("Each experiment segment must last between 0 and 10 s")
            start_ms = state.measurements.time_ms
            live.watch("segment", index + 1)
            while elapsed_time_s(state.measurements.time_ms, start_ms) < duration_s:
                state = robot.step(command)
                live.plot("estimated_heading_rad", state.pose.heading_rad)
                live.plot("estimated_x_mm", state.pose.x_mm)
                live.plot("estimated_y_mm", state.pose.y_mm)
            # Observe residual motion before the next segment.
            for _ in range(20):
                state = robot.step(MotionCommand(0.0, 0.0))
            print("segment:", index + 1, "estimated_pose:", state.pose)
        print("Odometry experiment complete:", EXPERIMENT)
        print("Compare estimated endpoint with measured axle-center pose; virtual truth is only a comparison in Monitor.")
        return state
    finally:  # Stop the motors after normal completion or a Python exception.
        robot.stop()

run_demo()
