# Robot Curling geometry: travel distance d comes from the selected world.

from ucsb_xrp import distance_to_goal, load_world


WORLD = load_world()  # Load the world selected in Monitor.
INITIAL_POSE = WORLD.initial_pose  # Drive-axle midpoint (mm) and heading (rad).
FINISH = WORLD.waypoint("finish")  # Named target location in world millimeters.
TRAVEL_DISTANCE_MM = distance_to_goal(INITIAL_POSE, FINISH)  # sqrt(delta_x**2 + delta_y**2), in mm.

# Confirm the final stop from wheel speeds; these values do not choose when to brake.
STATIONARY_SPEED_MM_S = 5.0  # Both absolute wheel speeds must be at or below this value.
STATIONARY_DURATION_S = 0.3  # Consecutive measured seconds below the speed threshold.
MAXIMUM_RUN_TIME_S = 120.0  # End this challenge trial two minutes after robot.start().
if TRAVEL_DISTANCE_MM <= 0.0:
    raise ValueError("The finish marker must be separated from the initial pose")
