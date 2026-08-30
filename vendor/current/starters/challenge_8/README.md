# Challenge 8: Multi-Stop Route Planning

## The challenge

Start at the depot, visit three named service stops exactly once, and return to
the depot. Use map-derived directed grid-route costs to choose the visit order
before motion begins. Report each explicit service arrival, the order, total
planned cell transitions, completion, and final pose. Crossing a stop's grid
cell incidentally is not service; the robot services a stop only when the
planned segment ending at that named stop completes.

[`world.json`](world.json) defines the depot, stops, obstacles, and a
disconnected case. [`challenge.py`](challenge.py) loads those goals and defines
grid resolution, clearance, and the bounded navigation limit.

## Continue from Challenge 7

Open the completed Challenge 7 project and select **Continue to Challenge 8 ·
Multi-Stop Route Planning…**. The new project carries forward all eight earlier
component files and their selections. [`visit_order_planner.py`](visit_order_planner.py)
begins with the supplied `VisitOrderPlanner` selected. The Challenge 7 project
remains unchanged.

## What you implement

Implement `VisitOrderPlanner.plan()` in
[`visit_order_planner.py`](visit_order_planner.py). Inputs are:

- a square pairwise route-cost table; `None` means that pair is disconnected;
- a start index;
- the distinct required-stop indices; and
- a finish index, which may equal the start index.

Return the least-cost tuple containing start, every required stop exactly once,
and finish, or `None` when no complete order is reachable. Costs are directed:
the cost from A to B need not equal the cost from B to A. Use deterministic
lexicographic tie-breaking. The challenge contains three required stops, so a
clear exhaustive search is sufficient and makes correctness inspectable.

## Provided files and tools

- [`main.py`](main.py) uses the supplied `GridPlanner` to build deterministic
  pairwise shortest paths, so this challenge assesses `VisitOrderPlanner`
  independently of the carried student `GridPlanner`. It retains each selected
  path as a named segment and only then constructs the robot.
- `OccupancyGrid`, the supplied `GridPlanner`, `GridPath`, and the earlier
  navigation and robot components provide path and motion services.
- [`component_checks.py`](component_checks.py) varies node indices and finish
  nodes, uses asymmetric costs and missing directed paths, tests multiple equal
  optima, and rejects invalid duplicate stops without moving either robot.
- [`world.json`](world.json) provides **All stops reachable** and
  **Stop C disconnected**. The disconnected case must report no complete route
  without robot motion.

## How the program runs

```text
world map -> pairwise GridPaths -> route-cost table
route-cost table -> VisitOrderPlanner -> stop order
selected named segments -> NavigationController -> explicit service arrivals
```

## Complete the challenge

1. Pass the VisitOrderPlanner component checks.
2. Run the supplied planner in both virtual worlds and confirm that the
   disconnected case never constructs or moves a robot.
3. In the reachable world, compare every candidate order's directed planned
   cost with the selected order and explain the deterministic tie rule.
4. Select your planner and execute the complete route with reference earlier
   components before substituting carried-forward implementations.
5. Confirm the emitted service-arrival sequence contains each required stop
   exactly once; do not infer service from incidental path-cell traversal.
6. Score service-stop completion and planned route cost before elapsed time.
