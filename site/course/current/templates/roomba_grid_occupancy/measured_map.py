# Recorded sonar cells and the space needed for one reactive maneuver.

import json
from math import ceil, cos, floor, pi, sin

from occupancy_map import OCCUPIED, OccupancyMap
from occupancy_update import update_occupancy
from settings import (BEAM_HALF_ANGLE_DEG, CELL_MM, CLEAR_PASSES, MAP_RANGE_MM, MIN_RANGE_MM,
                      RESPONSE_TIME_S, SENSOR_OFFSET_MM, TURN_RADIUS_MM, WALL_TOLERANCE_MM)


CONE_COS = cos(BEAM_HALF_ANGLE_DEG * pi / 180)
CONE_SIN = sin(BEAM_HALF_ANGLE_DEG * pi / 180)


def step_blocked(x, y, dx, dy, travel, left, bottom, right, top):
    # Check a disk swept along the axle segment against one occupied cell.
    # A step that increases distance from the outset lets the robot retreat.
    gx = x - min(max(x, left), right)
    gy = y - min(max(y, bottom), top)
    if gx * dx + gy * dy > 0:
        return False
    end_x, end_y = x + dx, y + dy
    hx = end_x - min(max(end_x, left), right)
    hy = end_y - min(max(end_y, bottom), top)
    radius_squared = TURN_RADIUS_MM ** 2
    if gx * gx + gy * gy <= radius_squared or hx * hx + hy * hy <= radius_squared:
        return True
    if hx * dx + hy * dy <= 0:
        return False  # The closest point is the end of the segment, which clears the cell.

    # The closest approach lies between the two ends. Project the cell center
    # and half-widths onto the line normal (-dy, dx), whose length is abs(travel).
    half_x, half_y = (right - left) / 2, (top - bottom) / 2
    center_gap = abs((left + half_x - x) * dy - (bottom + half_y - y) * dx)
    cell_extent = half_x * abs(dy) + half_y * abs(dx)
    return center_gap <= cell_extent + TURN_RADIUS_MM * abs(travel)


class MeasuredMap(OccupancyMap):
    # Accumulate sonar evidence and test occupied cells against the next maneuver.

    def __init__(self, bounds, boundary_walls=True, cell_mm=CELL_MM, range_includes_walls=None):
        # Begin with unknown cells and a fresh ultrasound acquisition sequence.
        super().__init__(bounds, cell_mm)
        self.boundary_walls = boundary_walls
        # A custom floor can reflect sound at its perimeter even if the wheels can cross it.
        self._known_wall_echoes = boundary_walls if range_includes_walls is None else range_includes_walls
        self._clear_counts = bytearray(self.columns * len(self.rows))
        self._last_sequence = None

    @classmethod
    def for_world(cls, world):
        # An open floor still has a finite display grid. Only a walled floor has wall clearance.
        with open("world.json") as source:
            catalog = json.load(source)
        for floor in catalog["worlds"]:
            if floor["id"] == world.id:
                sense_walls = floor.get("range_sensor", {}).get("include_arena_boundary", True)
                return cls(world.bounds_mm, floor.get("boundary_walls", True), range_includes_walls=sense_walls)
        raise ValueError("Selected floor is missing from world.json")

    def record_hit(self, cell):
        # Another endpoint in this cell starts its count of contrary observations over.
        col, row = cell
        self._clear_counts[row * self.columns + col] = 0
        self.set_state(cell, OCCUPIED)

    def count_clear_pass(self, cell):
        # Count one fresh beam crossing this occupied cell since its most recent hit.
        col, row = cell
        index = row * self.columns + col
        count = min(CLEAR_PASSES, self._clear_counts[index] + 1)
        self._clear_counts[index] = count
        return count

    def wall_echo(self, pose, range_mm):
        # Compare the echo arc with the walls at the pose where the range was acquired.
        ux, uy = cos(pose.heading_rad), sin(pose.heading_rad)
        x, y = pose.x_mm + SENSOR_OFFSET_MM * ux, pose.y_mm + SENSOR_OFFSET_MM * uy
        xmin, ymin, xmax, ymax = self.bounds
        if not (xmin <= x <= xmax and ymin <= y <= ymax):
            return False
        nearest_gap = float("inf")
        for gap, normal, tangent in ((x - xmin, -ux, uy), (xmax - x, ux, uy),
                                     (y - ymin, -uy, ux), (ymax - y, uy, ux)):
            # The most direct ray is the wall normal when it falls inside the cone.
            # Otherwise it is the cone edge aimed more nearly towards that wall.
            projection = 1.0 if normal >= CONE_COS else normal * CONE_COS + abs(tangent) * CONE_SIN
            if projection > 0:
                # Perpendicular distance stays meaningful when a ray grazes the wall.
                nearest_gap = min(nearest_gap, gap - range_mm * projection)
        return abs(nearest_gap) <= WALL_TOLERANCE_MM

    def observe(self, sequence, state):
        # Use the acquisition pose once. A held or older reading cannot extend the map.
        if sequence is None or (self._last_sequence is not None and sequence <= self._last_sequence):
            return False
        self._last_sequence = sequence
        range_mm = state.measurements.range_mm
        free_cells, hit_cell = self.beam_cells(state.pose, range_mm, SENSOR_OFFSET_MM, MIN_RANGE_MM, MAP_RANGE_MM)
        if hit_cell is not None and self._known_wall_echoes and self.wall_echo(state.pose, range_mm):
            hit_cell = None  # The known wall can explain this echo without an interior obstacle.
        self._changed = False
        if free_cells or hit_cell is not None:
            update_occupancy(self, free_cells, hit_cell)
        return self._changed

    def can_move(self, pose, speed_mm_s):
        # The controller tests forward travel, reverse travel or a turn in place (speed zero).
        return self.blocking_feature(pose, speed_mm_s) is None

    def blocking_feature(self, pose, speed_mm_s):
        # Check the distance the chassis could travel before a new command takes effect.
        return self.blockage_along(pose, speed_mm_s * RESPONSE_TIME_S)

    def blockage_along(self, pose, travel):
        # Return a known wall or measured occupied cell within the swept chassis footprint.
        x, y = pose.x_mm, pose.y_mm
        dx, dy = travel * cos(pose.heading_rad), travel * sin(pose.heading_rad)
        xmin, ymin, xmax, ymax = self.bounds
        if self.boundary_walls:
            for wall, gap, approach in (("west wall", x - xmin, -dx), ("east wall", xmax - x, dx),
                                        ("south wall", y - ymin, -dy), ("north wall", ymax - y, dy)):
                if gap - approach <= TURN_RADIUS_MM and approach >= 0:
                    return wall

        # Check only cells within reach of the swept disk. Clip edge cells at the actual wall.
        radius = TURN_RADIUS_MM
        size = self.cell_mm
        first_col = max(0, ceil((min(x, x + dx) - radius - xmin) / size) - 1)
        last_col = min(self.columns - 1, floor((max(x, x + dx) + radius - xmin) / size))
        first_row = max(0, ceil((min(y, y + dy) - radius - ymin) / size) - 1)
        last_row = min(len(self.rows) - 1, floor((max(y, y + dy) + radius - ymin) / size))
        if first_col > last_col:
            return None
        # One column mask rules out entire rows, even if other cells in those rows contain hits.
        nearby_columns = 2 * self.column_bits[last_col] - self.column_bits[first_col]
        for row in range(first_row, last_row + 1):
            bits = self.rows[row] & nearby_columns
            if not bits:
                continue
            bottom = ymin + row * size
            top = min(bottom + size, ymax)
            for col in range(first_col, last_col + 1):
                if not bits & self.column_bits[col]:
                    continue
                left = xmin + col * size
                right = min(left + size, xmax)
                if step_blocked(x, y, dx, dy, travel, left, bottom, right, top):
                    return col, row
        return None
