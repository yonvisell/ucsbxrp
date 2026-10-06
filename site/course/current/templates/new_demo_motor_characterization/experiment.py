# Three motor commands; both wheels receive the same value in each interval.
EFFORTS = (0.16, 0.22, 0.28)  # Dimensionless forward motor commands applied to both wheels in order.
# Apply zero command before and after each nonzero command.
EFFORT_DURATION_S = 0.7  # Elapsed seconds holding each nonzero command.
ZERO_DURATION_S = 0.5  # Elapsed seconds at zero command before and after each effort.
# Stop if either wheel travels farther than this limit during the experiment.
MAXIMUM_WHEEL_TRAVEL_MM = 1500.0  # Maximum absolute wheel position from the starting point, in mm.
