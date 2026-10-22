# Configure your physical robot from Parts 2.1 and 2.2, then tune line following below.
from sys import platform

# Physical robot measurements; Virtual XRP uses supplied geometry and motor calibration.
WHEEL_DIAMETER_MM = 60.0  # Enter the rolling wheel diameter [mm].
ENCODER_COUNTS_PER_REVOLUTION = 585.0  # Enter encoder counts for one wheel revolution.
TRACK_WIDTH_MM = 155.0  # Enter the effective separation between the drive wheels [mm].
# Starting effort compensates motor friction; its sign follows the requested wheel direction.
LEFT_START_COMMAND = 0.12  # Left effort offset for every nonzero wheel-speed request.
RIGHT_START_COMMAND = 0.13  # Right effort offset for every nonzero wheel-speed request.
LEFT_SPEED_COMMAND_GAIN = 0.0025  # Convert requested left wheel speed to motor effort [s/mm].
RIGHT_SPEED_COMMAND_GAIN = 0.0025  # Convert requested right wheel speed to motor effort [s/mm].

# Physical IR sensors: enter each sensor's white-floor value W and raw threshold T from Part 2.1.
LEFT_FLOOR_REFLECTANCE = 0.0  # Subtract this left white-floor value before calculating steering error.
RIGHT_FLOOR_REFLECTANCE = 0.0  # Subtract this right white-floor value before calculating steering error.
LEFT_LINE_VISIBLE_THRESHOLD = 0.12  # Detect tape when the raw left reading reaches this value.
RIGHT_LINE_VISIBLE_THRESHOLD = 0.12  # Detect tape when the raw right reading reaches this value.

# Steering defaults; Monitor retains live changes until Restore defaults is selected.
if platform == "rp2":
    CRUISE_SPEED_MM_S = 100.0  # Request this forward speed on a straight [mm/s].
    P_GAIN_RAD_S = 0.7  # Multiply the reflectance error by this proportional gain [rad/s].
    I_GAIN_RAD_S2 = 0.0  # Multiply accumulated error by this integral gain [rad/s^2]; begin at zero.
    D_GAIN_RAD = 0.03  # Multiply the error's rate of change by this derivative gain [rad].
else:
    CRUISE_SPEED_MM_S = 100.0
    P_GAIN_RAD_S = 1.8
    I_GAIN_RAD_S2 = 0.0
    D_GAIN_RAD = 0.025

MINIMUM_SPEED_MM_S = 45.0  # Keep at least this forward speed in turns, without exceeding cruise [mm/s].
MAXIMUM_TURN_RATE_RAD_S = 1.4  # Limit the magnitude of the requested steering rate [rad/s].
TURN_SLOWDOWN = 0.45  # Reduce cruise speed by this fraction at the maximum steering rate.
