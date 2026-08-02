"""World-coordinate route for Challenge 3: Waypoint Courier."""

from math import pi

from ucsb_xrp import NavigationGoal, Pose


INITIAL_POSE = Pose(0.0, 0.0, 0.0)
ROUTE = (
    NavigationGoal(400.0, 0.0),
    NavigationGoal(400.0, 300.0),
    NavigationGoal(0.0, 300.0, pi),
)
