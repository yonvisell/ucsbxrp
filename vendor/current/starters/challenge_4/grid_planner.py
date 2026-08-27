"""Find a connected route through free grid cells that share a side."""

from ucsb_xrp.student_api import GridPlannerBase


class GridPlanner(GridPlannerBase):
    """Return a connected free-cell route, or None when none exists."""

    def plan(self, grid, start, goal):
        # Validate the endpoints, search free cells, and reconstruct start to goal.
        raise NotImplementedError("Complete GridPlanner.plan")
