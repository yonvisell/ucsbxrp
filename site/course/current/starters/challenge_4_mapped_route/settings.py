# Reuse the same physical robot's measured calibration from Challenge 2.
# Virtual XRP keeps its supplied geometry and motor model in supplied_settings.py.
WHEEL_DIAMETER_MM = 60.0  # Rolling wheel diameter [mm].
ENCODER_COUNTS_PER_REVOLUTION = 585.0  # Encoder counts per wheel revolution.
TRACK_WIDTH_MM = 155.0  # Effective driven-wheel separation [mm].
LEFT_START_COMMAND = 0.13  # Left motor effort offset for nonzero wheel targets.
RIGHT_START_COMMAND = 0.13  # Right motor effort offset for nonzero wheel targets.
LEFT_SPEED_COMMAND_GAIN = 0.0031  # Left motor effort per requested speed [s/mm].
RIGHT_SPEED_COMMAND_GAIN = 0.0031  # Right motor effort per requested speed [s/mm].

# Navigation defaults; Monitor retains live changes until Restore defaults.
CRUISE_SPEED_MM_S = 150.0  # Forward driving speed [mm/s].
TURN_RATE_RAD_S = 0.8  # Maximum turn-rate magnitude [rad/s].
APPROACH_SPEED_RATIO = 0.8  # Optional approach-speed fraction of cruise speed.
SLOWDOWN_DISTANCE_MM = 100.0  # Distance [mm] for optional approach slowdown.
POSITION_TOLERANCE_MM = 12.0  # Accept a goal position within this radius [mm].
HEADING_TOLERANCE_RAD = 0.08  # Accept alignment within this heading error [rad].

USE_GPS = True  # Use camera based gps on either target

# Virtual XRP only
VIRTUAL_GPS_RATE_HZ = 1.0  # Camera based gps updates per second
GPS_POSITION_DRIFT_MM = 3.0  # Maximum position bias [mm]
GPS_HEADING_DRIFT_RAD = 0.005  # Maximum heading bias [rad]
DRIVING_BIAS = 1.0  # Fixed difference in left/right ground travel [%]
DRIVING_DRIFT = 1.0  # Scale of noise-like disturbance affecting driving [%]
