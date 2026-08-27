"""Find a connected route through free grid cells that share a side."""

from ucsb_xrp.student_api import GridPlannerBase


class GridPlanner(GridPlannerBase):
    def plan(self, grid, start, goal):
        raise NotImplementedError("Complete GridPlanner.plan")
