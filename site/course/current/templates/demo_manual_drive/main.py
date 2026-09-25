# Drive with Monitor sliders. Each Run starts with both commands at zero.

from course_setup import make_robot
from live_variables import FORWARD_SPEED, TURN_RATE
from robot_config import ROBOT_CONFIG
from ucsb_xrp import MotionCommand, STOP_COMMAND, load_world


WORLD = load_world()
# Construct the robot from this project's configured components.
robot = make_robot(ROBOT_CONFIG)
try:
    # Start establishes the initial pose and encoder/time measurement origins.
    state = robot.start(WORLD.initial_pose)
    state = robot.step(STOP_COMMAND)
    print("Manual driving ready. Set Forward speed or Turn rate in Monitor.")

    # Apply the latest manual speed and turn controls at each robot sample.
    while True:  # Press Stop in the IDE to end the supervised drive.
        speed_mm_s = FORWARD_SPEED.value
        turn_rate_rad_s = TURN_RATE.value
        # Decimal slider steps can decode zero as a tiny nonzero float. Avoid
        # applying the wheel controller's start effort to that rounding error.
        if abs(speed_mm_s) < 0.5:
            speed_mm_s = 0.0
        if abs(turn_rate_rad_s) < 0.005:
            turn_rate_rad_s = 0.0
        state = robot.step(MotionCommand(speed_mm_s, turn_rate_rad_s))
finally:
    robot.stop()
