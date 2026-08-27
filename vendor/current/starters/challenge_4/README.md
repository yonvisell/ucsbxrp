# Challenge 4: Mapped Route

## The challenge

Use the known arena in `world.json` to plan a connected route from the initial
pose to the destination through free grid cells, then follow that route. Route
planning finishes before robot motion begins. If no valid route connects the
endpoints, the program reports that result and does not construct or move a
robot.

`challenge.py` loads `ARENA_MAP`, `INITIAL_POSE`, and `DESTINATION` from the
project world and defines `GRID_RESOLUTION_MM` and `CLEARANCE_MM`. Use these
named task values. Do not copy the current arena bounds, obstacle geometry,
grid settings, start, or destination into the planner.

## Continue from Challenge 3

Open the completed Challenge 3 project and select **Continue to Challenge 4 ·
Mapped Route…**. The new project carries forward the five earlier component
files and their selections. `grid_planner.py` begins with the supplied planner
selected. The Challenge 3 project remains unchanged.

Project storage for new projects is configured in IDE **Settings**. Use **Open
project…** to reopen an existing project folder or **New project…** to create an
unrelated project from a template.

## What you implement

Implement `GridPlanner` in `grid_planner.py`.
`plan(grid, start, goal)` returns either:

- a `GridPath` that begins at `start`, ends at `goal`, contains only free
  cells, and moves horizontally or vertically between cells sharing an edge;
  or
- `None` when either endpoint is missing, outside the grid, blocked, or
  disconnected.

When `start` and `goal` are the same free cell, return a one-cell path. The
course accepts any valid route; it does not require a particular search method
or a minimum-length route. Planning data belongs to one `plan()` call, so the
class does not need to retain it between calls.

The student-owned component files in this project are `sensor_model.py`,
`wheel_speed_controller.py`, `differential_drive.py`, `odometry.py`,
`navigation_controller.py`, and `grid_planner.py`. Continue to correct the
carried-forward files if a full route exposes a problem. Your pair also
maintains the measured and tuned values in `robot_config.py`.

## Provided files and tools

- `world.json` defines the arena boundary, obstacles, initial pose, and
  destination.
- `challenge.py` loads that world and defines the grid resolution and
  clearance for the current task.
- `main.py` builds the occupancy grid, requests a path, converts a successful
  path to goals, and only then constructs the robot.
- `course_setup.py` selects all six supplied or student components. Change
  only the named `USE_STUDENT_*` flags after the matching checks pass.
- `component_checks.py` runs labeled direct, detour, one-cell, invalid, and
  disconnected planning examples without moving either robot.
- `OccupancyGrid` supplies `world_to_cell()`, `is_blocked()`, and
  `neighbors()`; `GridPath.to_goals()` converts a valid cell path to the
  world-coordinate goals used by navigation.

## How the program runs

1. `main.py` samples `ARENA_MAP` into an `OccupancyGrid` using the task's grid
   resolution and clearance.
2. It converts the initial pose and destination to grid cells.
3. `GridPlanner.plan()` searches the free cells.
4. A `None` result ends the program without robot motion.
5. A `GridPath` is converted to navigation goals at path turns and the final
   destination.
6. The carried-forward navigator and robot loop execute those goals, with
   `robot.stop()` in a `finally` block.

## Check the component

Select **Test components**. The checks call your planner with small software
grids; they do not start the virtual or physical robot. Each example identifies
the grid and endpoints, the required path property, and the observed result.

- `PASS` means the returned path satisfied the stated requirements.
- `NOT IMPLEMENTED` identifies an unfinished method.
- `FAIL` identifies an invalid path or incorrect `None` result.

Inspect direct, detour, one-cell, invalid-endpoint, and no-route cases. Fix
every unfinished or failing example, repeat **Test components**, and then set
`USE_STUDENT_GRID_PLANNER` to `True` in `course_setup.py`.

## Complete the challenge

1. Run the supplied planner on the virtual XRP. Inspect the world obstacle,
   reported path length, driven route, and final pose.
2. Select your planner. Verify that each path cell is free, each successive
   pair shares an edge, and the endpoints match the requested cells. **Test
   components** performs these path checks on small known grids.
3. Test a valid route, an unavailable endpoint, and a world with no connecting
   route as separate results.
4. Repeat a valid route with the carried-forward student components. Separate
   path validity from navigation and pose-estimation performance.
5. For the physical run, arrange the arena to match `world.json`, begin at the
   marked initial pose, and compare the planned route, estimated trajectory,
   and observed robot path.

After completing this challenge, select **Continue to Challenge 5 · Delivery
Mission…**. The new project carries forward all six component files and their
selections; the Challenge 4 project remains unchanged.
