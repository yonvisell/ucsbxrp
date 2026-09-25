# Print the cells used by the mapped-route planner.

from ucsb_xrp import GridCell


def print_grid(grid, start, goal, path=None):
    # Show clearance, endpoints, and any validated route in grid coordinates.
    start_label = None if start is None else (start.column, start.row)
    goal_label = None if goal is None else (goal.column, goal.row)
    print("Grid cells: {} mm".format(grid.resolution_mm))
    print("Lower-left origin: ({}, {}) mm".format(grid.origin_x_mm, grid.origin_y_mm))
    print("Columns +x/right; rows +y/up")
    print("Start cell: {} blocked={}".format(start_label, start is None or grid.is_blocked(start)))
    print("Goal cell:  {} blocked={}".format(goal_label, goal is None or grid.is_blocked(goal)))
    print("S start; G goal; # blocked; o path; . free")
    print("S/G can cover #; see blocked states above")
    print("col tens " + "".join(str(col // 10) for col in range(grid.column_count)))
    print("col ones " + "".join(str(col % 10) for col in range(grid.column_count)))
    # Print high rows first so positive arena y appears upward on the page.
    path_cells = path.cells if path is not None else ()
    for row in range(grid.row_count - 1, -1, -1):
        symbols = []
        for column in range(grid.column_count):
            cell = GridCell(column, row)
            # Endpoint symbols take precedence; blocked status is printed above.
            if cell == start:
                symbol = "S"
            elif cell == goal:
                symbol = "G"
            elif grid.is_blocked(cell):
                symbol = "#"
            elif cell in path_cells:
                symbol = "o"
            else:
                symbol = "."
            symbols.append(symbol)
        print("row {:>2}   {}".format(row, "".join(symbols)))
