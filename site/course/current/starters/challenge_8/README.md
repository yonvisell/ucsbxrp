# Challenge 8: Multi-Stop Route Planning

## The challenge

Start at the depot, visit three named service stops exactly once, and return to
the depot. Use map-derived directed grid-route costs to choose the visit order
before motion begins. Crossing a stop's grid cell incidentally is not service;
the estimated pose must reach the named endpoint within navigation tolerances
before that stop is recorded.

[`world.json`](world.json) defines the depot, stops, obstacles, and a
disconnected case. [`challenge.py`](challenge.py) loads those goals and defines
their indices, grid resolution, and clearance.

## Reuse work in another challenge

Choose **Reuse code in a new project…** in the IDE. Review **Preserve**,
**Merge robot calibration** (if shown), **Replace for the new task**, **Add**,
and **Leave in the source project** (if shown) before creating the separate
Project. The current Project remains unchanged.

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
`VisitOrderPlannerBase` is imported from `ucsb_xrp.student_api`; it defines the
method boundary without supplying the planning algorithm.

## Provided files and tools

- [`main.py`](main.py) uses the supplied `GridPlanner` to build deterministic
  pairwise shortest paths, so this challenge assesses `VisitOrderPlanner`
  independently of the selected project `GridPlanner`. It follows each selected
  path, replaces the final cell-center goal with the exact named endpoint, and
  checks the estimated pose before recording service.
- `OccupancyGrid`, the supplied `GridPlanner`, `GridPath`, and the selected
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
selected paths -> NavigationController -> verified endpoint arrivals
```

## Complete the challenge

1. Pass the VisitOrderPlanner component checks.
2. Run the supplied planner in both virtual worlds and confirm that the
   disconnected case never constructs or moves a robot.
3. In the reachable world, compare every candidate order's directed planned
   cost with the selected order and explain the deterministic tie rule.
4. Select your planner and execute the complete route with supplied supporting
   components before substituting other project implementations.
5. Confirm the recorded service sequence contains each required stop exactly
   once and that every record follows an estimated-pose endpoint arrival.
6. Report service-stop completion and planned route cost; use elapsed time as
   a secondary comparison.
