# Challenge 4 · Mapped Route

## Task

Find a route around known obstacles, then have the Virtual XRP follow it.
The route must leave room for the whole robot, including deviations while
following the path.

![Start, destination, and central obstacle in the reachable map.](course-assets/mapped-route.svg)

*Figure. The blue S dot and arrow show the starting axle pose and heading;
the orange G dot marks the destination. The dark filled rectangle is the known
central obstacle at its map dimensions. No grid cells or computed route are
shown; `world.json` supplies the geometry in millimeters.*

## 1. Map and clearance

An occupancy grid divides the map into free and blocked cells. The supplied
program builds this grid from the obstacle map and expands the blocked areas
to allow space for the robot. Inspect the grid in Program output and compare
it with the obstacles in Monitor.

Examine the three worlds: **Mapped route**, **Destination blocked**, and
**No connecting route**. Predict whether each has a route from start to
destination. Explain why a point that looks outside an obstacle can still
belong to a blocked cell once robot clearance is included.

## 2. Grid search

Develop a search that finds a connected sequence of free cells from start to
destination. Consecutive cells must share a side. Decide how to keep track
of cells already examined and how to recover the route when the search
reaches the destination. Any valid route is acceptable.

Run the search on all three worlds without driving. Compare its answers with
your predictions. Inspect the returned path for correct endpoints, free
cells, and connected steps. When no route exists, the search must report that
outcome. Also check the simple case where start and destination are the same
free cell.

## 3. Route trials

Enable motion for **Mapped route** and run the Virtual XRP. The supplied
program converts your path into destinations for your navigation controller.
Compare the planned cell path with the robot's trajectory. Observe clearance
at the obstacle, any contact, and the final position and heading.

A physical trial is optional. If you run one, compare the floor geometry and
robot dimensions with the map first. Measure the closest gap to an obstacle
and final position and heading, and note any contact. State how the gap was
measured and the approximate measurement precision.

## Your report

Submit one report per pair, with both names. State grid cell size, clearance,
and the navigation settings used.

1. **Map:** show the reachable world's grid and planned path. Explain how
   robot dimensions and clearance affect which cells are blocked.
2. **Search:** describe your search and how it recovers a route. Tabulate the
   predicted and returned outcome for each world. Explain why one of the
   no-route cases cannot be solved.
3. **Motion:** compare the planned path and virtual trajectory. Did the robot
   reach the destination without contact? Did a valid cell path leave enough
   room when followed by the moving robot? Explain any discrepancy in terms
   of the map, search, or path following. Include measurements if you performed
   a physical trial.

## Project files

<strong class="student-file">Blue *</strong>: code to implement.
<strong class="config-file">Amber †</strong>: settings to adjust.
<span class="supplied-file">Gray S</span>: code provided or completed in an earlier challenge.
`main.py` is supplied and normally unchanged; a controlled experiment may still edit it.

After checking each class you implement, set its matching `USE_STUDENT_*` flag
to `True` in `course_setup.py` before **Run**. `False` runs the
supplied implementation; enable and check new classes one at a time.

<div class="project-file-table">

| File | What it does |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Runs the search, prints the grid and path, and optionally drives the route. |
| <span class="supplied-file"><code>route_validation.py</code> S</span> | Checks that a planned path is traversable and that the final estimated pose reaches the destination. |
| <strong class="student-file"><code>grid_planner.py</code> *</strong> | Searches the occupancy grid for a connected path of free cells. |
| <span class="supplied-file"><code>sensor_model.py</code> S</span> | Converts encoder readings into wheel travel and speed; also contains range estimation. |
| <span class="supplied-file"><code>wheel_speed_controller.py</code> S</span> | Calculates left and right motor commands from wheel-speed targets and measurements. |
| <span class="supplied-file"><code>differential_drive.py</code> S</span> | Converts forward speed and turn rate into left and right wheel-speed targets. |
| <span class="supplied-file"><code>odometry.py</code> S</span> | Accumulates wheel increments to estimate position and heading. |
| <span class="supplied-file"><code>navigation_controller.py</code> S</span> | Uses estimated pose to reach an ordered set of destinations. |
| <strong class="config-file"><code>robot_config.py</code> †</strong> | Holds robot calibration and controller settings. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | Loads the course geometry and holds named trial settings. |
| <strong class="config-file"><code>course_setup.py</code> †</strong> | Creates the robot using the selected component implementations. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Runs input/output examples for the component methods without driving. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | Declares Monitor controls and their starting values; publishes navigation progress. |
| <span class="supplied-file"><code>grid_display.py</code> S</span> | Prints the grid, blocked cells, endpoints, and planned path. |
| <strong class="config-file"><code>world.json</code> †</strong> | Defines arena geometry, start pose, tracks, obstacles, and named markers shared by the robot and Monitor. |

</div>

## Parameters and functions

Reuse the completed components from the preceding challenge. The method templates and API specify inputs and outputs. The Guide explains
how to select your implementations and run a different project file.

### Parameters

| Setting | Source and units | Effect |
| --- | --- | --- |
| `GRID_RESOLUTION_MM` | `challenge.py`; mm/cell | Sets grid-cell width and height for the sampled map. |
| `CLEARANCE_MM` | `challenge.py`; mm | Inflates obstacles and arena edges for the robot's physical footprint and tracking margin. |
| `MAXIMUM_GRID_CELLS` | `challenge.py`; cells | Bounds memory/work for planning on the XRP. |
| `EXECUTE_ROUTE` | `challenge.py`; Boolean | `False` plans without motion; `True` also follows the validated path. |
| Cruise speed and turn rate | Live controls declared in `live_variables.py`; mm/s and rad/s | Adjust route motion from 80–220 mm/s and 0.4–1.6 rad/s. |
| Approach speed, slowing distance, and navigation tolerances | `robot_config.py`; mm/s, mm, rad | Approach at 80% of selected cruise speed within 120 mm of each goal; set accepted pose errors. |

The first run is motion-free. Record grid resolution and clearance with each
path comparison; these settings alter which cells are free. The two motion
controls take effect after the next robot sample during a route run.

### Functions and methods

| Function or method | Input | Return or effect |
| --- | --- | --- |
| `OccupancyGrid.from_arena(arena, resolution_mm, clearance_mm)` | Dimensioned `ArenaMap`, grid resolution and clearance in mm | Grid of free/blocked cells. |
| `GridPlanner.plan(grid, start, goal)` | `OccupancyGrid` and two `GridCell` endpoints | Connected `GridPath` including both endpoints, or `None`. |
| `GridPath.to_goals(grid)` | The same grid used for planning | World-coordinate navigation goals at turns and destination. |
| `path_error(grid, start, goal, path)` | Proposed path and endpoints | `None` for a valid path or a reason it cannot be executed. |
| `goal_is_reached(pose, goal, config)` | Final estimated pose, destination, current navigation settings | Whether the position and required heading are within tolerance. |
