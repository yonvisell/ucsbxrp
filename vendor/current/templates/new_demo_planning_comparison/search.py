"""Bounded four-neighbor BFS and A*: identical unit edge costs."""
from heapq import heappop, heappush
from ucsb_xrp import GridPath

MAXIMUM_CELLS = 1024
MAXIMUM_FRONTIER_ENTRIES = 4096

def _prepare(grid, start, goal):
    if grid.column_count * grid.row_count > MAXIMUM_CELLS:
        raise ValueError("Use at most 1024 cells")
    if start is None or goal is None:
        return False
    return not grid.is_blocked(start) and not grid.is_blocked(goal)

def _path(previous, goal):
    cells = []
    cell = goal
    while cell is not None:
        cells.append(cell)
        cell = previous[cell]
    cells.reverse()
    return GridPath(cells)

def bfs(grid, start, goal):
    if not _prepare(grid, start, goal):
        return None, 0
    frontier = [start]
    cursor = 0
    previous = {start: None}
    while cursor < len(frontier):
        cell = frontier[cursor]
        cursor += 1
        if cell == goal:
            return _path(previous, goal), cursor
        for neighbor in grid.neighbors(cell):
            if neighbor not in previous:
                previous[neighbor] = cell
                frontier.append(neighbor)
    return None, cursor

def astar(grid, start, goal):
    if not _prepare(grid, start, goal):
        return None, 0
    def heuristic(cell):
        return abs(cell.column - goal.column) + abs(cell.row - goal.row)
    # A unique tie number avoids comparing GridCell objects in the heap.
    frontier = [(heuristic(start), 0, 0, start)]
    previous = {start: None}
    best_cost = {start: 0}
    tie = 0
    expanded = 0
    while frontier:
        _, _, cost, cell = heappop(frontier)
        if cost != best_cost[cell]:
            continue  # A cheaper entry superseded this queued route.
        expanded += 1
        if cell == goal:
            return _path(previous, goal), expanded
        for neighbor in grid.neighbors(cell):
            next_cost = cost + 1
            if next_cost < best_cost.get(neighbor, MAXIMUM_CELLS + 1):
                best_cost[neighbor] = next_cost
                previous[neighbor] = cell
                tie += 1
                heappush(frontier, (next_cost + heuristic(neighbor), tie, next_cost, neighbor))
                if len(frontier) > MAXIMUM_FRONTIER_ENTRIES:
                    raise ValueError("Priority queue exceeded the experiment limit")
    return None, expanded
