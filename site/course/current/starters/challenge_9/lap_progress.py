# Ordered odometry checkpoints qualify the finish-bar detector.
from math import sqrt

# Estimated axle-midpoint positions (x, y), mm, required in this order before finishing.
CHECKPOINTS_MM = ((700.0, -200.0), (700.0, 200.0), (-700.0, 200.0), (-700.0, -200.0))
CHECKPOINT_TOLERANCE_MM = 240.0  # Accept a checkpoint within this estimated-position radius, mm.

# LapProgress — Count ordered checkpoints and confirm finish-bar return.
# Called by: Line Circuit control loop.
# Methods: update().
# Inputs: Estimated Pose, finish-bar detection, elapsed interval and confirmation time.
# State: Checkpoint index, left-start flag, finish-bar duration in seconds.
# Returns: True only after the ordered lap is complete.

class LapProgress:
    def __init__(self):
        self.checkpoints_reached = 0
        self.left_start = False
        self.finish_time_s = 0.0

    def update(self, pose, on_finish, dt_s, confirm_time_s):
        if self.checkpoints_reached < len(CHECKPOINTS_MM):
            x_mm, y_mm = CHECKPOINTS_MM[self.checkpoints_reached]
            distance_mm = sqrt((pose.x_mm - x_mm) ** 2 + (pose.y_mm - y_mm) ** 2)
            if distance_mm <= CHECKPOINT_TOLERANCE_MM:
                self.checkpoints_reached += 1
        # The first finish reading is only the starting bar; completion waits
        # for departure, ordered checkpoints, and confirmed return.
        if not on_finish:
            self.left_start = True
            self.finish_time_s = 0.0
        elif self.left_start and self.checkpoints_reached == len(CHECKPOINTS_MM):
            self.finish_time_s += dt_s
        return self.finish_time_s + 1e-9 >= confirm_time_s
