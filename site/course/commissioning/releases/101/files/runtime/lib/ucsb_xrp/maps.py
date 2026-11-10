"""Dimensioned arena geometry and occupancy-grid sampling."""

from math import ceil, floor

from ._validation import require_nonnegative, require_number, require_positive
from .records import GridCell, _ValueRecord


class Rectangle(_ValueRecord):
    """Closed axis-aligned rectangle in world millimeters."""

    __slots__ = ("_minimum_x_mm", "_minimum_y_mm", "_maximum_x_mm", "_maximum_y_mm")
    _field_names = (
        "minimum_x_mm",
        "minimum_y_mm",
        "maximum_x_mm",
        "maximum_y_mm",
    )

    def __init__(self, minimum_x_mm, minimum_y_mm, maximum_x_mm, maximum_y_mm):
        minimum_x_mm = require_number("minimum_x_mm", minimum_x_mm)
        minimum_y_mm = require_number("minimum_y_mm", minimum_y_mm)
        maximum_x_mm = require_number("maximum_x_mm", maximum_x_mm)
        maximum_y_mm = require_number("maximum_y_mm", maximum_y_mm)
        if maximum_x_mm <= minimum_x_mm or maximum_y_mm <= minimum_y_mm:
            raise ValueError("a rectangle must have positive width and height")
        self._minimum_x_mm = minimum_x_mm
        self._minimum_y_mm = minimum_y_mm
        self._maximum_x_mm = maximum_x_mm
        self._maximum_y_mm = maximum_y_mm

    @property
    def minimum_x_mm(self):
        return self._minimum_x_mm

    @property
    def minimum_y_mm(self):
        return self._minimum_y_mm

    @property
    def maximum_x_mm(self):
        return self._maximum_x_mm

    @property
    def maximum_y_mm(self):
        return self._maximum_y_mm

    @property
    def bounds_mm(self):
        return (
            self.minimum_x_mm,
            self.minimum_y_mm,
            self.maximum_x_mm,
            self.maximum_y_mm,
        )

    def contains(self, x_mm, y_mm, margin_mm=0.0):
        x_mm = require_number("x_mm", x_mm)
        y_mm = require_number("y_mm", y_mm)
        margin_mm = require_nonnegative("margin_mm", margin_mm)
        return (
            x_mm >= self.minimum_x_mm - margin_mm
            and x_mm <= self.maximum_x_mm + margin_mm
            and y_mm >= self.minimum_y_mm - margin_mm
            and y_mm <= self.maximum_y_mm + margin_mm
        )


def _rectangle(value, name):
    if isinstance(value, Rectangle):
        return value
    if isinstance(value, (tuple, list)) and len(value) == 4:
        return Rectangle(value[0], value[1], value[2], value[3])
    raise TypeError("{} must be a Rectangle or four-number bounds".format(name))


class ArenaMap:
    """Immutable rectangular arena with fixed obstacles and named features.

    ``features`` maps a short classroom name to a Rectangle. A feature blocks
    space only when its name is present in ``blocked_features``; this keeps the
    one changing part of Challenge 5 explicit in ``challenge.py``.
    """

    __slots__ = ("_bounds", "_obstacles", "_features", "_blocked_features")

    def __init__(
        self,
        bounds_mm,
        obstacles=(),
        features=None,
        blocked_features=(),
    ):
        bounds = _rectangle(bounds_mm, "bounds_mm")
        if not isinstance(obstacles, (tuple, list)):
            raise TypeError("obstacles must be a tuple or list")
        obstacle_values = tuple(
            _rectangle(value, "obstacle") for value in obstacles
        )
        if features is None:
            features = {}
        if not isinstance(features, dict):
            raise TypeError("features must map names to rectangles")
        feature_values = {}
        for name, rectangle in features.items():
            if not isinstance(name, str) or not name:
                raise TypeError("feature names must be nonempty strings")
            feature_values[name] = _rectangle(rectangle, "feature " + name)
        blocked = tuple(blocked_features)
        for name in blocked:
            if name not in feature_values:
                raise ValueError("unknown blocked feature: " + str(name))
        self._bounds = bounds
        self._obstacles = obstacle_values
        self._features = feature_values
        self._blocked_features = frozenset(blocked)

    @property
    def bounds_mm(self):
        return self._bounds.bounds_mm

    @property
    def obstacles(self):
        return self._obstacles

    @property
    def feature_names(self):
        return tuple(sorted(self._features.keys()))

    @property
    def blocked_features(self):
        return tuple(
            name for name in self.feature_names if name in self._blocked_features
        )

    def feature_bounds(self, name):
        try:
            return self._features[name].bounds_mm
        except KeyError:
            raise ValueError("unknown map feature: " + str(name))

    def contains(self, x_mm, y_mm):
        x_mm = require_number("x_mm", x_mm)
        y_mm = require_number("y_mm", y_mm)
        return self._bounds.contains(x_mm, y_mm)

    def is_free(self, x_mm, y_mm, clearance_mm=0.0):
        x_mm = require_number("x_mm", x_mm)
        y_mm = require_number("y_mm", y_mm)
        clearance_mm = require_nonnegative("clearance_mm", clearance_mm)
        if not (
            x_mm >= self._bounds.minimum_x_mm + clearance_mm
            and x_mm <= self._bounds.maximum_x_mm - clearance_mm
            and y_mm >= self._bounds.minimum_y_mm + clearance_mm
            and y_mm <= self._bounds.maximum_y_mm - clearance_mm
        ):
            return False
        for rectangle in self._obstacles:
            if rectangle.contains(x_mm, y_mm, clearance_mm):
                return False
        for name in self._blocked_features:
            if self._features[name].contains(x_mm, y_mm, clearance_mm):
                return False
        return True

    def with_feature_blocked(self, name, blocked):
        if name not in self._features:
            raise ValueError("unknown map feature: " + str(name))
        if not isinstance(blocked, bool):
            raise TypeError("blocked must be True or False")
        names = set(self._blocked_features)
        if blocked:
            names.add(name)
        else:
            names.discard(name)
        return ArenaMap(
            self._bounds,
            self._obstacles,
            self._features,
            tuple(names),
        )


class OccupancyGrid:
    """Uniform free/blocked sampling of an ArenaMap."""

    __slots__ = (
        "_resolution_mm",
        "_origin_x_mm",
        "_origin_y_mm",
        "_column_count",
        "_row_count",
        "_blocked",
    )

    def __init__(
        self,
        resolution_mm,
        origin_x_mm,
        origin_y_mm,
        column_count,
        row_count,
        blocked,
    ):
        self._resolution_mm = require_positive("resolution_mm", resolution_mm)
        self._origin_x_mm = require_number("origin_x_mm", origin_x_mm)
        self._origin_y_mm = require_number("origin_y_mm", origin_y_mm)
        if not isinstance(column_count, int) or column_count <= 0:
            raise ValueError("column_count must be a positive integer")
        if not isinstance(row_count, int) or row_count <= 0:
            raise ValueError("row_count must be a positive integer")
        blocked = tuple(bool(value) for value in blocked)
        if len(blocked) != column_count * row_count:
            raise ValueError("blocked data size does not match the grid")
        self._column_count = column_count
        self._row_count = row_count
        self._blocked = blocked

    @classmethod
    def from_arena(cls, arena, resolution_mm, clearance_mm=0.0):
        if not isinstance(arena, ArenaMap):
            raise TypeError("arena must be an ArenaMap")
        resolution_mm = require_positive("resolution_mm", resolution_mm)
        clearance_mm = require_nonnegative("clearance_mm", clearance_mm)
        minimum_x, minimum_y, maximum_x, maximum_y = arena.bounds_mm
        columns = int(ceil((maximum_x - minimum_x) / resolution_mm))
        rows = int(ceil((maximum_y - minimum_y) / resolution_mm))
        blocked = []
        for row in range(rows):
            for column in range(columns):
                x_mm = minimum_x + (column + 0.5) * resolution_mm
                y_mm = minimum_y + (row + 0.5) * resolution_mm
                blocked.append(not arena.is_free(x_mm, y_mm, clearance_mm))
        return cls(
            resolution_mm,
            minimum_x,
            minimum_y,
            columns,
            rows,
            blocked,
        )

    @property
    def resolution_mm(self):
        return self._resolution_mm

    @property
    def origin_x_mm(self):
        return self._origin_x_mm

    @property
    def origin_y_mm(self):
        return self._origin_y_mm

    @property
    def column_count(self):
        return self._column_count

    @property
    def row_count(self):
        return self._row_count

    def world_to_cell(self, x_mm, y_mm):
        x_mm = require_number("x_mm", x_mm)
        y_mm = require_number("y_mm", y_mm)
        column = int(floor((x_mm - self.origin_x_mm) / self.resolution_mm))
        row = int(floor((y_mm - self.origin_y_mm) / self.resolution_mm))
        cell = GridCell(column, row)
        return cell if self.contains(cell) else None

    def cell_center(self, cell):
        if not isinstance(cell, GridCell):
            raise TypeError("cell must be a GridCell")
        if not self.contains(cell):
            raise ValueError("cell is outside the grid")
        return (
            self.origin_x_mm + (cell.column + 0.5) * self.resolution_mm,
            self.origin_y_mm + (cell.row + 0.5) * self.resolution_mm,
        )

    def contains(self, cell):
        if not isinstance(cell, GridCell):
            raise TypeError("cell must be a GridCell")
        return (
            cell.column >= 0
            and cell.column < self.column_count
            and cell.row >= 0
            and cell.row < self.row_count
        )

    def is_blocked(self, cell):
        if not isinstance(cell, GridCell):
            raise TypeError("cell must be a GridCell")
        if not self.contains(cell):
            return True
        index = cell.row * self.column_count + cell.column
        return self._blocked[index]

    def neighbors(self, cell):
        if not isinstance(cell, GridCell):
            raise TypeError("cell must be a GridCell")
        values = []
        for column_delta, row_delta in ((1, 0), (0, 1), (-1, 0), (0, -1)):
            candidate = GridCell(
                cell.column + column_delta,
                cell.row + row_delta,
            )
            if not self.is_blocked(candidate):
                values.append(candidate)
        return tuple(values)
