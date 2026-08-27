"""Find a shortest route through free horizontal and vertical grid neighbors."""

from ucsb_xrp.student_api import GridPlannerBase


class GridPlanner(GridPlannerBase):
    def plan(self, grid, start, goal):
        raise NotImplementedError("Complete GridPlanner.plan")
