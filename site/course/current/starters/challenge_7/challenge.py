# Values for Challenge 7: Wall-Range Pose Correction.

from math import pi

from ucsb_xrp import Pose, load_world


# Load the selected world; its pose and markers set the task coordinates below.
WORLD = load_world()
PHYSICAL_INITIAL_POSE = WORLD.initial_pose
# Deliberately start the position estimate 80 mm higher in x and 60 mm lower in y.
# Wall observations correct these offsets; the initial heading estimate is unchanged.
ODOMETRY_INITIAL_POSE = Pose(
    PHYSICAL_INITIAL_POSE.x_mm + 80.0,
    PHYSICAL_INITIAL_POSE.y_mm - 60.0,
    PHYSICAL_INITIAL_POSE.heading_rad,
)
DESTINATION = WORLD.waypoint("destination")

X_WALL_MM = 900.0  # Known x coordinate of the wall used for the x-position correction, mm.
Y_WALL_MM = 500.0  # Known y coordinate of the wall used for the y-position correction, mm.
X_WALL_IS_POSITIVE = True  # The x wall lies in the robot's positive-x scan direction.
Y_WALL_IS_POSITIVE = True  # The y wall lies in the robot's positive-y scan direction.
SENSOR_FORWARD_OFFSET_MM = 70.0  # Ultrasound sensor distance ahead of the drive-axle midpoint, mm.
X_SCAN_HEADING_RAD = 0.0  # Face positive x for the first stationary wall observation, rad.
Y_SCAN_HEADING_RAD = pi / 2.0  # Face positive y for the second stationary wall observation, rad.
WALL_OBSERVATION_HEADING_TOLERANCE_RAD = 0.10  # Reject a wall observation outside this absolute heading error, rad.

RANGE_SAMPLE_COUNT = 7  # Distinct ultrasound attempts collected at each stationary scan heading.
MINIMUM_USABLE_RANGE_COUNT = 4  # Positive finite readings required for each wall range estimate.
STOPPED_SPEED_MM_S = 5.0  # Both absolute measured wheel speeds must be at or below this value, mm/s.
