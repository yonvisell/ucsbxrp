# Supplied waypoint counting and stop conditions; no changes required.
from robot_setup import MAXIMUM_LOST_LINE_S
from supplied_settings import (
    WAYPOINT_DARK_THRESHOLD, WAYPOINT_CLEAR_THRESHOLD,
    WAYPOINT_CONFIRM_TIME_S, WAYPOINT_TARGET, calibrated_reflectance, line_is_visible,
)
from ucsb_xrp import STOP_COMMAND


class LapProgress:
    # Count each tape bar once, using both reflectance sensors.
    def __init__(self, dark_threshold, clear_threshold, confirm_time_s):
        self.dark_threshold = dark_threshold
        self.clear_threshold = clear_threshold
        self.confirm_time_s = confirm_time_s
        self.waypoints_reached = 0
        self.on_bar = False
        self.transition_time_s = 0.0

    def update(self, readings, dt_s):
        # Count as soon as both sensors read dark. Wait for the bar to clear
        # before allowing another count.
        darkness = min(readings.left, readings.right)
        if not self.on_bar:
            if darkness >= self.dark_threshold:
                self.on_bar = True
                self.waypoints_reached += 1
        elif darkness < self.clear_threshold:
            self.transition_time_s += dt_s
            if self.transition_time_s + 1e-9 >= self.confirm_time_s:
                self.on_bar = False
                self.transition_time_s = 0.0
        else:
            self.transition_time_s = 0.0
        return self.waypoints_reached


class LineCircuit:
    # Combine waypoint counting, line following and the selected stop conditions.
    def __init__(self, follower, stop_on_line_loss=True):
        self.follower = follower
        self.stop_on_line_loss = stop_on_line_loss
        self.progress = LapProgress(
            WAYPOINT_DARK_THRESHOLD, WAYPOINT_CLEAR_THRESHOLD, WAYPOINT_CONFIRM_TIME_S,
        )
        self.lost_line_s = 0.0
        self.result = None

    @property
    def waypoints_reached(self):
        return self.progress.waypoints_reached

    @property
    def phase(self):
        if self.result is not None:
            return self.result
        if self.stop_on_line_loss and self.lost_line_s:
            return "line_lost_stopping"
        return "following"

    @property
    def should_publish(self):
        # Stop adding plot values after a sensor or line-loss failure.
        return self.result not in ("reflectance_unavailable", "line_lost")

    def update(self, readings, dt_s):
        if self.result is not None:
            return STOP_COMMAND
        if readings is None:
            self.result = "reflectance_unavailable"
            return STOP_COMMAND
        # Count bars from raw readings; stop at the finish before steering again.
        if self.progress.update(readings, dt_s) >= WAYPOINT_TARGET:
            self.result = "complete"
            return STOP_COMMAND

        calibrated = calibrated_reflectance(readings)
        visible = line_is_visible(readings)
        self.lost_line_s = 0.0 if visible else self.lost_line_s + dt_s
        if self.stop_on_line_loss and not visible:
            if self.lost_line_s >= MAXIMUM_LOST_LINE_S:
                self.result = "line_lost"
            return STOP_COMMAND

        # Calculate the next motion command from calibrated reflectance.
        return self.follower.update(calibrated, dt_s)
