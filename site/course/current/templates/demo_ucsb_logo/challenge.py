# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import live, load_world

WORLD = load_world()  # initial_pose and geometry come from world.json.
# ProjectWorld.waypoints() returns NavigationGoal values in marker-file order.
ROUTE = WORLD.waypoints()
