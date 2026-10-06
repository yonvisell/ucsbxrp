# Challenge 5 · Out-and-Back

## Task

Follow the assigned outbound route, stop at the observation pose, determine whether the center gate is blocked, and plan a return home. The gate is the only unknown map feature; the robot measures it while stationary.

![Assigned outbound route, home, observation point, and center gate.](course-assets/out-and-back.svg)

*Figure. Blue H, 1, and 2 markers show home and the ordered outbound stops; the orange O marker and left-pointing arrow show the stationary observation pose and heading. The dashed teal line is the assigned outbound route. Dark filled rectangles mark the fixed upper/lower walls and far reflector; the orange dashed rectangle is the center gate whose occupancy is observed. No return route is drawn. Dimensions come from `world.json` in millimeters.*

## 1. Measure the gate before mission trials

1. **Collect stationary readings.** Measure how range changes with the gate state. At the physical observation pose, aim the stopped robot toward the gate. In the file list, choose **Actions for experiment_range_readout.py → Make main**, then **Compile** and **Run**. Selecting a file in the editor alone does not change what Run executes. Collect repeated batches with the gate blocked and open without changing position or aim. The readout prints raw attempts, including `None` for an unavailable echo. `RANGE_SAMPLE_COUNT` in `challenge.py` initially requests seven attempts per batch; the count is adjustable.
2. **Compare conditions.** Record each batch and count its positive, finite readings. Calculate their median by hand; mark the result unavailable when the count is below `MINIMUM_USABLE_RANGE_COUNT`. Compare the blocked and open medians and their variation across batches. If they overlap, inspect aim and reflecting surfaces and collect further measurements.
3. **Choose a threshold.** Set `BLOCKED_RANGE_THRESHOLD_MM` in `challenge.py` between the groups of blocked and open medians. Supplied `observed_gate()` in `mission_policy.py` reports blocked at or below that range. Record the measurement basis; the 550 mm starter value is a default.

## 2. Implement and check the range estimate

1. **Implement the estimate.** Reduce a batch of raw attempts to one range value. In `sensor_processor.py`, implement `SensorProcessor.estimate_range(samples, minimum_usable)`. Keep positive finite numeric readings in millimeters; reject `None`, Boolean, zero, negative, and nonfinite values. Return their median, or `None` when fewer than `minimum_usable` remain. An unavailable estimate cannot mean open gate.
2. **Check sample batches.** Use **Run code tests** (`component_checks.py`) to compare the method with supplied examples that include missing readings and an unusually large reading. These checks use fixed inputs, not your collected batches. `MINIMUM_USABLE_RANGE_COUNT` in `challenge.py` currently passes four; it is a configurable decision setting.
3. **Select the component.** In `robot_setup.py`, set `USE_STUDENT_SENSOR_PROCESSOR = True` after checking it so Run uses your range estimate. Keep the wheel-measurement methods completed in Robot Curling and reuse the other completed component files and robot settings from Mapped Route. Set their matching flags to `True`; `False` selects supplied versions. The supplied helpers handle route execution, stopping checks, and return-map construction. `main.py` shows their sequence and calls your range estimator; `mission_policy.py` applies the gate threshold.

## 3. Compare return routes and physical runs

1. **Compare virtual decisions.** Check whether the two observations lead to different return plans. Restore **Actions for main.py → Make main**, then **Compile**. With **Virtual XRP** selected, choose **Center gate blocked** and then **Center gate open** in **Monitor → World**, running each case. `world.json` defines the simulated obstacles; `main.py` infers the gate state from range samples. Calculate the median of the printed `stationary_range_samples_mm` and compare it with `range_estimate_mm`. Record `gate_blocked`, return path length, result, and return time when available. The outbound route is the same in both worlds.
2. **Record map settings.** `GRID_RESOLUTION_MM` and `CLEARANCE_MM` in `challenge.py` set the return grid and obstacle expansion; their defaults are 100 mm/cell and 95 mm. `plan_return()` in `return_route.py` changes the known map's `center_gate` feature from the range decision before calling the selected `GridPlanner`. Record these settings with the threshold; change them to test a stated reason.
3. **Run physical conditions.** Run with gate blocked and open, fixed during each run. The **Cruise speed** (mm/s) and **Turn rate** (rad/s) Monitor controls in `live_variables.py` start at 150 mm/s and 0.8 rad/s. `apply_navigation_controls()` in `robot_setup.py` applies changes after the next robot sample; approach speed is 80% of cruise speed. Slider endpoints are configured limits. Use the same motion settings for a blocked/open comparison.
4. **Measure arrival.** Record the stop at observation, gate decision, return route, and arrival home. Measure final axle-midpoint position and heading against the home mark, or record an early stopping location. If using a front-center mark, account for its axle offset and final heading. Repeat the selected condition three times and record measurement precision.

## Save and plot each trial

If Monitor’s controls are collapsed, select **›** at its upper left to reach
the plot and export settings.

1. Before **Run**, record the world, selected student flags, calibration,
   sample period, and live-control values. Keep those values fixed during a
   comparison trial. Number every run, including incomplete runs.
2. After the run ends, use **Monitor → Export → Export run data as CSV** and
   **Export program output**. Select **Include code in ZIP** and **Export run
   data (ZIP)** to retain the code and settings used. Name exports by pair,
   challenge, target, and trial, for example `pair07_ch5_virtual_trial01.csv`.
   Wait for export completion and open the saved files to check their contents.
3. Load the CSV in MATLAB with the commands below. Keep the original CSV;
   filtering the table selects processed course samples for these plots.
   Virtual physics observations and raw acquisition rows remain in the file.
   Use the same axis limits when comparing settings. Put trial number and
   settings in each figure title or caption.

```matlab
T = readtable('pair07_ch5_virtual_trial01.csv', ...
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

Plot estimated outbound and return motion from the exported mission CSV:

```matlab
figure; plot(T.estimated_x_mm,T.estimated_y_mm);
axis equal; xlabel('Estimated x (mm)'); ylabel('Estimated y (mm)'); grid on;
figure; plot(t,T.range_mm,'o');
xlabel('Time from first encoder acquisition (s)'); ylabel('Recorded forward range (mm)'); grid on;
exportgraphics(gcf,'trial01_range.png','Resolution',200);
```

Replace the example filename with the mission CSV. The range plot can include
cached range values; use printed `stationary_range_samples_mm` as the distinct
attempts for calculating the median. Copy those attempts into a table,
retaining `None` as missing, and show usable count, median, threshold, and gate
decision. For each gate condition retain the printed return path/result/time
and final pose. Use the same navigation settings for blocked/open comparisons
and repeat each selected condition three times.

To inspect the sample timing, select **Monitor → Plot signals → Control period**.
The plot compares the measured interval between sensor samples with the
configured period, both in ms. Use measured elapsed time in calculations;
the arrival time of a telemetry message in the browser is not the sample time.

## Reading main.py

1. **Create and start.** Imports name the outbound goals, stationary sampling
   settings, decision rule, and return-planning helpers. `make_robot()`
   assembles the reused components; `make_navigation_controller()` creates
   the route controller. `robot.start(INITIAL_POSE)` returns the first
   measurements and estimated axle-midpoint pose in a `RobotState` record.
2. **Follow the outbound route.** `follow_route()` loads the ordered goals,
   requests motion from successive estimated poses, and applies it through
   `robot.step()`. It returns the latest state and an arrival/stop reason.
   `robot.stop()` removes effort before observation. Failed arrival ends
   the mission with an outbound result.
3. **Confirm rest and collect distinct attempts.** `wait_until_stationary()`
   requests zero motion until both measured wheel speeds stay below the
   threshold for the configured interval. If that check fails, the mission
   ends. Otherwise `collect_range_samples()` collects distinct ultrasound
   attempts while requesting zero motion. Missing echoes remain `None`;
   repeatedly reading one cached echo does not count as new attempts.
4. **Estimate and decide.** `robot.estimate_range()` calls the selected
   `SensorProcessor.estimate_range(samples, minimum_usable)`.
   `observed_gate()` compares that estimate with the threshold and returns
   blocked, open, or unavailable. An unavailable estimate ends the mission.
   Program output retains the raw batch and estimate for comparison.
5. **Plan the return.** `plan_return()` changes only the known map's named
   gate feature, constructs the grid, calls the selected `GridPlanner`,
   checks its path, and converts cells into homebound goals. A path error
   ends the mission. A valid path is sent to the route controller.
6. **Return and report.** A second `follow_route()` call follows those goals
   using measured wheel travel and odometry. The program prints return time
   from sample timestamps and final estimated pose, publishes the result,
   and removes motor effort. `finally` also stops after a Python exception. IDE **Stop** requests
   a stop through the target service; it may interrupt Python before
   `finally` executes.

The optional zero target-feedback gains stay in `navigation_controller.py`.
Only the known gate changes after the stationary range observation; this
mission does not construct a new map from moving measurements.

## Your report

Submit one report per pair with both names, robot identification, selected components, worlds, and trial settings. Label virtual output separately from physical measurements.

1. **Preliminary lab work:** tabulate the stationary blocked/open range batches and usable counts, show the median checks, and justify the chosen threshold and any changed map or navigation settings.
2. **Challenge data:** show the virtual and physical range estimates, gate decisions, return paths, results, return times when available, and measured final home poses for physical runs.
3. **Challenge performance:** state whether the outbound stops, observation, gate decision, planned return, and home arrival succeeded in each gate condition. Quantify measured home error where a run completed.
4. **Reflection:** use the readings and run records to locate any failure in measurement, decision, path, or motion. Identify one supported improvement and how another measurement or trial would test it.

## Project files

<strong class="student-file">Blue *</strong>: code to implement. <strong class="config-file">Amber †</strong>: settings to adjust. <span class="supplied-file">Gray S</span>: code provided or completed in an earlier challenge. `main.py` is supplied; controlled experiments may edit it.

<div class="project-file-table">

| File | What it does |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Sequences outbound travel, the stopping check, range estimation, return planning, and return travel. |
| <strong class="student-file"><code>sensor_processor.py</code> *</strong> | Estimates range from a batch; also contains earlier wheel measurements. |
| <span class="supplied-file"><code>differential_drive.py</code> S</span> | Converts forward speed and turn rate into wheel-speed targets. |
| <span class="supplied-file"><code>odometry.py</code> S</span> | Accumulates wheel increments to estimate position and heading. |
| <span class="supplied-file"><code>navigation_controller.py</code> S</span> | Uses estimated pose to reach ordered destinations. |
| <span class="supplied-file"><code>grid_planner.py</code> S</span> | Searches the occupancy grid for a connected free-cell path. |
| <strong class="config-file"><code>robot_setup.py</code> †</strong> | `sample_period_ms` — scheduled measurement interval in ms; 20 ms requests 50 Hz.<br>`wheel_diameter_mm` — wheel diameter in mm used to convert encoder counts to travel.<br>`encoder_counts_per_revolution` — encoder counts for one wheel revolution.<br>`track_width_mm` — wheel spacing in mm used for turning and odometry.<br>`left_start_command`, `right_start_command` — supplied motor commands for starting each wheel.<br>`left_speed_command_gain`, `right_speed_command_gain` — supplied motor-command coefficients per requested wheel speed.<br>`wheel_speed_kp` — supplied correction per wheel-speed error.<br>`wheel_speed_ki`, `wheel_speed_kd` — reserved settings; keep zero because the supplied controller does not use them.<br>`max_drive_command` — largest permitted absolute motor command.<br>`USE_STUDENT_SENSOR_PROCESSOR`, `USE_STUDENT_DIFFERENTIAL_DRIVE`, `USE_STUDENT_ODOMETRY`, `USE_STUDENT_NAVIGATION_CONTROLLER`, `USE_STUDENT_GRID_PLANNER` — True uses each corresponding project class; False uses its supplied class.<br>`cruise_speed_mm_s` — forward speed in mm/s away from a goal.<br>`approach_speed_mm_s` — forward speed near a goal; 80% of the Cruise speed setting.<br>`slowdown_distance_mm` — distance in mm at which approach speed replaces cruise speed.<br>`turn_rate_rad_s` — maximum turning rate in rad/s.<br>`position_tolerance_mm` — distance error in mm accepted at a goal.<br>`heading_tolerance_rad` — heading error in rad accepted for alignment.<br>`realign_heading_rad` — heading error in rad that pauses forward travel for turning. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | `OUTBOUND_ROUTE`, `HOME` — ordered observation-route goals and return destination.<br>`GRID_RESOLUTION_MM` — return-grid cell width in mm.<br>`CLEARANCE_MM` — distance in mm kept from obstacles and arena edges.<br>`MAXIMUM_GRID_CELLS` — maximum grid-cell count accepted before return planning.<br>`RANGE_SAMPLE_COUNT` — number of distinct range attempts to collect.<br>`MINIMUM_USABLE_RANGE_COUNT` — usable readings required for an estimate.<br>`BLOCKED_RANGE_THRESHOLD_MM` — range in mm at or below which the gate is classified blocked.<br>`GATE_FEATURE` — name of the map feature changed by that decision.<br>`STATIONARY_SPEED_MM_S` — maximum absolute wheel speed in mm/s counted as stopped.<br>`STATIONARY_DURATION_S` — continuous stopped interval in s before range collection.<br>`MAXIMUM_STOP_WAIT_S` — maximum wait in s for confirming rest.<br>`RANGE_COLLECTION_TIMEOUT_S` — maximum collection time in s before missing attempts are reported. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Runs component input/output examples without driving. |
| <span class="supplied-file"><code>mission_policy.py</code> S</span> | Classifies an available range as blocked or open. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | `CRUISE_SPEED` — Monitor Cruise speed setting in mm/s.<br>`TURN_RATE` — Monitor Turn rate limit in rad/s. |
| <span class="supplied-file"><code>mission_steps.py</code> S</span> | Follows routes and counts estimated arrivals at their goals. |
| <span class="supplied-file"><code>stationary_observation.py</code> S</span> | Confirms continuously low measured wheel speeds before observation. |
| <span class="supplied-file"><code>return_route.py</code> S</span> | Updates the gate on the map, calls the planner, checks its path, and creates homebound goals. |
| <span class="supplied-file"><code>experiment_range_readout.py</code> S</span> | Prints raw stationary range attempts. |
| <strong class="config-file"><code>world.json</code> †</strong> | `default_world` — world used when none has been selected.<br>`bounds` — arena edges in mm.<br>`initial_pose` — starting position in mm and heading in rad.<br>`markers` — start, target, or waypoint locations in mm.<br>`obstacles` — fixed blocked regions in mm.<br>`obstacles[].feature` — name of the gate feature identified by a block. |

</div>

## Functions and methods

Keep the template method names and arguments. Use measured `dt_s` or sample
timestamps for calculations involving time. Keep the supplied wheel-controller
settings in `robot_setup.py`. The API Reference gives the full record fields
and method requirements.



| Function or method | Input | Return or effect |
| --- | --- | --- |
| `SensorProcessor.estimate_range(samples, minimum_usable)` | Range attempts in mm or `None`, usable-count setting | Median usable range in mm, or `None`. |
| `observed_gate(estimate_mm, threshold_mm)` | Estimated range and threshold in mm | `True` blocked, `False` open, `None` unavailable. |
| `follow_route(robot, navigation, state, goals)` | Robot, navigation, current state, ordered goals | Latest state and arrival or stop reason. |
| `GridPlanner.plan(grid, start, goal)` | Return grid and two `GridCell` endpoints | Connected `GridPath`, or `None`. |
| `wait_until_stationary(robot, state)` | Started robot and latest measured state | Latest state and whether both wheels stayed below the stopping-speed threshold. |
| `plan_return(planner, pose, blocked)` | Selected planner, stopped pose, gate decision | Ordered return goals, path cell count, and error text (`None` on success). |
