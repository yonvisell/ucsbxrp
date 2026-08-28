# Challenge 4: Mapped Route

## The challenge

Use the known arena in [`world.json`](world.json) to plan a connected route from
the initial pose to the destination through free grid cells, then follow that
route. Route planning finishes before robot motion begins. If no valid route
connects the endpoints, the program reports that result and does not construct
or move a robot.

[`challenge.py`](challenge.py) loads `ARENA_MAP`, `INITIAL_POSE`, and
`DESTINATION` from the project world and defines `GRID_RESOLUTION_MM` and
`CLEARANCE_MM`. Use these named task values. Do not copy the current arena
bounds, obstacle geometry, grid settings, start, or destination into the
planner.

`CLEARANCE_MM` is the required distance from a candidate cell center to the
arena boundary and blocked geometry. `OccupancyGrid` applies it while sampling
the arena; it is not the grid spacing or the distance between navigation goals.

## Project worlds

The project contains three named cases. Select each case from the Monitor's
**World** menu before a virtual run:

- `mapped-route` has available start and destination cells connected by free
  cells around the center block. A valid path allows the robot to follow the
  resulting route.
- `destination-blocked` places the destination inside the center block, so the
  destination cell is unavailable for a path.
- `no-connection` keeps both endpoint cells available, but a dividing wall
  leaves no connected route between them.

The last two cases must result in no motion. Whether the destination is
unavailable or no route connects the endpoints, the program reports the result
without constructing or moving a robot.

## Continue from Challenge 3

Open the completed Challenge 3 project and select **Continue to Challenge 4 ·
Mapped Route…**. The new project carries forward the five earlier component
files and their selections. [`grid_planner.py`](grid_planner.py) begins with the
supplied planner selected. The Challenge 3 project remains unchanged.

## What you implement

Implement `GridPlanner` in [`grid_planner.py`](grid_planner.py).
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

## Project modules

Each file has one responsibility:

| File                                                     | Responsibility                                                                                                                                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`sensor_model.py`](sensor_model.py)                     | Converts raw sample time, encoder counts, range, and button state into wheel distances, wheel-speed estimates based on recent encoder samples, and other `Measurements`. |
| [`wheel_speed_controller.py`](wheel_speed_controller.py) | Uses requested and measured wheel speeds to calculate bounded left and right motor commands.                                                                             |
| [`differential_drive.py`](differential_drive.py)         | Calculates left and right target wheel speeds from requested forward speed and yaw rate.                                                                                 |
| [`odometry.py`](odometry.py)                             | Updates the robot's estimated `Pose` from the latest left and right wheel-distance increments.                                                                           |
| [`navigation_controller.py`](navigation_controller.py)   | Uses the current pose and active route goal to select the next `MotionCommand`.                                                                                          |
| [`grid_planner.py`](grid_planner.py)                     | Finds a connected sequence of free grid cells between the requested start and goal.                                                                                      |
| [`robot_config.py`](robot_config.py)                     | Contains the measured and tuned values for your robot. The supplied/student switches do not replace this file.                                                           |

Continue to correct carried-forward files if a complete route exposes a
problem. [`course_setup.py`](course_setup.py) contains one `USE_STUDENT_*` flag
for each component class. `False` runs the supplied implementation; `True` runs
the class in the named student file.
**Test components always checks the student files**, regardless of which
implementations are selected for a complete robot run.

## Provided files and tools

- [`world.json`](world.json) defines the arena boundary, obstacles, initial pose, and
  destination.
- [`challenge.py`](challenge.py) loads that world and defines the grid resolution and
  clearance for the current task.
- [`main.py`](main.py) builds the occupancy grid, requests a path, converts a
  successful path to goals, and only then constructs the robot.
- [`course_setup.py`](course_setup.py) constructs each selected component and assembles the
  `Robot`, navigator, and planner. Change only the named `USE_STUDENT_*` flags
  after the matching checks pass.
- [`component_checks.py`](component_checks.py) runs labeled direct, detour,
  one-cell, invalid, and disconnected planning examples without moving either
  robot.
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
