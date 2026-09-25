# Count a lap only after passing the four marked checkpoints in order.
from math import sqrt

from challenge import CHECKPOINTS_MM, CHECKPOINT_TOLERANCE_MM

# LapProgress — Count ordered checkpoints and confirm finish-bar return.
# Called by: Line Circuit control loop.
# Methods: observe_line(), update().
# Inputs: Paired reflectance, elapsed seconds, estimated Pose, finish detection.
# State: Checkpoint index, line-loss interval, finish sample count.
# Returns: Line visibility and completed-lap status.

class LapProgress:
    def __init__(self):
        self.checkpoints_reached = 0
        self.left_start = False
        self.finish_samples = 0
        self.lost_line_s = 0.0

    def observe_line(self, readings, dt_s, visible_threshold):
        # Return True when either normalized sensor reads above the threshold.
        # Otherwise add dt_s (seconds) to retained lost_line_s.
        visible = max(readings.left, readings.right) >= visible_threshold
        self.lost_line_s = 0.0 if visible else self.lost_line_s + dt_s
        return visible

    def update(self, pose, on_finish, confirm_samples):
        # Return True after the estimated Pose visits each checkpoint in order
        # and on_finish is observed for confirm_samples after leaving the start.
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
