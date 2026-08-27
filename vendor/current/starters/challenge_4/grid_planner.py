"""Find a shortest route through free horizontal and vertical grid neighbors."""

from ucsb_xrp.student_api import GridPlannerBase


class GridPlanner(GridPlannerBase):
    def plan(self, grid, start, goal):
        # Examine cells by distance, record where each came from, then trace back.
        raise NotImplementedError("Complete GridPlanner.plan")
