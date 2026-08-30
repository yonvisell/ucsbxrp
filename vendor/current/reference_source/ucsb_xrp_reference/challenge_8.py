"""Supplied Challenge 8 multi-stop visit-order planner."""

from math import isfinite


class VisitOrderPlannerBase:
    """Contract for a bounded, directed visit-order optimization."""

    __slots__ = ()

    def plan(self, cost_table, start_index, required_indices, finish_index):
        """Return the least-cost complete route, or None when none exists.

        ``cost_table[a][b]`` is the directed cost from node ``a`` to node
        ``b``; ``None`` marks an unavailable directed segment. The result
        starts at ``start_index``, contains each required index exactly once,
        and ends at ``finish_index``. Equal-cost routes are resolved by
        lexicographic tuple order.
        """
        raise NotImplementedError


class VisitOrderPlanner(VisitOrderPlannerBase):
    """Choose the least-cost order for a bounded set of required stops."""

    __slots__ = ()

    @staticmethod
    def _permutations(values):
        if not values:
            return ((),)
        result = []
        for index in range(len(values)):
            selected = values[index]
            remaining = values[:index] + values[index + 1 :]
            for suffix in VisitOrderPlanner._permutations(remaining):
                result.append((selected,) + suffix)
        return tuple(result)

    @staticmethod
    def _index(value, size, name):
        if isinstance(value, bool) or not isinstance(value, int):
            raise TypeError(name + " must be an integer")
        if value < 0 or value >= size:
            raise ValueError(name + " is outside the cost table")
        return value

    def plan(self, cost_table, start_index, required_indices, finish_index):
        if not isinstance(cost_table, (tuple, list)) or not cost_table:
            raise TypeError("cost_table must be a nonempty tuple or list")
        size = len(cost_table)
        rows = []
        for row in cost_table:
            if not isinstance(row, (tuple, list)) or len(row) != size:
                raise ValueError("cost_table must be square")
            normalized = []
            for value in row:
                if value is None:
                    normalized.append(None)
                elif isinstance(value, bool) or not isinstance(value, (int, float)):
                    raise TypeError("route costs must be numeric or None")
                elif not isfinite(value) or value < 0.0:
                    raise ValueError("route costs must be finite and nonnegative")
                else:
                    normalized.append(float(value))
            rows.append(tuple(normalized))
        rows = tuple(rows)

        start = self._index(start_index, size, "start_index")
        finish = self._index(finish_index, size, "finish_index")
        if not isinstance(required_indices, (tuple, list)):
            raise TypeError("required_indices must be a tuple or list")
        required = tuple(
            self._index(value, size, "required index") for value in required_indices
        )
        if len(set(required)) != len(required):
            raise ValueError("required_indices must not contain duplicates")
        if start in required or finish in required:
            raise ValueError("required_indices must exclude start and finish")

        best_route = None
        best_cost = None
        for order in self._permutations(required):
            route = (start,) + order + (finish,)
            total = 0.0
            reachable = True
            for index in range(len(route) - 1):
                cost = rows[route[index]][route[index + 1]]
                if cost is None:
                    reachable = False
                    break
                total += cost
            if not reachable:
                continue
            if (
                best_cost is None
                or total < best_cost
                or (total == best_cost and route < best_route)
            ):
                best_route = route
                best_cost = total
        return best_route
