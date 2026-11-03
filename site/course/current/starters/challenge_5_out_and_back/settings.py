# Reuse the same physical robot's measured calibration from Challenge 2.
# Virtual XRP keeps its supplied geometry and motor model in supplied_settings.py.
WHEEL_DIAMETER_MM = 60.0  # Rolling wheel diameter [mm].
ENCODER_COUNTS_PER_REVOLUTION = 585.0  # Encoder counts per wheel revolution.
TRACK_WIDTH_MM = 155.0  # Effective driven-wheel separation [mm].
LEFT_START_COMMAND = 0.12  # Left motor effort offset for nonzero wheel targets.
RIGHT_START_COMMAND = 0.13  # Right motor effort offset for nonzero wheel targets.
LEFT_SPEED_COMMAND_GAIN = 0.0031  # Left motor effort per requested speed [s/mm].
RIGHT_SPEED_COMMAND_GAIN = 0.0031  # Right motor effort per requested speed [s/mm].

# Navigation defaults; Monitor retains live changes until Restore defaults.
CRUISE_SPEED_MM_S = 150.0  # Forward speed outside the slowdown distance [mm/s].
TURN_RATE_RAD_S = 0.8  # Maximum turn-rate magnitude [rad/s].
APPROACH_SPEED_RATIO = 0.8  # Fraction of cruise speed used near a goal.
SLOWDOWN_DISTANCE_MM = 100.0  # Switch to approach speed within this distance [mm].
POSITION_TOLERANCE_MM = 12.0  # Accept a goal position within this radius [mm].
HEADING_TOLERANCE_RAD = 0.08  # Accept alignment within this heading error [rad].
REALIGN_HEADING_RAD = 0.25  # Pause driving to turn above this heading error [rad].

# Camera-based GPS supplies world position and heading for navigation.
USE_GPS = True
VIRTUAL_GPS_RATE_HZ = 2.0  # GPS fixes per simulated second; the physical Pi sets its own rate.
GPS_POSITION_DRIFT_MM = 3.0  # Maximum simulated GPS position bias [mm].
GPS_HEADING_DRIFT_RAD = 0.005  # Maximum simulated GPS heading bias [rad].
DRIVING_DRIFT_PERCENT = 1.0  # Difference in left/right ground travel relative to encoder travel [%].
