# Drive an expanding spiral and stop before a nearby obstacle.

from math import pi

from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, Pose, STOP_COMMAND, live


FORWARD_SPEED = live.number(
    "forward_speed_mm_s",
    110.0,
    minimum=90.0,
    maximum=110.0,
    step=10.0,
    unit="mm/s",
    label="Forward speed",
)
WINDING_RATE = live.number(
    "spiral_winding_turns_per_m",
    0.8,
    minimum=0.5,
    maximum=1.0,
    step=0.1,
    unit="revolutions/m",
    label="Spiral winding rate",
)

OBSTACLE_STOP_MM = 150.0
SPIRAL_EXPANSION_MM = 1500.0
MAX_TRAVEL_MM = 350000.0
MAXIMUM_SAMPLES = 180000

def run_spiral():
    # Run the spiral to its travel limit and return its result text and final state.
    robot = make_robot(ROBOT_CONFIG)
    result = "Maximum travel distance reached"
    try:  # Run the motion; the finally block below stops it when this block exits.
        state = robot.start(Pose(0.0, 0.0, 0.0))

        # Check the range once before applying a moving command.
        state = robot.step(STOP_COMMAND, read_range=True)
        travel_mm = 0.0
        samples = 0

        while True:
            range_mm = state.measurements.range_mm
            if range_mm is not None and range_mm <= OBSTACLE_STOP_MM:
                result = "Obstacle detected; spiral stopped"
                break
            if travel_mm >= MAX_TRAVEL_MM:
                break
            if samples >= MAXIMUM_SAMPLES:
                result = "Maximum number of control updates reached"
                break

            speed_mm_s = FORWARD_SPEED.value
            revolutions_per_mm = WINDING_RATE.value / 1000.0
            expansion = 1.0 + travel_mm / SPIRAL_EXPANSION_MM
            # Convert revolutions per millimeter into yaw rate in radians per second.
            turn_rate_rad_s = 2.0 * pi * speed_mm_s * revolutions_per_mm / expansion

            live.plot("travel_mm", travel_mm, unit="mm", label="Travel")
            live.plot("turn_rate_rad_s", turn_rate_rad_s, unit="rad/s", label="Yaw rate")

            state = robot.step(MotionCommand(speed_mm_s, turn_rate_rad_s), read_range=True)
            travel_mm += (
                abs(state.measurements.left_increment_mm)
                + abs(state.measurements.right_increment_mm)
            ) / 2.0
            samples += 1
        return result, state
    finally:  # Runs after return or a Python exception leaves the try block.
        robot.stop()


result, final_state = run_spiral()
print(result)
print("final_pose:", final_state.pose)
