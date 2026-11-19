# Rectangular occupancy grid and forward ultrasound projection. Distances are in mm.

from math import ceil, cos, floor, isfinite, sin


UNKNOWN, FREE, OCCUPIED = 0, 1, 2
# MicroPython ports can use single or double precision for the same projection.
_RELATIVE_TOLERANCE = 1e-6 if 1.0 + 1e-8 == 1.0 else 1e-12


def echo_point(pose, range_mm, sensor_offset_mm, min_range_mm, max_range_mm):
    # Estimate the echo position on the centerline of the ultrasound beam.
    if range_mm is None or not min_range_mm <= range_mm <= max_range_mm:
        return None
    distance = sensor_offset_mm + range_mm
    return (pose.x_mm + distance * cos(pose.heading_rad),
            pose.y_mm + distance * sin(pose.heading_rad))


class OccupancyMap:
    # Store unknown, free and occupied cells in rows counted north from the southwest corner.

    def __init__(self, bounds, cell_mm):
        # Each row begins with empty masks for free and occupied cells.
        xmin, ymin, xmax, ymax = bounds
        if not isfinite(cell_mm) or cell_mm <= 0:
            raise ValueError("Cell width must be positive and finite.")
        self.bounds = bounds
        self.cell_mm = cell_mm
        self.columns = ceil((xmax - xmin) / cell_mm)
        row_count = ceil((ymax - ymin) / cell_mm)
        if max(self.columns, row_count) > 512 or self.columns * row_count > 65536:
            raise ValueError("Increase CELL_MM for this floor so Monitor can record the grid.")
        self.column_bits = [1 << column for column in range(self.columns)]
        self.rows = [0] * row_count
        self.free_rows = [0] * row_count
        self._changed = False

    def cell_at(self, x_mm, y_mm):
        # Find the containing (column, row). An endpoint on a wall is in the edge cell.
        xmin, ymin, xmax, ymax = self.bounds
        if not (xmin <= x_mm <= xmax and ymin <= y_mm <= ymax):
            return None
        column = min(self.columns - 1, floor((x_mm - xmin) / self.cell_mm))
        row = min(len(self.rows) - 1, floor((y_mm - ymin) / self.cell_mm))
        return column, row

    def cell_center(self, column, row):
        # Convert a grid index to the world coordinates of its center on the lattice.
        return (self.bounds[0] + (column + 0.5) * self.cell_mm,
                self.bounds[1] + (row + 0.5) * self.cell_mm)

    def state(self, cell):
        # Read the current evidence at (column, row).
        column, row = cell
        if not (0 <= column < self.columns and 0 <= row < len(self.rows)):
            raise IndexError("Cell outside map")
        bit = self.column_bits[column]
        if self.rows[row] & bit:
            return OCCUPIED
        if self.free_rows[row] & bit:
            return FREE
        return UNKNOWN

    def set_state(self, cell, state):
        # Replace the previous evidence in one cell and report whether it changed.
        if state not in (UNKNOWN, FREE, OCCUPIED):
            raise ValueError("Unknown cell state")
        if self.state(cell) == state:
            return False
        column, row = cell
        bit = self.column_bits[column]
        self.rows[row] &= ~bit
        self.free_rows[row] &= ~bit
        if state == OCCUPIED:
            self.rows[row] |= bit
        elif state == FREE:
            self.free_rows[row] |= bit
        self._changed = True
        return True

    def mark_occupied(self, column, row):
        # Mark a valid cell occupied and report whether its state changed.
        if not (0 <= column < self.columns and 0 <= row < len(self.rows)):
            return False
        return self.set_state((column, row), OCCUPIED)

    def _directed_cell(self, x, y, ux, uy, epsilon):
        # On an internal face choose the cell ahead of the ray. A ray along a face
        # takes the same north/east cell as cell_at. Keep arena edges in the grid.
        xmin, ymin, _, _ = self.bounds
        shift_x = -epsilon if ux < 0 else epsilon
        shift_y = -epsilon if uy < 0 else epsilon
        col = floor((x - xmin + shift_x) / self.cell_mm)
        row = floor((y - ymin + shift_y) / self.cell_mm)
        return (min(self.columns - 1, max(0, col)), min(len(self.rows) - 1, max(0, row)))

    def beam_cells(self, pose, range_mm, sensor_offset_mm, min_range_mm, max_range_mm):
        # Return the crossed cells and, separately, the estimated surface cell if it is on the map.
        if range_mm is None or not isfinite(range_mm) or range_mm < min_range_mm:
            return [], None
        ux, uy = cos(pose.heading_rad), sin(pose.heading_rad)
        # Cardinal headings such as pi have a small floating-point transverse component.
        ux = 0.0 if abs(ux) < _RELATIVE_TOLERANCE else ux
        uy = 0.0 if abs(uy) < _RELATIVE_TOLERANCE else uy
        sx = pose.x_mm + sensor_offset_mm * ux
        sy = pose.y_mm + sensor_offset_mm * uy
        xmin, ymin, xmax, ymax = self.bounds
        enter, leave = 0.0, min(range_mm, max_range_mm)
        # Clip the segment to both floor dimensions, including a ray entering from outside.
        for origin, direction, low, high in ((sx, ux, xmin, xmax), (sy, uy, ymin, ymax)):
            if direction == 0:
                if origin < low or origin > high:
                    return [], None
            else:
                first, last = (low - origin) / direction, (high - origin) / direction
                enter, leave = max(enter, min(first, last)), min(leave, max(first, last))

        # Treat a simultaneous x/y crossing at a corner as a single crossing despite rounding.
        size = self.cell_mm
        epsilon = max(xmax - xmin, ymax - ymin) * _RELATIVE_TOLERANCE
        if enter > leave + epsilon:
            return [], None

        hit = None
        if range_mm <= max_range_mm and abs(leave - range_mm) <= epsilon:
            hit = self._directed_cell(sx + range_mm * ux, sy + range_mm * uy, ux, uy, epsilon)
        if leave - enter <= epsilon:
            return [], hit

        col, row = self._directed_cell(sx + enter * ux, sy + enter * uy, ux, uy, epsilon)
        step_x = 1 if ux > 0 else -1
        step_y = 1 if uy > 0 else -1
        infinity = float("inf")
        next_x = (xmin + (col + (ux > 0)) * size - sx) / ux if ux else infinity
        next_y = (ymin + (row + (uy > 0)) * size - sy) / uy if uy else infinity
        delta_x = size / abs(ux) if ux else infinity
        delta_y = size / abs(uy) if uy else infinity
        crossed_cells = []
        while True:
            crossed_cells.append((col, row))
            crossing = min(next_x, next_y)
            if crossing >= leave - epsilon:
                break
            if next_x <= crossing + epsilon:
                col += step_x
                next_x += delta_x
            if next_y <= crossing + epsilon:
                row += step_y
                next_y += delta_y
        if crossed_cells[-1] == hit:
            crossed_cells.pop()
        return crossed_cells, hit
