"""Supplied Challenge 4 shortest-grid-path implementation."""

from ucsb_xrp.maps import OccupancyGrid
from ucsb_xrp.records import GridCell, GridPath
from ucsb_xrp.student_api import GridPlannerBase


class GridPlanner(GridPlannerBase):
    """Breadth-first search through free four-neighbor cells."""

    __slots__ = ()

    def plan(self, grid, start, goal):
        if not isinstance(grid, OccupancyGrid):
            raise TypeError("grid must be an OccupancyGrid")
        if start is None or goal is None:
            return None
        if not isinstance(start, GridCell) or not isinstance(goal, GridCell):
            raise TypeError("start and goal must be GridCell values or None")
        if grid.is_blocked(start) or grid.is_blocked(goal):
            return None
        if start == goal:
            return GridPath((start,))

        frontier = [start]
        next_index = 0
        predecessor = {start: None}
        while next_index < len(frontier):
            current = frontier[next_index]
            next_index += 1
            for neighbor in grid.neighbors(current):
                if neighbor in predecessor:
                    continue
                predecessor[neighbor] = current
                if neighbor == goal:
                    cells = [goal]
                    while cells[-1] != start:
                        cells.append(predecessor[cells[-1]])
                    cells.reverse()
                    return GridPath(tuple(cells))
                frontier.append(neighbor)
        return None
