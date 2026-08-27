# Challenge 4: Mapped Route

## Objective

Use the known arena in `world.json` to produce a connected route through free
grid cells from the initial pose to the destination, then follow it. Planning finishes before
either robot starts. If the endpoints cannot be connected, the correct result
is `None` and no motor command is applied.

`challenge.py` loads `ARENA_MAP`, `INITIAL_POSE`, and `DESTINATION` from the
world and names `GRID_RESOLUTION_MM` and `CLEARANCE_MM`. Do not duplicate the
arena bounds, obstacle rectangles, start, or destination in the planner.

## Continue from the previous challenge

Open Challenge 3 and select **Create Challenge 4 · Mapped Route project**. The
IDE creates a separate project and carries forward `sensor_model.py`,
`wheel_speed_controller.py`, `differential_drive.py`, `odometry.py`, and
`navigation_controller.py`, and keeps whether each student version is selected.
The new
`grid_planner.py` begins with the supplied version selected. The Challenge 3
folder remains unchanged.

## What you implement

Your new work is `GridPlanner`; sensing, wheel control, drive, odometry, and
navigation are carried forward.

| Class | Responsibility, state, and use |
| --- | --- |
| `GridPlanner` in `grid_planner.py` | `plan(grid, start, goal)` returns a `GridPath` joining the endpoints through free cells, or `None`. Planning data belongs to one call; the class need not retain route state between calls. `main.py` converts a returned path into navigation goals. |
| `SensorModel`, `WheelSpeedController`, `DifferentialDrive`, `Odometry`, and `NavigationController` | Carried forward in their literal component files and used only after a path is available. |

`OccupancyGrid.from_arena(ARENA_MAP, GRID_RESOLUTION_MM, CLEARANCE_MM)` samples
the known world. `world_to_cell()` locates the endpoints, `is_blocked()`
reports unavailable cells, and `neighbors()` returns free cells sharing a
horizontal or vertical side. A valid `GridPath` begins at `start`, ends at
`goal`, contains only free cells, and moves between cells sharing a horizontal
or vertical side. A
missing, blocked, outside-grid, or disconnected endpoint produces `None`.
When start and goal are the same free cell, the path contains that one cell.
Any route satisfying these public results is accepted.

## Provided files and tools

| File or service | Role |
| --- | --- |
| `world.json` | Arena boundary, obstacle, initial pose, and destination. |
| `challenge.py` | Loads the world values and names grid resolution and clearance. |
| `main.py` | Builds the grid, requests a path, converts it to goals, and starts the robot only when a path exists. |
| `robot_config.py` | Robot calibration and navigation settings. |
| `course_setup.py` | Selects all six components independently. |
| `component_checks.py` | Reports expected and observed path properties for direct, detour, invalid, and disconnected cases. |
| `GridPath.to_goals(...)` | Converts the path's turns and destination into world-coordinate goals. |
| `Robot` and `XRPBot` | Execute the route after planning succeeds. |

## How the program runs

The project loads one world, samples it into an occupancy grid, and asks
`GridPlanner` for a path. `None` ends the program without constructing a
robot. A returned path becomes navigation goals; the carried-forward navigator
and robot loop then execute those goals.

## Complete the challenge

1. Run the supplied planner on the virtual XRP. Inspect the world obstacle,
   `path_cells`, driven route, and final pose.
2. Implement `GridPlanner.plan` to satisfy the path results above. **Test
   components** checks direct, detour, one-cell, invalid-endpoint, and no-route
   cases without requiring a particular search method.
3. Select the student planner and verify that every returned cell is free and
   every successive pair shares a side.
4. Repeat with carried-forward student components. Treat path validity and
   physical route following as separate results.
5. Before the physical route, verify wheel direction with the wheels clear and
   use Stop. Then arrange the arena to match `world.json` and run from the
   marked initial pose.

`main.py` constructs `Robot` only after a path is found and stops it in
`finally` after every attempted route.
