# Challenge 4: Mapped Route

## Objective

Plan a route around the known obstacle in `world.json`, then make the XRP
follow that route to the destination. Planning happens before either robot is
started. If no route exists, the program reports that result without applying
motor commands.

`challenge.py` supplies the complete problem:

- `ARENA_MAP` contains the arena boundary and known obstacles;
- `INITIAL_POSE` and `DESTINATION` define the route endpoints;
- `GRID_RESOLUTION_MM` is the side length, in millimeters, of each square used
  for planning; and
- `CLEARANCE_MM` is the extra distance, in millimeters, kept between a planned
  cell center and a wall, obstacle, or arena boundary.

Use these names directly. Do not repeat their current numerical values in the
planner. Changing the resolution changes the number of planning cells, while
changing the clearance changes which cells are safe.

## Start this challenge

Open your Challenge 3 project and select **Start Challenge 4 · Mapped Route**.
The IDE creates a separate project and copies `sensor_model.py`,
`wheel_speed_controller.py`, `differential_drive.py`, `odometry.py`, and
`navigation_controller.py`. It retains `USE_STUDENT_SENSOR_MODEL`,
`USE_STUDENT_WHEEL_SPEED_CONTROLLER`, `USE_STUDENT_DIFFERENTIAL_DRIVE`,
`USE_STUDENT_ODOMETRY`, and `USE_STUDENT_NAVIGATION_CONTROLLER` from Challenge
3. Challenge 4 supplies a new
`grid_planner.py`; its `USE_STUDENT_GRID_PLANNER` flag begins as `False`. The
task, world, main program, checks, and configuration come from Challenge 4, and
the Challenge 3 folder remains unchanged.

## Student implementations

| File | Class | Responsibility |
| --- | --- | --- |
| `grid_planner.py` | `GridPlanner` | Return a connected route through free grid cells from the start cell to the goal cell. |
| `sensor_model.py` | `SensorModel` | Use the checked wheel-measurement implementation from Challenge 1. |
| `wheel_speed_controller.py` | `WheelSpeedController` | Use the checked wheel-speed controller from Challenge 1. |
| `differential_drive.py` | `DifferentialDrive` | Use the checked wheel-speed conversion from Challenge 2. |
| `odometry.py` | `Odometry` | Use the checked pose estimator from Challenge 2. |
| `navigation_controller.py` | `NavigationController` | Use the checked waypoint controller from Challenge 3. |

### Understand the supplied grid

`OccupancyGrid.from_arena(...)` divides the arena into square cells and marks
unsafe cells as blocked. The supplied grid methods perform the geometric work:

- `world_to_cell(x_mm, y_mm)` returns the cell containing a world position, or
  `None` when the position is outside the grid;
- `is_blocked(cell)` reports whether a cell is unavailable;
- `neighbors(cell)` returns the free cells that share a horizontal or vertical
  side with the given cell; and
- `cell_center(cell)` returns the world coordinates at the center of a cell.

A valid route moves horizontally or vertically between cells that share a side.
Diagonal moves are not available.

### Implement `GridPlanner.plan`

`plan(grid, start, goal)` returns a `GridPath` or `None`. Its required behavior
is:

1. Return `None` if either endpoint is `None` or blocked.
2. If `start == goal`, return a one-cell path.
3. A returned path begins with `start` and ends with `goal`.
4. Every path cell is free.
5. Each successive pair of cells shares one horizontal or vertical side. The
   supplied `neighbors(cell)` method can check this relationship.
6. Return `None` when no connected free-cell route exists.

How the implementation examines and stores cells is your design choice. The
component checks evaluate the returned route and unavailable-route cases, not
the names or internal organization used by your search.

## Supplied project files and services

| File or class | What it supplies |
| --- | --- |
| `world.json` | Arena boundary, obstacle, initial pose, and destination for the simulator and Monitor. |
| `challenge.py` | Named map, endpoint, grid-size, and clearance values for this challenge. |
| `main.py` | Builds the grid, asks for a path, converts the path to waypoint goals, and runs the route. |
| `robot_config.py` | Robot calibration and waypoint-controller settings. |
| `course_setup.py` | Selects the supplied or student version of each class independently. |
| `component_checks.py` | Runs short planning and component examples without starting a robot. |
| `OccupancyGrid` | Converts the map to cells and provides the cell operations used by the planner. |
| `GridPath.to_goals(...)` | Retains cells at turns and the destination, then converts their centers to waypoint goals. |
| `Robot` and `XRPBot` | Execute the selected route on the virtual or physical XRP. |

## Program flow

```text
world.json
    │
    ▼
ARENA_MAP ── GRID_RESOLUTION_MM + CLEARANCE_MM
    │
    ▼
OccupancyGrid ── start cell + goal cell
    │
    ▼
GridPlanner*
    ├── no route ──► print result; do not start robot
    │
    └── GridPath ──► waypoint goals ──► NavigationController*
                                             │
                                             ▼
                                      Robot ──► XRP

* student implementation
```

## Work sequence

1. Start Challenge 4 from the completed Challenge 3 project as described above.
   Use the supplied GridPlanner for the first virtual run. Inspect the obstacle,
   destination, and driven trajectory in the Monitor; inspect `path_cells` and
   `final_pose` in Program output.
2. Draw a small grid with a start, goal, and blocked cells. Mark one valid
   direct route and one valid route around a blocked cell; verify that every
   successive pair of marked cells shares a side.
3. Implement `GridPlanner.plan`. Select **Test components** and check a direct
   route, a detour, identical start and goal cells, blocked endpoints, and a
   destination separated from the start by blocked cells.
4. Set `USE_STUDENT_GRID_PLANNER = True` in `course_setup.py` and run the
   virtual challenge. Confirm that every pair of successive path cells are
   horizontally or vertically side-connected and that no path cell is blocked.
5. Select the earlier student classes one at a time and repeat the virtual run.
   A correct path and correct physical execution are separate results.
6. Arrange the physical obstacle, destination, and starting pose to match the
   selected world. Put the XRP on a stable stand with both wheels clear, select
   **Run**, verify wheel direction, then select **Stop** and verify that both
   wheels stop. Place the XRP at the marked start and run the route in the
   cleared arena.

`main.py` constructs `Robot` only after a path has been found, and its
`finally` block stops the robot after every attempted route.
