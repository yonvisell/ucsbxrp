# Drive and scan with forward ultrasound. Back up and turn when the path is blocked.

from math import pi

from settings import (
    FORWARD_SPEED_MM_S, OBSTACLE_DISTANCE_MM,
    MAX_REVERSE_TIME_S, RANDOM_SEED, REVERSE_SPEED_MM_S, REVERSE_TIME_S,
    SCAN_HALF_ANGLE_DEG, SCAN_RADIUS_MM, SCAN_SPACING_MM, STEERING_RATE_RAD_S,
    TURN_ANGLES_DEG, TURN_GAIN_PER_S, TURN_STALL_TIME_S, TURN_TOLERANCE_RAD,
    TURN_VARIATION_DEG, TURN_LOOKAHEAD_MM,
)
from ucsb_xrp import MotionCommand, Pose, STOP_COMMAND, elapsed_time_s, live, wrap_angle_rad


_RANGE = live.register_watch("range_mm", label="Ultrasound range (mm)")
_PHASE = live.register_watch("phase", label="Driving state")
_TURNS = live.register_watch("avoidances", label="Avoidance turns")


class Avoidance:
    # One update per robot sample, using range, estimated pose and the measured map.

    def __init__(self, state):
        # Start the first approach at the sampled time and heading.
        self.random_state = int(RANDOM_SEED)
        self.phase = "forward"
        self.phase_started_ms = state.measurements.time_ms
        self.target_heading_rad = state.pose.heading_rad
        self.progress_error_rad = 0
        self.turn_count = 0
        self.forward_start = state.pose
        self.scan_headings = []

    def random_fraction(self):
        # A reproducible draw between zero and one.
        self.random_state = (1664525 * self.random_state + 1013904223) & 0xFFFFFFFF
        return self.random_state / 4294967296.0

    def choose_heading(self, pose, grid):
        # Prefer the longest forward segment permitted by known walls and occupied cells.
        # Equal-length alternatives favor the smaller turn. The seed breaks left/right ties.
        first_side = 1 if self.random_fraction() < 0.5 else -1
        variation = TURN_VARIATION_DEG * self.random_fraction()
        candidates = []
        for angle in TURN_ANGLES_DEG:
            for side in (first_side, -first_side):
                heading = pose.heading_rad + side * (angle + variation) * pi / 180
                candidates.append(Pose(pose.x_mm, pose.y_mm, heading))
        for travel in TURN_LOOKAHEAD_MM:
            for candidate in candidates:
                if grid.blockage_along(candidate, travel) is None:
                    return candidate.heading_rad
        # A turn can still reveal a shorter opening. Forward travel is checked each sample.
        return candidates[0].heading_rad

    def forward_is_clear(self, pose, reading, speed, grid):
        # Check the current echo first. A longer reading still leaves the sides
        # of the chassis to check against known walls and occupied cells.
        threshold = OBSTACLE_DISTANCE_MM.value
        if reading is not None and reading <= threshold:
            print("Forward travel blocked by an echo at {:.1f} mm (obstacle reaction distance {:.0f} mm).".format(
                reading, threshold))
            return False
        feature = grid.blocking_feature(pose, speed)
        if feature is None:
            return True
        obstacle = "a mapped surface" if isinstance(feature, tuple) else "the " + feature
        current_range = "No echo." if reading is None else "Current range {:.1f} mm.".format(reading)
        print("Forward travel blocked by {}. {}".format(obstacle, current_range))
        return False

    def aim(self, pose, heading, now):
        # Save the next target heading and the error at the start of this turn.
        self.target_heading_rad = heading
        self.progress_error_rad = abs(wrap_angle_rad(heading - pose.heading_rad))
        self.phase_started_ms = now

    def command(self, state, grid):
        # Use the current phase and one sensor/odometry sample to request the next motion.
        pose, now = state.pose, state.measurements.time_ms
        reading = state.measurements.range_mm
        _RANGE.value = reading if reading is not None else "No echo"
        forward, reverse = FORWARD_SPEED_MM_S.value, REVERSE_SPEED_MM_S.value

        if self.phase == "forward":
            if self.forward_is_clear(pose, reading, forward, grid):
                dx = pose.x_mm - self.forward_start.x_mm
                dy = pose.y_mm - self.forward_start.y_mm
                if dx * dx + dy * dy < SCAN_SPACING_MM ** 2:
                    _PHASE.value = "forward"
                    return MotionCommand(forward, 0)
                # A long straight approach can pass a corner outside the ultrasound cone.
                # Look left, right and back ahead while advancing on short arcs.
                angle = SCAN_HALF_ANGLE_DEG * pi / 180
                self.scan_headings = [pose.heading_rad - angle, pose.heading_rad]
                self.aim(pose, pose.heading_rad + angle, now)
                self.phase = "scan"
            else:
                self.phase = "reverse"
                self.phase_started_ms = now

        # A new return can interrupt an ongoing turn if the chassis no longer fits.
        turn_clear = grid.can_move(pose, 0)
        if self.phase in ("turn", "scan") and not turn_clear:
            self.scan_headings = []
            self.phase = "reverse"
            self.phase_started_ms = now

        if self.phase == "reverse":
            # Normally the short retreat leaves room to turn. If an echo arrived
            # beside the chassis, keep backing only while the reverse path is clear.
            retreat_limit = REVERSE_TIME_S if turn_clear else MAX_REVERSE_TIME_S
            if elapsed_time_s(now, self.phase_started_ms) < retreat_limit and grid.can_move(pose, reverse):
                _PHASE.value = "reverse"
                return MotionCommand(reverse, 0)
            if not turn_clear:
                self.phase = "blocked"
                _PHASE.value = "blocked"
                return STOP_COMMAND
            self.aim(pose, self.choose_heading(pose, grid), now)
            self.turn_count += 1
            _TURNS.value = self.turn_count
            self.phase = "turn"

        # Reduce the yaw rate as the heading error falls. Take one stopped sample at the target.
        error = wrap_angle_rad(self.target_heading_rad - pose.heading_rad)
        if abs(error) <= TURN_TOLERANCE_RAD:
            if self.scan_headings:
                self.aim(pose, self.scan_headings.pop(0), now)
            else:
                self.phase = "forward"
                self.forward_start = pose
            return STOP_COMMAND
        # Reset the stall timer as the wheels bring the chassis closer to its
        # target. A low steering rate can then take as long as the turn requires.
        if self.progress_error_rad - abs(error) >= TURN_TOLERANCE_RAD:
            self.progress_error_rad = abs(error)
            self.phase_started_ms = now
        if elapsed_time_s(now, self.phase_started_ms) >= TURN_STALL_TIME_S:
            raise RuntimeError("Avoidance turn timed out. Check wheel motion and encoders.")
        yaw_rate = min(STEERING_RATE_RAD_S.value, TURN_GAIN_PER_S * abs(error))
        speed = 0
        if self.phase == "scan" and (reading is None or reading > OBSTACLE_DISTANCE_MM.value):
            # Arc speed is radius times yaw rate. If the path is blocked, rotate in place.
            maximum_speed = min(forward, SCAN_RADIUS_MM * STEERING_RATE_RAD_S.value)
            if grid.can_move(pose, maximum_speed):
                speed = min(maximum_speed, SCAN_RADIUS_MM * yaw_rate)
        _PHASE.value = self.phase
        return MotionCommand(speed, yaw_rate if error > 0 else -yaw_rate)
