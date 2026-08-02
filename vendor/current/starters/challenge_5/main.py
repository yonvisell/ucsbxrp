"""Challenge 5: observe the gate, plan, and complete the delivery."""

from challenge import DELIVERY_TASK
from course_setup import make_grid_planner, make_navigation_controller, make_robot
from robot_config import NAVIGATION_CONFIG, ROBOT_CONFIG
from ucsb_xrp import DeliveryMission


mission = DeliveryMission(
    DELIVERY_TASK,
    make_navigation_controller(NAVIGATION_CONFIG),
    make_grid_planner(),
)
state = mission.run(make_robot(ROBOT_CONFIG))
print("Challenge 5 result:", mission.result)
print("final_pose:", state.pose)
