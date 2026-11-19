# Settings for Exercise · Reactive Driving and Mapping. Distances are in millimeters.

from ucsb_xrp import RobotConfig, live


# Occupancy grid and ultrasound. The lateral uncertainty grows with echo range.
CELL_MM = 50                 # Width of a square map cell.
SENSOR_OFFSET_MM = 70        # Axle midpoint to the forward transducer.
MIN_RANGE_MM = 20            # Shortest return accepted for mapping.
MAP_RANGE_MM = 750           # Limit for projecting a hit or tracing observed-free cells.
BEAM_HALF_ANGLE_DEG = 7.5    # Nominal ultrasound cone half-angle.
WALL_TOLERANCE_MM = 5        # Perpendicular tolerance between the echo arc and a known wall.
CLEAR_PASSES = 3             # Fresh crossings needed to overturn a previous endpoint.
TURN_RADIUS_MM = 136         # Radius enclosing the 192.5 by 190.5 mm chassis.
RESPONSE_TIME_S = 0.40       # Predict travel during sensing, control and motor response.

# Live controls. Change the initial value, lower and upper limits, and slider step here.
OBSTACLE_DISTANCE_MM = live.number(
    "obstacle_distance_mm", 200, minimum=0, maximum=4000, step=1,
    unit="mm", label="Obstacle reaction distance",
)
FORWARD_SPEED_MM_S = live.number(
    "roomba_forward_speed_mm_s", 150, minimum=1, maximum=1000, step=1,
    unit="mm/s", label="Forward speed",
)
REVERSE_SPEED_MM_S = live.number(
    "roomba_reverse_speed_mm_s", -120, minimum=-1000, maximum=-1, step=1,
    unit="mm/s", label="Reverse speed",
)
STEERING_RATE_RAD_S = live.number(
    "roomba_steering_rate_rad_s", 1.4, minimum=0.05, maximum=8.0, step=0.05,
    unit="rad/s", label="Steering rate",
)

# Maneuver timing and steering.
RUN_LIMIT_S = 300            # Choose a run duration up to five minutes.
REVERSE_TIME_S = 0.4         # Normal retreat before choosing another heading.
MAX_REVERSE_TIME_S = 1.5     # Extend a clear retreat if the chassis still lacks room to turn.
SCAN_SPACING_MM = 250        # Forward displacement between looks to either side.
SCAN_HALF_ANGLE_DEG = 35     # Scan this far to either side of the current heading.
SCAN_RADIUS_MM = 50          # Radius of each forward sensing arc when travel is clear.
TURN_GAIN_PER_S = 3.0        # Yaw rate per radian of remaining heading error.
TURN_TOLERANCE_RAD = 0.06
TURN_STALL_TIME_S = 20       # Stop if the heading stops approaching its target.
RANDOM_SEED = 17             # Repeat a turn sequence with the same measurements.
TURN_ANGLES_DEG = (40, 65, 90, 115, 140, 165)  # Changes of heading on each side, smallest first.
TURN_VARIATION_DEG = 12         # Extra angle in degrees, drawn once per maneuver.
TURN_LOOKAHEAD_MM = (600, 500, 400, 300, 200, 100)  # Test longest straight advance first.

# Chassis geometry, wheel calibration and drive limits. Signs are +1 or -1.
ROBOT_CONFIG = RobotConfig(
    sample_period_ms=40,
    wheel_diameter_mm=60.0,
    encoder_counts_per_revolution=585.0,
    track_width_mm=155.0,
    left_motor_sign=1, right_motor_sign=1,
    left_encoder_sign=1, right_encoder_sign=1,
    left_start_command=0.13, right_start_command=0.13,
    left_speed_command_gain=0.0031, right_speed_command_gain=0.0031,  # s/mm
    wheel_speed_filter_time_constant_ms=80.0,
    wheel_speed_kp=0.001, wheel_speed_ki=0.0, wheel_speed_kd=0.0,
    max_drive_command=0.65,  # Largest absolute motor effort, including at high speed requests.
)

# Check values used to compare distances or bound a maneuver before enabling the motors.
if not 0 < RUN_LIMIT_S <= 300:
    raise ValueError("Set RUN_LIMIT_S above zero and at most 300 seconds.")
if not 0 < MIN_RANGE_MM < MAP_RANGE_MM or SENSOR_OFFSET_MM < 0:
    raise ValueError("Check the sensor offset and the minimum and maximum mapping ranges.")
if not 0 <= BEAM_HALF_ANGLE_DEG < 90 or WALL_TOLERANCE_MM < 0:
    raise ValueError("Set the cone half-angle from 0 to under 90 degrees and the wall tolerance to zero or more.")
if type(CLEAR_PASSES) is not int or not 1 <= CLEAR_PASSES <= 255:
    raise ValueError("Set CLEAR_PASSES to a whole number from 1 to 255.")
if not (TURN_RADIUS_MM > 0 and RESPONSE_TIME_S > 0 and 0 <= REVERSE_TIME_S <= MAX_REVERSE_TIME_S):
    raise ValueError("Check the chassis radius, response time and reverse durations.")
if not (SCAN_SPACING_MM > 0 and SCAN_RADIUS_MM > 0 and 0 < SCAN_HALF_ANGLE_DEG < 90):
    raise ValueError("Set positive scan spacing and radius, and a scan half-angle between 0 and 90 degrees.")
if not (TURN_GAIN_PER_S > 0 and TURN_TOLERANCE_RAD > 0 and TURN_STALL_TIME_S > 0):
    raise ValueError("Turn gain, tolerance and stall time must be positive.")
if not TURN_ANGLES_DEG or not 0 <= TURN_VARIATION_DEG < 180 or not all(
    0 < angle <= 180 - TURN_VARIATION_DEG for angle in TURN_ANGLES_DEG
):
    raise ValueError("Each turn angle plus its variation must lie between 0 and 180 degrees.")
if not TURN_LOOKAHEAD_MM or not all(distance > 0 for distance in TURN_LOOKAHEAD_MM):
    raise ValueError("Set one or more positive turn look-ahead distances in mm.")
