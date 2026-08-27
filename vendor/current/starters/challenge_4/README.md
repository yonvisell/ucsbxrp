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

## Student implementations

| File | Class | Responsibility |
| --- | --- | --- |
| `grid_planner.py` | `GridPlanner` | Find a shortest route through free grid cells from the start cell to the goal cell. |
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
- `neighbors(cell)` returns the free cells immediately to the right, above,
  left, and below; and
- `cell_center(cell)` returns the world coordinates at the center of a cell.

A four-neighbor route moves only horizontally or vertically between adjacent
cells. Every such move has the same length.

### Implement `GridPlanner.plan`

`plan(grid, start, goal)` must return a `GridPath` whose first cell is `start`
and whose last cell is `goal`. Use this procedure:

1. Return `None` if either endpoint is `None` or blocked.
2. If `start == goal`, return a one-cell path.
3. Keep a list of cells still to examine. Begin with `start`.
4. Examine cells in increasing number of moves from `start`. For each free
   neighbor not seen before, record the cell from which it was reached and add
   it to the list.
5. When `goal` is reached, follow the recorded cells backward to `start`,
   reverse that sequence, and construct a `GridPath`.
6. Return `None` if every reachable cell has been examined without reaching
   `goal`.

Recording each cell only once makes the first route found to the goal a
shortest route. When two shortest routes exist, either is acceptable.

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

1. Keep all `USE_STUDENT_...` flags `False` and run the supplied project on the
   virtual XRP. Inspect the obstacle, destination, and driven trajectory in the
   Monitor; inspect `path_cells` and `final_pose` in Program output.
2. On paper or a small hand-drawn grid, apply the six planning steps above to a
   direct route and a route that must go around one blocked cell.
3. Implement `GridPlanner.plan`. Select **Test components** and check a direct
   route, a detour, identical start and goal cells, blocked endpoints, and a
   destination separated from the start by blocked cells.
4. Set `USE_STUDENT_GRID_PLANNER = True` in `course_setup.py` and run the
   virtual challenge. Confirm that every pair of successive path cells are
   neighbors and that no path cell is blocked.
5. Select the earlier student classes one at a time and repeat the virtual run.
   A correct path and correct physical execution are separate results.
6. Run on the physical XRP only after the physical obstacle, destination, and
   starting pose match the selected world. Keep the robot elevated for the
   initial wheel-direction check, then use the bounded course run procedure.

`main.py` constructs `Robot` only after a path has been found, and its
`finally` block stops the robot after every attempted route.
