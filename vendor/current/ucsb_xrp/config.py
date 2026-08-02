"""Validated, immutable configuration values for UCSB-XRP."""

from ._validation import (
    require_int,
    require_nonnegative,
    require_number,
    require_positive,
    require_sign,
)
from .records import _ValueRecord


class RobotConfig(_ValueRecord):
    """Geometry, signs, calibration, controller gains, and command limit."""

    __slots__ = (
        "_sample_period_ms",
        "_wheel_diameter_mm",
        "_encoder_counts_per_revolution",
        "_track_width_mm",
        "_left_motor_sign",
        "_right_motor_sign",
        "_left_encoder_sign",
        "_right_encoder_sign",
        "_left_start_command",
        "_right_start_command",
        "_left_speed_command_gain",
        "_right_speed_command_gain",
        "_wheel_speed_kp",
        "_max_drive_command",
    )
    _field_names = (
        "sample_period_ms",
        "wheel_diameter_mm",
        "encoder_counts_per_revolution",
        "track_width_mm",
        "left_motor_sign",
        "right_motor_sign",
        "left_encoder_sign",
        "right_encoder_sign",
        "left_start_command",
        "right_start_command",
        "left_speed_command_gain",
        "right_speed_command_gain",
        "wheel_speed_kp",
        "max_drive_command",
    )

    def __init__(
        self,
        sample_period_ms=20,
        wheel_diameter_mm=60.0,
        encoder_counts_per_revolution=585.0,
        track_width_mm=155.0,
        left_motor_sign=1,
        right_motor_sign=1,
        left_encoder_sign=1,
        right_encoder_sign=1,
        left_start_command=None,
        right_start_command=None,
        left_speed_command_gain=None,
        right_speed_command_gain=None,
        wheel_speed_kp=0.0,
        max_drive_command=None,
        **legacy,
    ):
        left_start_command = self._resolve_legacy(
            "left_start_command",
            left_start_command,
            "left_start_effort",
            legacy,
            0.0,
        )
        right_start_command = self._resolve_legacy(
            "right_start_command",
            right_start_command,
            "right_start_effort",
            legacy,
            0.0,
        )
        left_speed_command_gain = self._resolve_legacy(
            "left_speed_command_gain",
            left_speed_command_gain,
            "left_speed_effort_gain",
            legacy,
            0.0,
        )
        right_speed_command_gain = self._resolve_legacy(
            "right_speed_command_gain",
            right_speed_command_gain,
            "right_speed_effort_gain",
            legacy,
            0.0,
        )
        max_drive_command = self._resolve_legacy(
            "max_drive_command",
            max_drive_command,
            "max_effort",
            legacy,
            1.0,
        )
        if legacy:
            name = next(iter(legacy))
            raise TypeError("unexpected RobotConfig argument: {}".format(name))
        self._sample_period_ms = require_int(
            "sample_period_ms", sample_period_ms, minimum=1
        )
        self._wheel_diameter_mm = require_positive(
            "wheel_diameter_mm", wheel_diameter_mm
        )
        self._encoder_counts_per_revolution = require_positive(
            "encoder_counts_per_revolution", encoder_counts_per_revolution
        )
        self._track_width_mm = require_positive("track_width_mm", track_width_mm)
        self._left_motor_sign = require_sign("left_motor_sign", left_motor_sign)
        self._right_motor_sign = require_sign("right_motor_sign", right_motor_sign)
        self._left_encoder_sign = require_sign(
            "left_encoder_sign", left_encoder_sign
        )
        self._right_encoder_sign = require_sign(
            "right_encoder_sign", right_encoder_sign
        )
        self._left_start_command = require_nonnegative(
            "left_start_command", left_start_command
        )
        self._right_start_command = require_nonnegative(
            "right_start_command", right_start_command
        )
        self._left_speed_command_gain = require_nonnegative(
            "left_speed_command_gain", left_speed_command_gain
        )
        self._right_speed_command_gain = require_nonnegative(
            "right_speed_command_gain", right_speed_command_gain
        )
        self._wheel_speed_kp = require_nonnegative("wheel_speed_kp", wheel_speed_kp)
        self._max_drive_command = require_number(
            "max_drive_command", max_drive_command
        )
        if self._max_drive_command < 0.0 or self._max_drive_command > 1.0:
            raise ValueError("max_drive_command must be within [0.0, 1.0]")
        if self._left_start_command > self._max_drive_command:
            raise ValueError(
                "left_start_command must not exceed max_drive_command"
            )
        if self._right_start_command > self._max_drive_command:
            raise ValueError(
                "right_start_command must not exceed max_drive_command"
            )

    @staticmethod
    def _resolve_legacy(preferred_name, preferred, legacy_name, legacy, default):
        if legacy_name not in legacy:
            return default if preferred is None else preferred
        legacy_value = legacy.pop(legacy_name)
        if preferred is not None:
            raise TypeError(
                "use either {} or {}, not both".format(
                    preferred_name, legacy_name
                )
            )
        return legacy_value

    @property
    def sample_period_ms(self):
        return self._sample_period_ms

    @property
    def wheel_diameter_mm(self):
        return self._wheel_diameter_mm

    @property
    def encoder_counts_per_revolution(self):
        return self._encoder_counts_per_revolution

    @property
    def track_width_mm(self):
        return self._track_width_mm

    @property
    def left_motor_sign(self):
        return self._left_motor_sign

    @property
    def right_motor_sign(self):
        return self._right_motor_sign

    @property
    def left_encoder_sign(self):
        return self._left_encoder_sign

    @property
    def right_encoder_sign(self):
        return self._right_encoder_sign

    @property
    def left_start_command(self):
        return self._left_start_command

    @property
    def right_start_command(self):
        return self._right_start_command

    @property
    def left_speed_command_gain(self):
        return self._left_speed_command_gain

    @property
    def right_speed_command_gain(self):
        return self._right_speed_command_gain

    @property
    def wheel_speed_kp(self):
        return self._wheel_speed_kp

    @property
    def max_drive_command(self):
        return self._max_drive_command

    # Read-only compatibility aliases for course projects created before 0.3.
    @property
    def left_start_effort(self):
        return self.left_start_command

    @property
    def right_start_effort(self):
        return self.right_start_command

    @property
    def left_speed_effort_gain(self):
        return self.left_speed_command_gain

    @property
    def right_speed_effort_gain(self):
        return self.right_speed_command_gain

    @property
    def max_effort(self):
        return self.max_drive_command

class NavigationConfig(_ValueRecord):
    __slots__ = (
        "_cruise_speed_mm_s",
        "_approach_speed_mm_s",
        "_slowdown_distance_mm",
        "_turn_rate_rad_s",
        "_position_tolerance_mm",
        "_heading_tolerance_rad",
        "_realign_heading_rad",
    )
    _field_names = (
        "cruise_speed_mm_s",
        "approach_speed_mm_s",
        "slowdown_distance_mm",
        "turn_rate_rad_s",
        "position_tolerance_mm",
        "heading_tolerance_rad",
        "realign_heading_rad",
    )

    def __init__(
        self,
        cruise_speed_mm_s,
        approach_speed_mm_s,
        slowdown_distance_mm,
        turn_rate_rad_s,
        position_tolerance_mm,
        heading_tolerance_rad,
        realign_heading_rad,
    ):
        self._cruise_speed_mm_s = require_positive(
            "cruise_speed_mm_s", cruise_speed_mm_s
        )
        self._approach_speed_mm_s = require_positive(
            "approach_speed_mm_s", approach_speed_mm_s
        )
        self._slowdown_distance_mm = require_positive(
            "slowdown_distance_mm", slowdown_distance_mm
        )
        self._turn_rate_rad_s = require_positive(
            "turn_rate_rad_s", turn_rate_rad_s
        )
        self._position_tolerance_mm = require_nonnegative(
            "position_tolerance_mm", position_tolerance_mm
        )
        self._heading_tolerance_rad = require_nonnegative(
            "heading_tolerance_rad", heading_tolerance_rad
        )
        self._realign_heading_rad = require_nonnegative(
            "realign_heading_rad", realign_heading_rad
        )
        if self._approach_speed_mm_s > self._cruise_speed_mm_s:
            raise ValueError("approach_speed_mm_s must not exceed cruise_speed_mm_s")
        if self._realign_heading_rad < self._heading_tolerance_rad:
            raise ValueError(
                "realign_heading_rad must not be below heading_tolerance_rad"
            )

    @property
    def cruise_speed_mm_s(self):
        return self._cruise_speed_mm_s

    @property
    def approach_speed_mm_s(self):
        return self._approach_speed_mm_s

    @property
    def slowdown_distance_mm(self):
        return self._slowdown_distance_mm

    @property
    def turn_rate_rad_s(self):
        return self._turn_rate_rad_s

    @property
    def position_tolerance_mm(self):
        return self._position_tolerance_mm

    @property
    def heading_tolerance_rad(self):
        return self._heading_tolerance_rad

    @property
    def realign_heading_rad(self):
        return self._realign_heading_rad
