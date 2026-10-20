# Supplied tape-bar counter. No pose estimate or checkpoint coordinates are used.


class LapProgress:
    def __init__(self, dark_threshold, clear_threshold, confirm_time_s):
        self.dark_threshold = dark_threshold
        self.clear_threshold = clear_threshold
        self.confirm_time_s = confirm_time_s
        self.waypoints_reached = 0
        self.on_bar = False
        self.transition_time_s = 0.0
        self.lost_line_s = 0.0

    def update(self, readings, dt_s):
        # A narrow bar may appear in only one sample. Latch it immediately;
        # require a confirmed clear interval before counting another bar.
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

    def observe_line(self, readings, dt_s, visible_threshold):
        visible = max(readings.left, readings.right) >= visible_threshold
        self.lost_line_s = 0.0 if visible else self.lost_line_s + dt_s
        return visible
