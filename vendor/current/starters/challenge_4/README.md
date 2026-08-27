# Challenge 4: Mapped Route

Plan a route around the known obstacle in `world.json`, then make the XRP
follow that route to the destination. Planning happens before either robot is
started. If no route exists, the program reports that result without applying
motor commands.

`challenge.py` supplies the complete problem:

- `ARENA_MAP` contains the arena boundary and known obstacles;
- `INITIAL_POSE` and `DESTINATION` define the route endpoints;
- `GRID_RESOLUTION_MM` sets the side length of each square planning cell; and
- `CLEARANCE_MM` sets the extra space required between a planned cell center
  and a wall, obstacle, or arena boundary.

Use these names directly. Do not repeat their current numerical values in the
planner. Changing the resolution changes the number of planning cells, while
changing the clearance changes which cells are safe.

## Start this challenge

Open your Challenge 3 project and select **Start Challenge 4 · Mapped Route**.
The IDE creates a separate project. Your new work is `grid_planner.py`; the new
project begins with the supplied GridPlanner selected. The IDE carries forward
your five earlier component files and keeps whether each student version is
selected. Challenge 4 provides its own task, world, main program, checks, and
configuration. Your Challenge 3 folder remains unchanged.

## What you implement

| File | Class | What it does |
| --- | --- | --- |
| `grid_planner.py` | `GridPlanner` | Return a connected route through free grid cells from the start cell to the goal cell. |
| `sensor_model.py` | `SensorModel` | Carried forward from Challenge 3; converts raw encoder data into wheel measurements. |
| `wheel_speed_controller.py` | `WheelSpeedController` | Carried forward from Challenge 3; converts requested and measured wheel speeds into motor commands. |
| `differential_drive.py` | `DifferentialDrive` | Carried forward from Challenge 3; converts robot motion requests into wheel-speed requests. |
| `odometry.py` | `Odometry` | Carried forward from Challenge 3; estimates pose from measured wheel travel. |
| `navigation_controller.py` | `NavigationController` | Carried forward from Challenge 3; converts each route goal and current pose into a motion request. |

### Understand the supplied grid

`OccupancyGrid.from_arena(...)` divides the arena into square cells and marks
cells too close to a boundary or obstacle as blocked. The provided grid methods
perform the coordinate and cell calculations:

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

1. Return `None` if either the start or goal is `None` or blocked.
2. If `start == goal`, return a one-cell path.
3. A returned path begins with `start` and ends with `goal`.
4. Every path cell is free.
5. Each successive pair of cells shares one horizontal or vertical side. The
   supplied `neighbors(cell)` method can check this relationship.
6. Return `None` when no connected free-cell route exists.

How the implementation examines and stores cells is your design choice. The
component checks evaluate the returned route and cases where no route exists,
not the names or internal organization used by your search.

## Provided files and tools

| File or tool | What it provides |
| --- | --- |
| `world.json` | Arena boundary, obstacle, initial pose, and destination for the simulator and Monitor. |
| `challenge.py` | Named map, start, destination, grid-size, and clearance values for this challenge. |
| `main.py` | Builds the grid, asks for a path, converts the path to waypoint goals, and runs the route. |
| `robot_config.py` | Robot calibration and waypoint-controller settings. |
| `course_setup.py` | Selects the supplied or student version of each class independently. |
| `component_checks.py` | Runs the provided component examples without starting the virtual or physical robot. Results appear in Program output as PASS, NOT IMPLEMENTED, or FAIL. |
| `OccupancyGrid` | Converts the map to cells and provides the cell operations used by the planner. |
| `GridPath.to_goals(...)` | Keeps cells where the path turns and at the destination, then converts their centers to waypoint goals. |
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

## Complete the challenge

1. Start Challenge 4 from the completed Challenge 3 project as described above.
   Use the supplied GridPlanner for the first virtual run. Your carried-forward
   components keep their prior selections. Inspect the obstacle, destination,
   and driven trajectory in the Monitor; inspect `path_cells` and `final_pose`
   in Program output.
2. Draw a small grid with a start, goal, and blocked cells. Mark one valid
   direct route and one valid route around a blocked cell; verify that every
   successive pair of marked cells shares a side.
3. Implement `GridPlanner.plan`. Select **Test components** and check a direct
   route, a detour, identical start and goal cells, blocked endpoints, and a
   destination separated from the start by blocked cells.
4. Select the student GridPlanner in `course_setup.py` and run the virtual
   challenge. Confirm that every successive pair of path cells shares a
   horizontal or vertical side and that no path cell is blocked.
5. Select the carried-forward student classes one at a time and repeat the
   virtual run. A correct path and correct route following are separate
   results.
6. Arrange the physical obstacle, destination, and starting pose to match the
   selected world. Put the XRP on a stable stand with both wheels clear, select
   **Run**, verify wheel direction, then select **Stop** and verify that both
   wheels stop. Place the XRP at the marked start and run the route in the
   cleared arena.

`main.py` constructs `Robot` only after a path has been found, and its
`finally` block stops the robot after every attempted route.
