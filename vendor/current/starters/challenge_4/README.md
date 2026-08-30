# Challenge 4: Mapped Route

## The challenge

Plan a route from the initial pose to the destination without entering known
obstacles, then follow it. Planning finishes before motion begins. When the
destination cannot be reached, report that result and keep the robot stopped.

The current task is defined in two files:

- [`world.json`](world.json) defines the arena, obstacles, initial pose, and
  destination.
- [`challenge.py`](challenge.py) loads `ARENA_MAP`, `INITIAL_POSE`, and
  `DESTINATION`, and defines `GRID_RESOLUTION_MM`, `CLEARANCE_MM`, and the
  visible `MAXIMUM_NAVIGATION_STEPS` mission limit.

Use these names. Do not copy the current geometry or grid values into your
planner. `CLEARANCE_MM` is the required distance from a candidate cell center
to blocked geometry or the arena boundary; it is not the grid spacing. The
virtual value includes the 85 mm XRP collision radius and a 10 mm planning
margin. For a physical course, confirm the robot footprint and tracking margin
before motion rather than treating the virtual value as a calibration.

## Project worlds

Select each case from the Monitor **World** menu before a virtual run:

- `mapped-route`: start and destination are connected around the center block.
- `destination-blocked`: the destination cell is unavailable.
- `no-connection`: both endpoints are available, but a wall separates them.

The last two cases must end without robot motion.

## Continue from Challenge 3

Open the completed Challenge 3 project and select **Continue to Challenge 4 ·
Mapped Route…**. The new project carries forward the five earlier component
files and their selections. [`grid_planner.py`](grid_planner.py) begins with
the supplied `GridPlanner` selected. The Challenge 3 project remains
unchanged.

## What you implement

Implement `GridPlanner.plan(grid, start, goal)` in
[`grid_planner.py`](grid_planner.py). Return:

- a `GridPath` that starts at `start`, ends at `goal`, contains only free cells,
  and moves between cells that share a horizontal or vertical side; or
- `None` when an endpoint is unavailable or blocked, or when no connected route
  exists.

If `start` and `goal` are the same free cell, return a one-cell path. Any route
that satisfies these conditions is accepted. The class does not need to retain
information between `plan()` calls.

## Project modules

| File | Role |
| --- | --- |
| [`sensor_model.py`](sensor_model.py) | Converts encoder samples to wheel travel and wheel-speed estimates based on recent encoder samples. |
| [`wheel_speed_controller.py`](wheel_speed_controller.py) | Produces motor commands within the configured limits from wheel-speed error. |
| [`differential_drive.py`](differential_drive.py) | Produces target wheel speeds from requested robot motion. |
| [`odometry.py`](odometry.py) | Updates the estimated `Pose` from measured wheel travel. |
| [`navigation_controller.py`](navigation_controller.py) | Selects the next `MotionCommand` from the active route goal and pose. |
| [`grid_planner.py`](grid_planner.py) | Connects the requested start and goal through free grid cells. |
| [`robot_config.py`](robot_config.py) | Stores robot calibration and navigation settings. |
| [`course_setup.py`](course_setup.py) | Selects the supplied class or the class defined in each named component file. |

**Test components always loads the classes from the six component project
files**, regardless of which classes are selected for a complete robot run.

## Provided files and tools

- [`main.py`](main.py) constructs the grid, requests and validates a path,
  converts a successful path to navigation goals, and only then constructs the
  robot. It reports each route-goal arrival, rejects premature completion, and
  stops when the stated navigation-step limit is reached.
- [`component_checks.py`](component_checks.py) checks direct, detour, one-cell,
  invalid-endpoint, and disconnected cases without starting a robot.
- `OccupancyGrid` supplies coordinate conversion, blocked-cell tests, and the
  free cells sharing a side with a given cell.
- `GridPath.to_goals()` converts the cell path into the world-coordinate goals
  used by the carried-forward `NavigationController`.

## How the program runs

```text
ARENA_MAP -> OccupancyGrid -> GridPlanner -> GridPath
GridPath  -> navigation goals -> NavigationController -> Robot motion
```

A `None` path stops after planning. A valid path is converted to navigation
goals at turns and at the destination.

## Check the component

Select **Test components**. The checks call `GridPlanner.plan()` from
`grid_planner.py` with small software grids and do not move either robot. Read
`USE`, `INPUT`, and `EXPECT` before each result:

- `PASS` means the returned path met the stated requirements.
- `NOT IMPLEMENTED` means `plan()` still needs to be written.
- `FAIL` means the method ran but returned an invalid path or incorrect `None`.

Fix every unfinished or failing result, repeat **Test components**, and then
set `USE_STUDENT_GRID_PLANNER` to `True` in `course_setup.py`.

## Complete the challenge

1. Run the supplied planner in each virtual world and compare the obstacle
   layout, reported result, driven route, and final pose.
2. Select the `GridPlanner` defined in `grid_planner.py`. For every returned
   path, verify free cells, side-sharing steps, and the requested endpoints.
   The program performs the same check before it permits motion.
3. Confirm separately that an unavailable endpoint and a disconnected map
   return `None` without motion.
4. Repeat the valid route with the classes from all five carried-forward
   component project files selected; assess path validity separately from
   navigation and pose-estimation performance.
5. For the physical run, match the arena to `world.json`, start at the marked
   pose, and compare the planned route, estimated trajectory, and observed path.

After completing this challenge, select **Continue to Challenge 5 · Delivery
Mission…**. The new project carries forward all six component files and their
selections; the Challenge 4 project remains unchanged.
