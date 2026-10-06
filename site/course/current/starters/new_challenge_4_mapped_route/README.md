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
2. **Check cases.** Test how the search handles endpoints and disconnection before motion. Use **Run code tests** (`component_checks.py`) without driving. Check a free start equal to goal, a blocked endpoint, and a disconnected map. `grid.is_blocked(cell)` and `grid.neighbors(cell)` expose the same grid rules as the route check.
3. **Compare worlds.** Set `USE_STUDENT_GRID_PLANNER = True` in `robot_setup.py` after checking the planner so Run uses your search. Reuse the completed component files and measured robot settings from Waypoint Courier, and set their matching flags to `True`; `False` selects supplied versions. With **Virtual XRP** selected and `EXECUTE_ROUTE = False`, choose each named case in **Monitor → World** and run it. Compare predictions with Program output and inspect each returned path's endpoints, free cells, and steps. `main.py` reports `valid_path`, `no_path`, or `invalid_path`.

## 3. Run and assess the route

1. **Record motion settings.** The **Cruise speed** (mm/s) and **Turn rate** (rad/s) Monitor controls in `live_variables.py` start at 150 mm/s and 0.8 rad/s. `apply_navigation_controls()` in `robot_setup.py` applies changes after the next robot sample; approach speed remains 80% of selected cruise speed. Slider endpoints are configured control limits. Record values used; `robot_setup.py` also holds slowing distance and pose tolerances.
2. **Follow the virtual path.** For **Mapped route**, set `EXECUTE_ROUTE = True` in `challenge.py` and run the Virtual XRP. Supplied `main.py` converts the checked `GridPath` into goals; `route_runner.py` follows them with the selected `NavigationController` and checks arrival. Compare the printed path with the trajectory, obstacle clearance, contact, and final pose. If the robot contacts an obstacle or misses the destination, compare the planned clearance with its path and adjust clearance or navigation settings based on the discrepancy.
3. **Measure a physical route if performed.** A physical trial is optional. First compare floor geometry and robot dimensions with `world.json`. Record closest obstacle gap and measurement method, contact, and final axle-midpoint pose. Distinguish measurements from estimated pose and virtual trajectory.

## Save and plot each trial

If Monitor’s controls are collapsed, select **›** at its upper left to reach
the plot and export settings.

1. Before **Run**, record the world, selected student flags, calibration,
   sample period, and live-control values. Keep those values fixed during a
   comparison trial. Number every run, including incomplete runs.
2. After the run ends, use **Monitor → Export → Export run data as CSV** and
   **Export program output**. Select **Include code in ZIP** and **Export run
   data (ZIP)** to retain the code and settings used. Name exports by pair,
   challenge, target, and trial, for example `pair07_ch4_virtual_trial01.csv`.
   Wait for export completion and open the saved files to check their contents.
3. Load the CSV in MATLAB with the commands below. Keep the original CSV;
   filtering the table selects processed course samples for these plots.
   Virtual physics observations and raw acquisition rows remain in the file.
   Use the same axis limits when comparing settings. Put trial number and
   settings in each figure title or caption.

```matlab
T = readtable('pair07_ch4_virtual_trial01.csv', ...
    'VariableNamingRule','preserve');
valid = strcmp(string(T.sample_kind),'course') & ...
    isfinite(T.acquired_at_s) & isfinite(T.acquisition_seq);
T = T(valid,:);
assert(~isempty(T), 'No course sensor samples were recorded.');
clock = string(T.clock_id);
T = T(clock == clock(1),:);
[~, rows] = unique(T.acquisition_seq, 'stable');
T = T(rows,:);
t = T.acquired_at_s; % Seconds from the first encoder acquisition.
```

For the motion-free checkoff, retain Program output: grid, endpoint cells,
path cells, and validation result. There is no driven trajectory in that run.
For each executed route, load its CSV and plot:

```matlab
figure; plot(T.estimated_x_mm,T.estimated_y_mm);
axis equal; xlabel('Estimated x (mm)'); ylabel('Estimated y (mm)'); grid on;
figure;
subplot(2,1,1); plot(t,T.requested_forward_speed_mm_s);
xlabel('Time from first encoder acquisition (s)'); ylabel('Requested forward speed (mm/s)'); grid on;
subplot(2,1,2); plot(t,T.requested_turn_rate_rad_s);
xlabel('Time from first encoder acquisition (s)'); ylabel('Requested turn rate (rad/s)'); grid on;
exportgraphics(gcf,'trial01_requests.png','Resolution',200);
```

Replace the example filename with the mapped-route trial CSV. In the report,
show the printed planned cells and the estimated executed trace as separate
results. Tabulate world, grid resolution, clearance, path length in cells,
validation/result, and final estimated/measured pose. Include the required
blocked-endpoint and no-path checks; retain their outputs.

To inspect the sample timing, select **Monitor → Plot signals → Control period**.
The plot compares the measured interval between sensor samples with the
configured period, both in ms. Use measured elapsed time in calculations;
the arrival time of a telemetry message in the browser is not the sample time.

## Reading main.py

1. **Construct the grid before motion.** `challenge.py` loads the map,
   start, destination, cell size, and clearance.
   `OccupancyGrid.from_arena(...)` expands obstacles by clearance and marks
   blocked cells. `main.py` rejects grids exceeding `MAXIMUM_GRID_CELLS`.
   `world_to_cell()` converts each world-coordinate endpoint into a
   `GridCell(column, row)` record, or `None` if outside the map.
2. **Call your planner.** `make_grid_planner().plan(grid, start, goal)` returns
   a `GridPath` object with its ordered `cells`, or `None`. `path_error()`
   checks endpoints, free cells, and adjacent horizontal/vertical steps.
   `print_grid()` prints the map and the accepted path; invalid or absent
   paths produce a result without driving.
3. **Keep planning separate from execution.** With `EXECUTE_ROUTE = False`,
   the program ends after printing a valid path. After the planning checkoff,
   `True` converts cell centers into `NavigationGoal` records. The last goal
   is replaced by the exact destination rather than its cell center.
4. **Assemble and follow.** Only this execution branch calls `make_robot()`
   and `make_navigation_controller()`. `run_route()` starts the robot,
   repeatedly requests motion from estimated `Pose`, and applies it through
   `robot.step()`. It confirms destination position/heading, publishes progress,
   and stops the motors on completion or error. Planning cells are a proposed
   route; wheel measurements determine the estimated executed route.

Keep the optional `TARGET_LOCATION_KI` and `TARGET_LOCATION_KD` values in
`navigation_controller.py` at zero. Its `update(pose)` method receives no
time interval.

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
| <span class="supplied-file"><code>main.py</code> S</span> | Builds the grid, checks and prints the path, then optionally starts route execution. |
| <span class="supplied-file"><code>route_runner.py</code> S</span> | Follows validated navigation goals, reports arrival, and stops the robot on exit. |
| <span class="supplied-file"><code>route_validation.py</code> S</span> | Checks path traversability and final estimated-pose arrival. |
| <strong class="student-file"><code>grid_planner.py</code> *</strong> | Searches the occupancy grid for a connected free-cell path. |
| <span class="supplied-file"><code>sensor_processor.py</code> S</span> | Converts encoder readings into wheel travel and speed; also contains range estimation. |
| <span class="supplied-file"><code>differential_drive.py</code> S</span> | Converts forward speed and turn rate into wheel-speed targets. |
| <span class="supplied-file"><code>odometry.py</code> S</span> | Accumulates wheel increments to estimate position and heading. |
| <span class="supplied-file"><code>navigation_controller.py</code> S</span> | Uses estimated pose to reach ordered destinations. |
| <strong class="config-file"><code>robot_setup.py</code> †</strong> | `sample_period_ms` — scheduled measurement interval in ms; 20 ms requests 50 Hz.<br>`wheel_diameter_mm` — wheel diameter in mm used to convert encoder counts to travel.<br>`encoder_counts_per_revolution` — encoder counts for one wheel revolution.<br>`track_width_mm` — wheel spacing in mm used for turning and odometry.<br>`left_start_command`, `right_start_command` — supplied motor commands for starting each wheel.<br>`left_speed_command_gain`, `right_speed_command_gain` — supplied motor-command coefficients per requested wheel speed.<br>`wheel_speed_kp` — supplied correction per wheel-speed error.<br>`wheel_speed_ki`, `wheel_speed_kd` — reserved settings; keep zero because the supplied controller does not use them.<br>`max_drive_command` — largest permitted absolute motor command.<br>`USE_STUDENT_SENSOR_PROCESSOR`, `USE_STUDENT_DIFFERENTIAL_DRIVE`, `USE_STUDENT_ODOMETRY`, `USE_STUDENT_NAVIGATION_CONTROLLER`, `USE_STUDENT_GRID_PLANNER` — True uses each corresponding project class; False uses its supplied class.<br>`cruise_speed_mm_s` — forward speed in mm/s away from a goal.<br>`approach_speed_mm_s` — forward speed near a goal; 80% of the Cruise speed setting.<br>`slowdown_distance_mm` — distance in mm at which approach speed replaces cruise speed.<br>`turn_rate_rad_s` — maximum turning rate in rad/s.<br>`position_tolerance_mm` — distance error in mm accepted at a goal.<br>`heading_tolerance_rad` — heading error in rad accepted for alignment.<br>`realign_heading_rad` — heading error in rad that pauses forward travel for turning. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | `INITIAL_POSE`, `DESTINATION` — starting pose and destination read from the world.<br>`ARENA_MAP` — geometry used to build the occupancy grid.<br>`GRID_RESOLUTION_MM` — square grid-cell width in mm.<br>`CLEARANCE_MM` — distance in mm kept from obstacles and arena edges.<br>`MAXIMUM_GRID_CELLS` — maximum grid-cell count accepted before planning.<br>`EXECUTE_ROUTE` — False prints a checked path; True also drives that path. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Runs component input/output examples without driving. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | `CRUISE_SPEED` — Monitor Cruise speed setting in mm/s.<br>`TURN_RATE` — Monitor Turn rate limit in rad/s. |
| <span class="supplied-file"><code>grid_display.py</code> S</span> | Prints the grid, endpoints, and path. |
| <strong class="config-file"><code>world.json</code> †</strong> | `default_world` — world used when none has been selected.<br>`bounds` — arena edges in mm.<br>`initial_pose` — starting position in mm and heading in rad.<br>`markers` — start, target, or waypoint locations in mm.<br>`obstacles` — fixed blocked regions in mm. |

</div>

## Functions and methods

Keep the template method names and arguments. Use measured `dt_s` or sample
timestamps for calculations involving time. Keep the supplied wheel-controller
settings in `robot_setup.py`. The API Reference gives the full record fields
and method requirements.



| Function or method | Input | Return or effect |
| --- | --- | --- |
| `OccupancyGrid.from_arena(arena, resolution_mm, clearance_mm)` | `ArenaMap`, resolution and clearance in mm | Sampled free/blocked grid. |
| `GridPlanner.plan(grid, start, goal)` | `OccupancyGrid`, two `GridCell` endpoints or `None` | Connected `GridPath` including endpoints, or `None`. |
| `GridPath.to_goals(grid)` | Grid used for planning | World-coordinate navigation goals at turns and destination. |
| `path_error(grid, start, goal, path)` | Grid, endpoints, proposed path | `None` for valid path or reason it cannot be followed. |
| `goal_is_reached(pose, goal, config)` | Estimated final pose, destination, navigation settings | Boolean arrival within position and heading tolerances. |
| `run_route(robot, navigation, initial_pose, goals, destination, path_cell_count)` | Selected robot/controller, starting pose, checked route goals, destination, cell count | Executes route, prints result and final pose, stops robot on exit. |
