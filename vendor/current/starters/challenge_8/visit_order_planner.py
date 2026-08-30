# Choose the least-cost order for a bounded set of required service stops.

from ucsb_xrp_reference.challenge_8 import VisitOrderPlannerBase


class VisitOrderPlanner(VisitOrderPlannerBase):
    def plan(self, cost_table, start_index, required_indices, finish_index):
        # Return a tuple containing start, every required index exactly once,
        # and finish. Return None when every complete order uses an unavailable
        # cost. Break equal-cost ties lexicographically.
        raise NotImplementedError("Complete VisitOrderPlanner.plan")
