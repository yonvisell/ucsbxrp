"""Validated value records for the public UCSB-XRP course interface."""

from ._validation import (
    require_bool,
    require_int,
    require_nonnegative,
    require_number,
    require_optional_positive,
)
from .utils import wrap_angle_rad


class _ValueRecord:
    __slots__ = ()
    _field_names = ()

    def __repr__(self):
        values = []
        for name in self._field_names:
            values.append("{}={!r}".format(name, getattr(self, name)))
        return "{}({})".format(type(self).__name__, ", ".join(values))

    def __eq__(self, other):
        if type(self) is not type(other):
            return False
        for name in self._field_names:
            if getattr(self, name) != getattr(other, name):
                return False
        return True

    def __ne__(self, other):
        return not self == other


class RawSensors(_ValueRecord):
    __slots__ = (
        "_time_ms",
        "_left_encoder_count",
        "_right_encoder_count",
        "_range_mm",
        "_button_pressed",
    )
    _field_names = (
        "time_ms",
        "left_encoder_count",
        "right_encoder_count",
        "range_mm",
        "button_pressed",
    )

    def __init__(
        self,
        time_ms,
        left_encoder_count,
        right_encoder_count,
        range_mm,
        button_pressed,
    ):
        self._time_ms = require_int("time_ms", time_ms, minimum=0)
        self._left_encoder_count = require_int(
            "left_encoder_count", left_encoder_count
        )
        self._right_encoder_count = require_int(
            "right_encoder_count", right_encoder_count
        )
        self._range_mm = require_optional_positive("range_mm", range_mm)
        self._button_pressed = require_bool("button_pressed", button_pressed)

    @property
    def time_ms(self):
        return self._time_ms

    @property
    def left_encoder_count(self):
        return self._left_encoder_count

    @property
    def right_encoder_count(self):
        return self._right_encoder_count

    @property
    def range_mm(self):
        return self._range_mm

    @property
    def button_pressed(self):
        return self._button_pressed


class WheelSpeeds(_ValueRecord):
    __slots__ = ("_left_mm_s", "_right_mm_s")
    _field_names = ("left_mm_s", "right_mm_s")

    def __init__(self, left_mm_s, right_mm_s):
        self._left_mm_s = require_number("left_mm_s", left_mm_s)
        self._right_mm_s = require_number("right_mm_s", right_mm_s)

    @property
    def left_mm_s(self):
        return self._left_mm_s

    @property
    def right_mm_s(self):
        return self._right_mm_s


class DriveCommand(_ValueRecord):
    """Normalized left and right motor commands before sign conversion."""

    __slots__ = ("_left", "_right")
    _field_names = ("left", "right")

    def __init__(self, left, right):
        left = require_number("left", left)
        right = require_number("right", right)
        if abs(left) > 1.0 or abs(right) > 1.0:
            raise ValueError("drive commands must be within [-1.0, 1.0]")
        self._left = left
        self._right = right

    @property
    def left(self):
        return self._left

    @property
    def right(self):
        return self._right


# Compatibility for projects created before the drive-command terminology was
# adopted. Both names refer to the same validated value type.
MotorEfforts = DriveCommand


class MotionCommand(_ValueRecord):
    __slots__ = ("_forward_speed_mm_s", "_turn_rate_rad_s")
    _field_names = ("forward_speed_mm_s", "turn_rate_rad_s")

    def __init__(self, forward_speed_mm_s, turn_rate_rad_s):
        self._forward_speed_mm_s = require_number(
            "forward_speed_mm_s", forward_speed_mm_s
        )
        self._turn_rate_rad_s = require_number("turn_rate_rad_s", turn_rate_rad_s)

    @property
    def forward_speed_mm_s(self):
        return self._forward_speed_mm_s

    @property
    def turn_rate_rad_s(self):
        return self._turn_rate_rad_s


class Measurements(_ValueRecord):
    __slots__ = (
        "_time_ms",
        "_dt_s",
        "_left_position_mm",
        "_right_position_mm",
        "_left_increment_mm",
        "_right_increment_mm",
        "_left_speed_mm_s",
        "_right_speed_mm_s",
        "_range_mm",
        "_button_pressed",
    )
    _field_names = (
        "time_ms",
        "dt_s",
        "left_position_mm",
        "right_position_mm",
        "left_increment_mm",
        "right_increment_mm",
        "left_speed_mm_s",
        "right_speed_mm_s",
        "range_mm",
        "button_pressed",
    )

    def __init__(
        self,
        time_ms,
        dt_s,
        left_position_mm,
        right_position_mm,
        left_increment_mm,
        right_increment_mm,
        left_speed_mm_s,
        right_speed_mm_s,
        range_mm,
        button_pressed,
    ):
        self._time_ms = require_int("time_ms", time_ms, minimum=0)
        self._dt_s = require_nonnegative("dt_s", dt_s)
        self._left_position_mm = require_number(
            "left_position_mm", left_position_mm
        )
        self._right_position_mm = require_number(
            "right_position_mm", right_position_mm
        )
        self._left_increment_mm = require_number(
            "left_increment_mm", left_increment_mm
        )
        self._right_increment_mm = require_number(
            "right_increment_mm", right_increment_mm
        )
        self._left_speed_mm_s = require_number("left_speed_mm_s", left_speed_mm_s)
        self._right_speed_mm_s = require_number(
            "right_speed_mm_s", right_speed_mm_s
        )
        self._range_mm = require_optional_positive("range_mm", range_mm)
        self._button_pressed = require_bool("button_pressed", button_pressed)

    @property
    def time_ms(self):
        return self._time_ms

    @property
    def dt_s(self):
        return self._dt_s

    @property
    def left_position_mm(self):
        return self._left_position_mm

    @property
    def right_position_mm(self):
        return self._right_position_mm

    @property
    def left_increment_mm(self):
        return self._left_increment_mm

    @property
    def right_increment_mm(self):
        return self._right_increment_mm

    @property
    def left_speed_mm_s(self):
        return self._left_speed_mm_s

    @property
    def right_speed_mm_s(self):
        return self._right_speed_mm_s

    @property
    def range_mm(self):
        return self._range_mm

    @property
    def button_pressed(self):
        return self._button_pressed

    @property
    def wheel_speeds(self):
        return WheelSpeeds(self.left_speed_mm_s, self.right_speed_mm_s)


class Pose(_ValueRecord):
    __slots__ = ("_x_mm", "_y_mm", "_heading_rad")
    _field_names = ("x_mm", "y_mm", "heading_rad")

    def __init__(self, x_mm, y_mm, heading_rad):
        self._x_mm = require_number("x_mm", x_mm)
        self._y_mm = require_number("y_mm", y_mm)
        self._heading_rad = wrap_angle_rad(heading_rad)

    @property
    def x_mm(self):
        return self._x_mm

    @property
    def y_mm(self):
        return self._y_mm

    @property
    def heading_rad(self):
        return self._heading_rad


class RobotState(_ValueRecord):
    __slots__ = ("_measurements", "_pose")
    _field_names = ("measurements", "pose")

    def __init__(self, measurements, pose):
        if not isinstance(measurements, Measurements):
            raise TypeError("measurements must be a Measurements value")
        if not isinstance(pose, Pose):
            raise TypeError("pose must be a Pose value")
        self._measurements = measurements
        self._pose = pose

    @property
    def measurements(self):
        return self._measurements

    @property
    def pose(self):
        return self._pose


class NavigationGoal(_ValueRecord):
    __slots__ = ("_x_mm", "_y_mm", "_heading_rad")
    _field_names = ("x_mm", "y_mm", "heading_rad")

    def __init__(self, x_mm, y_mm, heading_rad=None):
        self._x_mm = require_number("x_mm", x_mm)
        self._y_mm = require_number("y_mm", y_mm)
        if heading_rad is None:
            self._heading_rad = None
        else:
            self._heading_rad = wrap_angle_rad(heading_rad)

    @property
    def x_mm(self):
        return self._x_mm

    @property
    def y_mm(self):
        return self._y_mm

    @property
    def heading_rad(self):
        return self._heading_rad


class GridCell(_ValueRecord):
    """Integer occupancy-grid coordinate."""

    __slots__ = ("_column", "_row")
    _field_names = ("column", "row")

    def __init__(self, column, row):
        self._column = require_int("column", column)
        self._row = require_int("row", row)

    @property
    def column(self):
        return self._column

    @property
    def row(self):
        return self._row

    def __hash__(self):
        return hash((self.column, self.row))


class GridPath(_ValueRecord):
    """Ordered cells joined by horizontal or vertical steps."""

    __slots__ = ("_cells",)
    _field_names = ("cells",)

    def __init__(self, cells):
        if not isinstance(cells, (tuple, list)):
            raise TypeError("cells must be a tuple or list of GridCell values")
        cells = tuple(cells)
        if not cells:
            raise ValueError("cells must contain at least one GridCell")
        previous = None
        for cell in cells:
            if not isinstance(cell, GridCell):
                raise TypeError("cells must contain only GridCell values")
            if previous is not None:
                step = abs(cell.column - previous.column) + abs(cell.row - previous.row)
                if step != 1:
                    raise ValueError(
                        "successive path cells must share a horizontal or vertical side"
                    )
            previous = cell
        self._cells = cells

    @property
    def cells(self):
        return self._cells

    def to_goals(self, grid, final_heading_rad=None):
        if final_heading_rad is not None:
            final_heading_rad = wrap_angle_rad(final_heading_rad)
        selected = []
        if len(self.cells) == 1:
            selected.append(self.cells[0])
        else:
            for index in range(1, len(self.cells) - 1):
                previous = self.cells[index - 1]
                current = self.cells[index]
                following = self.cells[index + 1]
                before = (
                    current.column - previous.column,
                    current.row - previous.row,
                )
                after = (
                    following.column - current.column,
                    following.row - current.row,
                )
                if before != after:
                    selected.append(current)
            selected.append(self.cells[-1])

        goals = []
        for index, cell in enumerate(selected):
            x_mm, y_mm = grid.cell_center(cell)
            heading = final_heading_rad if index == len(selected) - 1 else None
            goals.append(NavigationGoal(x_mm, y_mm, heading))
        return tuple(goals)


STOP_COMMAND = MotionCommand(0.0, 0.0)
