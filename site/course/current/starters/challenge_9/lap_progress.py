# Ordered odometry checkpoints qualify the finish-bar detector.
from math import sqrt

CHECKPOINTS_MM = ((700.0, -200.0), (700.0, 200.0), (-700.0, 200.0), (-700.0, -200.0))
CHECKPOINT_TOLERANCE_MM = 240.0

# LapProgress — Count ordered checkpoints and confirm finish-bar return.
# Called by: Line Circuit control loop.
# Methods: update().
# Inputs: Estimated Pose, finish-bar detection, confirmation samples.
# State: Checkpoint index, left-start flag, finish sample count.
# Returns: True only after the ordered lap is complete.

class LapProgress:
    def __init__(self):
        self.checkpoints_reached = 0
        self.left_start = False
        self.finish_samples = 0

    def update(self, pose, on_finish, confirm_samples):
        if self.checkpoints_reached < len(CHECKPOINTS_MM):
            x_mm, y_mm = CHECKPOINTS_MM[self.checkpoints_reached]
            distance_mm = sqrt((pose.x_mm - x_mm) ** 2 + (pose.y_mm - y_mm) ** 2)
            if distance_mm <= CHECKPOINT_TOLERANCE_MM:
                self.checkpoints_reached += 1
        if not on_finish:
            self.left_start = True
            self.finish_samples = 0
        elif self.left_start and self.checkpoints_reached == len(CHECKPOINTS_MM):
            self.finish_samples += 1
        return self.finish_samples >= confirm_samples
