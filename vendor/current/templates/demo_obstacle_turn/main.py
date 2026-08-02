# Drive to an obstacle, turn left, then drive to the next obstacle.

from math import pi, sqrt

from course_setup import make_robot
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, Pose, live, wrap_angle_rad


CLOSE_RANGE_MM = live.number(
    "close_range_mm",
    180.0,
    minimum=100.0,
    maximum=350.0,
    step=10.0,
    unit="mm",
    label="Obstacle distance",
)
FORWARD_SPEED_MM_S = live.number(
    "forward_speed_mm_s",
    120.0,
    minimum=60.0,
    maximum=220.0,
    step=10.0,
    unit="mm/s",
    label="Forward speed",
)
TURN_RATE_RAD_S = live.number(
    "turn_rate_rad_s",
    0.75,
    minimum=0.25,
    maximum=1.25,
    step=0.05,
    unit="rad/s",
    label="Turn rate",
)
TURN_DIRECTION = live.choice(
    "turn_direction",
    "left",
    options=("left", "right"),
    label="Turn direction",
)
SECOND_APPROACH = live.toggle(
    "second_approach",
    True,
    label="Drive after turn",
)
TURN_TOLERANCE_RAD = 0.06
MAX_FORWARD_TRAVEL_MM = 1100.0
MAX_TURN_STEPS = 300

robot = make_robot(ROBOT_CONFIG)
state = None


def drive_until_close():
    global state
    start_pose = state.pose
    range_samples = []
    live.watch("phase", "driving")
    while True:
        state = robot.step(
            MotionCommand(FORWARD_SPEED_MM_S.value, 0.0),
            read_range=True,
        )
        range_samples.append(state.measurements.range_mm)
        range_samples = range_samples[-5:]
        range_mm = robot.estimate_range(range_samples, minimum_usable=3)
        live.watch("range_mm", range_mm if range_mm is not None else "—", unit="mm")
        if range_mm is not None and range_mm <= CLOSE_RANGE_MM.value:
            return

        dx_mm = state.pose.x_mm - start_pose.x_mm
        dy_mm = state.pose.y_mm - start_pose.y_mm
        travel_mm = sqrt(dx_mm * dx_mm + dy_mm * dy_mm)
        live.watch("travel_mm", travel_mm, unit="mm")
        if travel_mm >= MAX_FORWARD_TRAVEL_MM:
            raise RuntimeError("No obstacle detected within the demo distance")


def turn_quarter_turn():
    global state
    direction = 1.0 if TURN_DIRECTION.value == "left" else -1.0
    target_heading = wrap_angle_rad(state.pose.heading_rad + direction * pi / 2.0)
    live.watch("phase", "turning " + TURN_DIRECTION.value)
    for _ in range(MAX_TURN_STEPS):
        error = wrap_angle_rad(target_heading - state.pose.heading_rad)
        live.watch("heading_error_rad", error, unit="rad")
        if abs(error) <= TURN_TOLERANCE_RAD:
            return
        state = robot.step(MotionCommand(0.0, direction * TURN_RATE_RAD_S.value))
    raise RuntimeError("The XRP did not complete the quarter turn")


try:
    print("Press and release USER to start the obstacle-turn demo")
    state = robot.start(Pose(0.0, 0.0, 0.0))
    drive_until_close()
    turn_quarter_turn()
    if SECOND_APPROACH.value:
        drive_until_close()
    live.watch("phase", "complete")
    print("Obstacle-turn demo complete")
    print("final_pose:", state.pose)
finally:
    robot.stop()
