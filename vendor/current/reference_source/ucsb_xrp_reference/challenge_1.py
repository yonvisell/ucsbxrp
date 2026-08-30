"""Provisional supplied implementations for Challenge 1 components."""

from math import pi

from ucsb_xrp._validation import isfinite, require_int
from ucsb_xrp.records import DriveCommand, Measurements, RawSensors, WheelSpeeds
from ucsb_xrp.student_api import SensorModelBase, WheelSpeedControllerBase
from ucsb_xrp.utils import clamp, elapsed_time_s


class SensorModel(SensorModelBase):
    """Convert encoder counts and timestamps into wheel measurements."""

    __slots__ = (
        "_millimeters_per_count",
        "_origin_left_count",
        "_origin_right_count",
        "_previous_left_count",
        "_previous_right_count",
        "_previous_time_ms",
        "_elapsed_s",
        "_speed_times_s",
        "_left_speed_positions_mm",
        "_right_speed_positions_mm",
        "_speed_window_s",
        "_left_speed_mm_s",
        "_right_speed_mm_s",
        "_has_reset",
    )

    def __init__(self, config):
        super().__init__(config)
        self._millimeters_per_count = (
            pi * config.wheel_diameter_mm / config.encoder_counts_per_revolution
        )
        self._origin_left_count = 0
        self._origin_right_count = 0
        self._previous_left_count = 0
        self._previous_right_count = 0
        self._previous_time_ms = 0
        self._elapsed_s = 0.0
        self._speed_times_s = []
        self._left_speed_positions_mm = []
        self._right_speed_positions_mm = []
        self._speed_window_s = max(
            4.0 * config.sample_period_ms,
            config.wheel_speed_filter_time_constant_ms,
        ) / 1000.0
        self._left_speed_mm_s = 0.0
        self._right_speed_mm_s = 0.0
        self._has_reset = False

    def reset(self, raw):
        """Use ``raw`` as the time and wheel-position origin."""
        self._require_raw(raw)
        self._origin_left_count = raw.left_encoder_count
        self._origin_right_count = raw.right_encoder_count
        self._previous_left_count = raw.left_encoder_count
        self._previous_right_count = raw.right_encoder_count
        self._previous_time_ms = raw.time_ms
        self._elapsed_s = 0.0
        self._speed_times_s = [0.0]
        self._left_speed_positions_mm = [0.0]
        self._right_speed_positions_mm = [0.0]
        self._left_speed_mm_s = 0.0
        self._right_speed_mm_s = 0.0
        self._has_reset = True
        return Measurements(
            raw.time_ms,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            raw.range_mm,
            raw.button_pressed,
            raw.reflectance,
        )

    def update(self, raw):
        """Return exact wheel travel and regularized wheel speed for ``raw``."""
        self._require_raw(raw)
        if not self._has_reset:
            raise RuntimeError("call reset(raw) before update(raw)")

        left_position_mm = self._count_distance_mm(
            raw.left_encoder_count - self._origin_left_count,
            self.config.left_encoder_sign,
        )
        right_position_mm = self._count_distance_mm(
            raw.right_encoder_count - self._origin_right_count,
            self.config.right_encoder_sign,
        )
        left_increment_mm = self._count_distance_mm(
            raw.left_encoder_count - self._previous_left_count,
            self.config.left_encoder_sign,
        )
        right_increment_mm = self._count_distance_mm(
            raw.right_encoder_count - self._previous_right_count,
            self.config.right_encoder_sign,
        )
        dt_s = elapsed_time_s(raw.time_ms, self._previous_time_ms)

        self._previous_left_count = raw.left_encoder_count
        self._previous_right_count = raw.right_encoder_count
        self._previous_time_ms = raw.time_ms

        if dt_s > 0.0:
            self._elapsed_s += dt_s
            alpha = self._speed_filter_weight(dt_s)
            if alpha == 1.0:
                left_observation_mm_s = left_increment_mm / dt_s
                right_observation_mm_s = right_increment_mm / dt_s
            else:
                self._append_speed_sample(
                    self._elapsed_s,
                    left_position_mm,
                    right_position_mm,
                )
                left_observation_mm_s = self._position_slope(
                    self._left_speed_positions_mm
                )
                right_observation_mm_s = self._position_slope(
                    self._right_speed_positions_mm
                )
            self._left_speed_mm_s += alpha * (
                left_observation_mm_s - self._left_speed_mm_s
            )
            self._right_speed_mm_s += alpha * (
                right_observation_mm_s - self._right_speed_mm_s
            )
        else:
            dt_s = 0.0

        return Measurements(
            raw.time_ms,
            dt_s,
            left_position_mm,
            right_position_mm,
            left_increment_mm,
            right_increment_mm,
            self._left_speed_mm_s,
            self._right_speed_mm_s,
            raw.range_mm,
            raw.button_pressed,
            raw.reflectance,
        )

    def estimate_range(self, samples, minimum_usable):
        """Return the median positive finite range when enough samples exist."""
        minimum_usable = require_int(
            "minimum_usable", minimum_usable, minimum=1
        )
        usable = []
        for value in samples:
            if (
                isinstance(value, (int, float))
                and not isinstance(value, bool)
                and isfinite(float(value))
                and value > 0.0
            ):
                usable.append(float(value))

        if len(usable) < minimum_usable:
            return None

        usable.sort()
        middle = len(usable) // 2
        if len(usable) % 2 == 1:
            return usable[middle]
        return (usable[middle - 1] + usable[middle]) / 2.0

    def _count_distance_mm(self, count_change, encoder_sign):
        return count_change * encoder_sign * self._millimeters_per_count

    def _speed_filter_weight(self, dt_s):
        time_constant_s = (
            self.config.wheel_speed_filter_time_constant_ms / 1000.0
        )
        if time_constant_s == 0.0:
            return 1.0
        return dt_s / (time_constant_s + dt_s)

    def _append_speed_sample(self, time_s, left_position_mm, right_position_mm):
        """Keep a short trailing position history for wheel-speed estimation."""
        self._speed_times_s.append(time_s)
        self._left_speed_positions_mm.append(left_position_mm)
        self._right_speed_positions_mm.append(right_position_mm)
        earliest_s = time_s - self._speed_window_s
        while (
            len(self._speed_times_s) > 2
            and self._speed_times_s[1] <= earliest_s
        ):
            self._speed_times_s.pop(0)
            self._left_speed_positions_mm.pop(0)
            self._right_speed_positions_mm.pop(0)

    def _position_slope(self, positions_mm):
        """Return the least-squares slope of recent position versus time."""
        count = len(self._speed_times_s)
        if count < 2:
            return 0.0
        mean_time_s = sum(self._speed_times_s) / count
        mean_position_mm = sum(positions_mm) / count
        numerator = 0.0
        denominator = 0.0
        for index in range(count):
            centered_time_s = self._speed_times_s[index] - mean_time_s
            numerator += centered_time_s * (
                positions_mm[index] - mean_position_mm
            )
            denominator += centered_time_s * centered_time_s
        if denominator == 0.0:
            return 0.0
        return numerator / denominator

    @staticmethod
    def _require_raw(raw):
        if not isinstance(raw, RawSensors):
            raise TypeError("raw must be a RawSensors value")


class WheelSpeedController(WheelSpeedControllerBase):
    """Convert requested and measured wheel speed to a bounded drive command."""

    __slots__ = ()

    def reset(self):
        """Prepare for a run; this proportional controller stores no history."""

    def update(self, target, measured):
        if not isinstance(target, WheelSpeeds):
            raise TypeError("target must be a WheelSpeeds value")
        if not isinstance(measured, WheelSpeeds):
            raise TypeError("measured must be a WheelSpeeds value")

        left = self._wheel_command(
            target.left_mm_s,
            measured.left_mm_s,
            self.config.left_start_command,
            self.config.left_speed_command_gain,
        )
        right = self._wheel_command(
            target.right_mm_s,
            measured.right_mm_s,
            self.config.right_start_command,
            self.config.right_speed_command_gain,
        )
        return DriveCommand(left, right)

    def _wheel_command(self, target, measured, start_command, speed_command_gain):
        if target == 0.0:
            return 0.0

        direction = 1.0 if target > 0.0 else -1.0
        command = (
            direction * start_command
            + target * speed_command_gain
            + self.config.wheel_speed_kp * (target - measured)
        )
        return clamp(
            command,
            -self.config.max_drive_command,
            self.config.max_drive_command,
        )
