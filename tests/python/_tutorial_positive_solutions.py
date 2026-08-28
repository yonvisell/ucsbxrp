# Complete implementations used only to test the tutorial checkers and runners.
# These modules are deliberately outside vendor/current, so student projects
# contain exercises rather than solutions.

from types import ModuleType, SimpleNamespace


def tutorial_one_solution():
    module = ModuleType("student_work")

    def average_speed_mm_s(distance_mm, duration_s):
        if distance_mm < 0.0 or duration_s <= 0.0:
            raise ValueError("distance and duration must be positive")
        return distance_mm / duration_s

    def route_distance_mm(segment_distances_mm):
        total_mm = 0.0
        for distance_mm in segment_distances_mm:
            if distance_mm < 0.0:
                raise ValueError("route distances cannot be negative")
            total_mm += distance_mm
        return total_mm

    def range_state(range_mm, stop_distance_mm):
        if stop_distance_mm <= 0.0:
            raise ValueError("stop distance must be positive")
        if range_mm is None:
            return "unavailable"
        if range_mm <= stop_distance_mm:
            return "stop"
        return "clear"

    def wheel_speed_summary(left_samples_mm_s, right_samples_mm_s):
        if not left_samples_mm_s or len(left_samples_mm_s) != len(
            right_samples_mm_s
        ):
            raise ValueError("paired samples must be nonempty and equal in length")
        count = len(left_samples_mm_s)
        left_total = 0.0
        right_total = 0.0
        for index in range(count):
            left_total += left_samples_mm_s[index]
            right_total += right_samples_mm_s[index]
        left_mean = left_total / count
        right_mean = right_total / count
        return {
            "sample_count": count,
            "mean_left_mm_s": left_mean,
            "mean_right_mm_s": right_mean,
            "mean_difference_mm_s": left_mean - right_mean,
        }

    def parse_stop_distance_mm(text_value, fallback_mm):
        try:
            distance_mm = float(text_value)
        except (TypeError, ValueError):
            return fallback_mm
        if distance_mm <= 0.0:
            return fallback_mm
        return distance_mm

    module.average_speed_mm_s = average_speed_mm_s
    module.route_distance_mm = route_distance_mm
    module.range_state = range_state
    module.wheel_speed_summary = wheel_speed_summary
    module.parse_stop_distance_mm = parse_stop_distance_mm
    return module


def tutorial_two_solution():
    from ucsb_xrp import MotionCommand

    module = ModuleType("student_work")

    class DrawingSegment:
        def __init__(self, name, forward_speed_mm_s, turn_rate_rad_s, steps):
            if not name:
                raise ValueError("name must not be empty")
            if not isinstance(steps, int) or isinstance(steps, bool) or steps <= 0:
                raise ValueError("steps must be a positive integer")
            if forward_speed_mm_s == 0.0 and turn_rate_rad_s == 0.0:
                raise ValueError("segment command must not be stationary")
            self.name = name
            self.forward_speed_mm_s = forward_speed_mm_s
            self.turn_rate_rad_s = turn_rate_rad_s
            self.steps = steps

        def command(self):
            return MotionCommand(self.forward_speed_mm_s, self.turn_rate_rad_s)

    class TurnSegment(DrawingSegment):
        def __init__(self, name, turn_rate_rad_s, steps):
            if turn_rate_rad_s <= 0.0:
                raise ValueError("turn rate must be positive")
            super().__init__(name, 0.0, turn_rate_rad_s, steps)

    def build_drawing(
        side_speed_mm_s,
        side_steps,
        turn_rate_rad_s,
        turn_steps,
    ):
        if 4 * (side_steps + turn_steps) > 500:
            raise ValueError("drawing may contain at most 500 samples")
        segments = []
        for index in range(4):
            segments.append(
                DrawingSegment(
                    "side {}".format(index + 1),
                    side_speed_mm_s,
                    0.0,
                    side_steps,
                )
            )
            segments.append(
                TurnSegment(
                    "corner {}".format(index + 1),
                    turn_rate_rad_s,
                    turn_steps,
                )
            )
        return segments

    module.DrawingSegment = DrawingSegment
    module.TurnSegment = TurnSegment
    module.build_drawing = build_drawing
    return module


def tutorial_three_solution():
    from ucsb_xrp import MotionCommand, Pose

    module = ModuleType("student_work")

    def run_robot_program(robot):
        try:
            state = robot.start(Pose(0.0, 0.0, 0.0))
            for _ in range(30):
                state = robot.step(MotionCommand(80.0, 0.0))
            return state
        finally:
            robot.stop()

    module.run_robot_program = run_robot_program
    return module


def tutorial_four_solution():
    from ucsb_xrp import MotionCommand

    module = ModuleType("student_work")
    module.APPROACH = "approach"
    module.TURN = "turn"
    module.DONE = "done"
    module.FORWARD_SPEED = SimpleNamespace(value=110.0)
    module.STOP_DISTANCE = SimpleNamespace(value=260.0)
    module.TURN_RATE = SimpleNamespace(value=0.8)
    module.TURN_DIRECTION = SimpleNamespace(value="left")
    module.RUN_BEHAVIOR = SimpleNamespace(value=True)
    module.live = SimpleNamespace(watch=lambda *args, **kwargs: None, plot=lambda *args, **kwargs: None)

    def next_phase(phase, range_mm, stop_distance_mm, turn_complete):
        if phase not in (module.APPROACH, module.TURN, module.DONE):
            raise ValueError("unknown phase")
        if stop_distance_mm <= 0.0:
            raise ValueError("stop distance must be positive")
        if phase == module.APPROACH:
            if range_mm is not None and range_mm <= stop_distance_mm:
                return module.TURN
            return module.APPROACH
        if phase == module.TURN and turn_complete:
            return module.DONE
        return phase

    def command_for_phase(
        phase,
        forward_speed_mm_s,
        turn_rate_rad_s,
        turn_direction,
    ):
        if phase not in (module.APPROACH, module.TURN, module.DONE):
            raise ValueError("unknown phase")
        if forward_speed_mm_s <= 0.0:
            raise ValueError("forward speed must be positive")
        if turn_rate_rad_s <= 0.0:
            raise ValueError("turn rate must be positive")
        if turn_direction not in ("left", "right"):
            raise ValueError("turn direction must be left or right")
        if phase == module.APPROACH:
            return MotionCommand(forward_speed_mm_s, 0.0)
        if phase == module.TURN:
            direction = 1.0 if turn_direction == "left" else -1.0
            return MotionCommand(0.0, direction * turn_rate_rad_s)
        return MotionCommand(0.0, 0.0)

    def publish_telemetry(state, phase):
        range_value = state.measurements.range_mm
        if range_value is None:
            range_value = "unavailable"
        module.live.watch("phase", phase)
        module.live.watch("range_mm", range_value, unit="mm")
        mean_distance_mm = (
            state.measurements.left_position_mm
            + state.measurements.right_position_mm
        ) / 2.0
        module.live.plot("wheel_distance_mm", mean_distance_mm, unit="mm")
        module.live.plot("heading_rad", state.pose.heading_rad, unit="rad")

    module.next_phase = next_phase
    module.command_for_phase = command_for_phase
    module.publish_telemetry = publish_telemetry
    return module


def tutorial_five_solution():
    module = ModuleType("student_work")

    def preflight_report(states):
        if not states:
            raise ValueError("states must not be empty")
        elapsed_time_s = 0.0
        maximum_abs_wheel_position_mm = 0.0
        usable_range_count = 0
        nearest_range_mm = None
        button_was_pressed = False
        for state in states:
            measurements = state.measurements
            elapsed_time_s += measurements.dt_s
            maximum_abs_wheel_position_mm = max(
                maximum_abs_wheel_position_mm,
                abs(measurements.left_position_mm),
                abs(measurements.right_position_mm),
            )
            if measurements.range_mm is not None:
                usable_range_count += 1
                if (
                    nearest_range_mm is None
                    or measurements.range_mm < nearest_range_mm
                ):
                    nearest_range_mm = measurements.range_mm
            button_was_pressed = button_was_pressed or measurements.button_pressed
        return {
            "sample_count": len(states),
            "elapsed_time_s": elapsed_time_s,
            "maximum_abs_wheel_position_mm": maximum_abs_wheel_position_mm,
            "usable_range_count": usable_range_count,
            "nearest_range_mm": nearest_range_mm,
            "button_was_pressed": button_was_pressed,
        }

    module.preflight_report = preflight_report
    return module
