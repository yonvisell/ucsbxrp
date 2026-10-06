from math import sqrt

from challenge import CHECKPOINTS_MM, CHECKPOINT_TOLERANCE_MM

# LapProgress — Count ordered checkpoints and confirm finish-bar return.
# Called by: Line Circuit control loop.
# Methods: observe_line(), update().
# Inputs: Paired reflectance, elapsed seconds, estimated Pose, finish detection.
# State: Checkpoint index, line-loss interval, finish-bar duration in seconds.
# Returns: Line visibility and completed-lap status.

class LapProgress:
    def __init__(self):
        self.checkpoints_reached = 0
        self.left_start = False  # Records whether an off-bar sample has occurred.
        self.finish_time_s = 0.0  # Continuous time on the finish bar after all checkpoints.
        self.lost_line_s = 0.0

    def observe_line(self, readings, dt_s, visible_threshold):
        visible = max(readings.left, readings.right) >= visible_threshold  # Either sensor detects the line.
        self.lost_line_s = 0.0 if visible else self.lost_line_s + dt_s  # Accumulate only consecutive missing-line samples.
        return visible

    def update(self, pose, on_finish, dt_s, confirm_time_s):
        if self.checkpoints_reached < len(CHECKPOINTS_MM):
            x_mm, y_mm = CHECKPOINTS_MM[self.checkpoints_reached]  # Next checkpoint in circuit order.
            distance_mm = sqrt((pose.x_mm - x_mm) ** 2 + (pose.y_mm - y_mm) ** 2)
            if distance_mm <= CHECKPOINT_TOLERANCE_MM:
                self.checkpoints_reached += 1
        if not on_finish:
            self.left_start = True
            self.finish_time_s = 0.0  # Restart confirmation time when off the bar.
        elif self.left_start and self.checkpoints_reached == len(CHECKPOINTS_MM):  # Count the finish only after an off-bar sample and all checkpoints.
            self.finish_time_s += dt_s  # Use actual elapsed seconds, so confirmation does not change with sample rate.
        return self.finish_time_s + 1e-9 >= confirm_time_s
