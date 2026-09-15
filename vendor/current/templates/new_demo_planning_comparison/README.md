# New Demo · BFS and A* Comparison

This motion-free program loads world.json and compares two readable searches
on the same occupancy grid. It never creates XRPBot or Robot. search.py exposes
frontier, predecessor and cost data. Both return GridPath or None plus expanded
cell count; no preferred tie path is required.

BFS uses a list plus a cursor. A* uses MicroPython's built-in heapq heappush and
heappop, Manhattan distance and unit edge costs. The unique tie counter prevents
GridCell comparisons when priorities match. Superseded queue entries are skipped.
The grid is limited to 1024 cells and the priority queue to 4096 entries.

Predict path length and explored regions. Run each reachable and unreachable
world case, compare path cost and expansions, then explain why a heuristic can
reduce search work without improving the optimal cost under the same model.
Grid clearance is supplied; do not inflate again. Use this exercise before
implementing GridPlanner, and keep it separate from motor/navigation debugging.
Compile and Run; results appear in Program output. No third-party Python package
or NumPy is required. Reference: MicroPython 1.28 heapq documentation.
