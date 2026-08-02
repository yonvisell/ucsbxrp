"""Student implementation of shortest four-neighbor grid planning."""

from ucsb_xrp.student_api import GridPlannerBase


class GridPlanner(GridPlannerBase):
    def plan(self, grid, start, goal):
        raise NotImplementedError("Complete GridPlanner.plan")
