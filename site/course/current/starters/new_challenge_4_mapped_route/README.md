# Challenge 4 · Mapped Route

## Task

Plan a connected route around known obstacles, then have the Virtual XRP follow it. Account for the robot's footprint and path-following error when assessing clearance.

![Start, destination, and central obstacle in the reachable map.](course-assets/mapped-route.svg)

*Figure. The blue S dot and arrow show the starting axle pose and heading; the orange G dot marks the destination. The dark filled rectangle is the known central obstacle at its map dimensions. No grid cells or computed route are shown; `world.json` supplies the geometry in millimeters.*

## 1. Inspect the map and predict outcomes

1. **Predict each world.** Inspect **Mapped route**, **Destination blocked**, and **No connecting route** in `world.json`. Mark start, destination, obstacles, and boundary; predict whether a free-cell route exists in each.
2. **Inspect grid settings.** Determine which locations the robot can plan through. In `challenge.py`, `GRID_RESOLUTION_MM` sets cell width and `CLEARANCE_MM` expands obstacles and boundaries for robot size and tracking margin. `main.py` passes them and `ARENA_MAP` to supplied `OccupancyGrid.from_arena()`. The 100 mm/cell and 150 mm starting values are adjustable settings. Predict how a change could alter free cells.
3. **Read the grid.** With `EXECUTE_ROUTE = False` in `challenge.py`, run `main.py`. Compare the Program-output grid with the Monitor world. Explain a location that appears clear geometrically but is blocked after sampling and clearance.

## 2. Implement and check grid search

1. **Implement search.** Find a connected sequence of free cells. In `grid_planner.py`, implement `GridPlanner.plan(grid, start, goal)`. Return a `GridPath` that includes both free endpoints and crosses one horizontal or vertical cell edge per step. Return `None` for a `None` or blocked endpoint or no connecting route. Choose and explain your search and path-recovery method; shortest path is not required.
2. **Check cases.** Test how the search handles endpoints and disconnection before motion. Use **Test functions** (`component_checks.py`) without driving. Check a free start equal to goal, a blocked endpoint, and a disconnected map. `grid.is_blocked(cell)` and `grid.neighbors(cell)` expose the same grid rules as the route check.
3. **Compare worlds.** Set `USE_STUDENT_GRID_PLANNER = True` in `course_setup.py` after checking the planner. Reuse the completed component files and measured robot settings from Waypoint Courier, and set their matching flags to `True`; `False` selects supplied versions. With **Virtual XRP** selected and `EXECUTE_ROUTE = False`, choose each named case in **Monitor → World** and run it. Compare predictions with Program output and inspect each returned path's endpoints, free cells, and steps. `main.py` reports `valid_path`, `no_path`, or `invalid_path`.

## 3. Run and assess the route

1. **Record motion settings.** The **Cruise speed** (mm/s) and **Turn rate** (rad/s) Monitor controls in `live_variables.py` start at 150 mm/s and 0.8 rad/s. `apply_navigation_controls()` in `robot_config.py` applies changes after the next robot sample; approach speed remains 80% of selected cruise speed. Slider endpoints are configured control limits. Record values used; `robot_config.py` also holds slowing distance and pose tolerances.
2. **Follow the virtual path.** For **Mapped route**, set `EXECUTE_ROUTE = True` in `challenge.py` and run the Virtual XRP. Supplied `main.py` converts the checked `GridPath` into goals for the selected `NavigationController`. Compare the printed path with the trajectory, obstacle clearance, contact, and final pose. If the robot contacts an obstacle or misses the destination, compare the planned clearance with its path and adjust clearance or navigation settings based on the discrepancy.
3. **Measure a physical route if performed.** A physical trial is optional. First compare floor geometry and robot dimensions with `world.json`. Record closest obstacle gap and measurement method, contact, and final axle-midpoint pose. Distinguish measurements from estimated pose and virtual trajectory.

## Your report

Submit one report per pair with both names, selected components, worlds, grid settings, and navigation settings. Label virtual observations and any physical measurements.

1. **Preliminary lab work:** show the predicted outcome for each world, your search and path-recovery approach, component-check evidence, and why the selected cell size and clearance are appropriate.
2. **Challenge data:** show the reachable world's grid and path, tabulate predicted and returned outcomes for all three worlds, and include the planned path and virtual trajectory with relevant settings.
3. **Challenge performance:** report path validity, destination arrival, obstacle contact, and clearance observations. Include measured gap and final pose if a physical trial was performed.
4. **Reflection:** explain any difference between a valid cell path and the robot's motion using evidence from the map, path, and trajectory. Identify a justified adjustment and how to test it.

## Project files

<strong class="student-file">Blue *</strong>: code to implement. <strong class="config-file">Amber †</strong>: settings to adjust. <span class="supplied-file">Gray S</span>: code provided or completed in an earlier challenge. `main.py` is supplied; controlled experiments may edit it.

<div class="project-file-table">

| File | What it does |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Runs search, prints the grid and path, and optionally drives the route. |
| <span class="supplied-file"><code>route_validation.py</code> S</span> | Checks path traversability and final estimated-pose arrival. |
| <strong class="student-file"><code>grid_planner.py</code> *</strong> | Searches the occupancy grid for a connected free-cell path. |
| <span class="supplied-file"><code>sensor_model.py</code> S</span> | Converts encoder readings into wheel travel and speed; also contains range estimation. |
| <span class="supplied-file"><code>wheel_speed_controller.py</code> S</span> | Calculates motor commands from wheel-speed targets and measurements. |
| <span class="supplied-file"><code>differential_drive.py</code> S</span> | Converts forward speed and turn rate into wheel-speed targets. |
| <span class="supplied-file"><code>odometry.py</code> S</span> | Accumulates wheel increments to estimate position and heading. |
| <span class="supplied-file"><code>navigation_controller.py</code> S</span> | Uses estimated pose to reach ordered destinations. |
| <strong class="config-file"><code>robot_config.py</code> †</strong> | Holds robot calibration and navigation settings. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | Loads geometry and sets grid resolution, clearance, memory limit, and motion selection. |
| <strong class="config-file"><code>course_setup.py</code> †</strong> | Selects component implementations. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Runs component input/output examples without driving. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | Declares Monitor motion controls and publishes navigation progress. |
| <span class="supplied-file"><code>grid_display.py</code> S</span> | Prints the grid, endpoints, and path. |
| <strong class="config-file"><code>world.json</code> †</strong> | Defines the selectable worlds, geometry, start pose, and destination. |

</div>

## Parameters and functions

These are the settings and interfaces used above; see the API reference for full type and error behavior.

### Parameters

| Setting | Source and units | Effect |
| --- | --- | --- |
| `GRID_RESOLUTION_MM` | `challenge.py`; mm/cell | Cell width and height in the sampled map. |
| `CLEARANCE_MM` | `challenge.py`; mm | Expands obstacles and arena edges for robot footprint and tracking margin. |
| `MAXIMUM_GRID_CELLS` | `challenge.py`; cells | Memory/work limit checked by `main.py` before planning. |
| `EXECUTE_ROUTE` | `challenge.py`; Boolean | `False` plans without motion; `True` follows a valid path. |
| Cruise speed, turn rate | Monitor controls in `live_variables.py`; mm/s, rad/s | Route motion settings, applied by `robot_config.py` after the next sample. |
| Approach speed, slowing distance, pose tolerances | `robot_config.py`; mm/s, mm, rad | Near-goal speed, slowing point, and accepted pose errors. |

### Functions and methods

| Function or method | Input | Return or effect |
| --- | --- | --- |
| `OccupancyGrid.from_arena(arena, resolution_mm, clearance_mm)` | `ArenaMap`, resolution and clearance in mm | Sampled free/blocked grid. |
| `GridPlanner.plan(grid, start, goal)` | `OccupancyGrid`, two `GridCell` endpoints or `None` | Connected `GridPath` including endpoints, or `None`. |
| `GridPath.to_goals(grid)` | Grid used for planning | World-coordinate navigation goals at turns and destination. |
| `path_error(grid, start, goal, path)` | Grid, endpoints, proposed path | `None` for valid path or reason it cannot be followed. |
| `goal_is_reached(pose, goal, config)` | Estimated final pose, destination, navigation settings | Boolean arrival within position and heading tolerances. |
