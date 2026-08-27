"""Find a connected route through free grid cells that share a side."""

from ucsb_xrp import GridPath
from ucsb_xrp.student_api import GridPlannerBase


class GridPlanner(GridPlannerBase):
    """Return a connected free-cell route, or None when none exists."""

    def plan(self, grid, start, goal):
        """Return GridPath from start to goal, or None when no route exists.

        start and goal are GridCell values or None. A returned path includes
        both endpoints, contains only free cells, and moves horizontally or
        vertically between cells that share a side. A minimum-length route is
        not required. Search data may remain local to this call.
        """
        raise NotImplementedError("Complete GridPlanner.plan")
