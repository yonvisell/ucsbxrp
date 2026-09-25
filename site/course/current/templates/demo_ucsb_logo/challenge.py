# Experiment settings. Edit world.json for the arena and starting pose.

from ucsb_xrp import live, load_world

# Read selected-world markers and geometry from the same source as the simulator.
WORLD = load_world()  # initial_pose and geometry come from world.json.
# ProjectWorld.waypoints() returns NavigationGoal values in marker-file order.
ROUTE = WORLD.waypoints()
