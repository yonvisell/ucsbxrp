# Find a connected route through free grid cells.

from ucsb_xrp import GridPath
from ucsb_xrp.student_api import GridPlannerBase

# GridPlanner — Find a connected route through free occupancy-grid cells.
# Called by: Mapped Route or Out-and-Back planning code.
# Methods: plan().
# Inputs: OccupancyGrid and start/goal GridCell values.
# State: Search state for the current plan call.
# Returns: GridPath or None when no path exists.

class GridPlanner(GridPlannerBase):
    # Planning state may remain local to each call to plan().

    def plan(self, grid, start, goal):
        # Return a GridPath from start to goal, or None when no route exists.
        # start and goal are GridCell(column, row) values or None if a
        # requested location could not be placed in the grid. Return None for
        # missing or blocked endpoints or when no route exists. A valid path includes
        # both endpoints, stays in free cells, and crosses one horizontal or
        # vertical cell edge at each step.
        raise NotImplementedError("Complete GridPlanner.plan")
