# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import live, load_world

WORLD = load_world()  # Match the arena and initial pose in the selected world.
# ProjectWorld.waypoints() returns NavigationGoal values in marker-file order.
ROUTE = WORLD.waypoints()
