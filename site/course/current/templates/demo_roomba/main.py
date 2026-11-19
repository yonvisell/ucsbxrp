# Run Roomba avoidance in the selected room until Stop is pressed.

from avoidance import run_avoidance
from challenge import WORLD
from robot_setup import ROBOT_CONFIG, make_robot


run_avoidance(make_robot(ROBOT_CONFIG), WORLD.initial_pose)
