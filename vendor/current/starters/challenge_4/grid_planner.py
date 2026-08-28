# Find a connected route through free grid cells.

from ucsb_xrp import GridPath
from ucsb_xrp.student_api import GridPlannerBase


class GridPlanner(GridPlannerBase):
    # Planning state may remain local to each call to plan().

    def plan(self, grid, start, goal):
        # Return a GridPath from start to goal, or None when no route exists.
        # start and goal are GridCell values or None. A valid path includes
        # both endpoints, contains only free cells, and moves across one
        # horizontal or vertical cell edge at each step.
        raise NotImplementedError("Complete GridPlanner.plan")
