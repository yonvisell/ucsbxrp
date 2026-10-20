from ucsb_xrp import load_world


CIRCLE_DIAMETER_MM = 406.4  # One third of the course arena's 1219.2 mm shorter dimension.
FORWARD_SPEED_MM_S = 100.0  # Axle midpoint speed, mm/s; positive turns left (counterclockwise).
INITIAL_POSE = load_world().initial_pose
