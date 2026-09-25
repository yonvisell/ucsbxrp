# Choose the least-cost order for a bounded set of required service stops.

from ucsb_xrp.student_api import VisitOrderPlannerBase

# VisitOrderPlanner — Select an order for a fixed set of required stops.
# Called by: Multi-stop route planning task.
# Methods: plan().
# Inputs: Directed cost table and integer start/required/finish node indices.
# State: Search data local to one plan() call.
# Returns: Tuple of node indices in visit order, or None.

class VisitOrderPlanner(VisitOrderPlannerBase):
    def plan(self, cost_table, start_index, required_indices, finish_index):
        # cost_table[a][b] is the directed cost from node a to b, or None when
        # that segment is unavailable. The indices identify the start, required
        # intermediate stops, and finish in that table.
        # Return a tuple containing start, every required index exactly once,
        # and finish. Return None when every complete order uses an unavailable
        # cost. Break equal-cost ties lexicographically.
        raise NotImplementedError("Complete VisitOrderPlanner.plan")
