# Challenge 5 · Out-and-Back

## Task

Follow the assigned outbound route, stop at the observation pose, determine whether the center gate is blocked, and plan a return home. The gate is the only unknown map feature; the robot measures it while stationary.

![Assigned outbound route, home, observation point, and center gate.](course-assets/out-and-back.svg)

*Figure. Blue H, 1, and 2 markers show home and the ordered outbound stops; the orange O marker and left-pointing arrow show the stationary observation pose and heading. The dashed teal line is the assigned outbound route. Dark filled rectangles mark the fixed upper/lower walls and far reflector; the orange dashed rectangle is the center gate whose occupancy is observed. No return route is drawn. Dimensions come from `world.json` in millimeters.*

## 1. Measure the gate before mission trials

1. **Collect stationary readings.** Measure how range changes with the gate state. At the physical observation pose, aim the stopped robot toward the gate. In the file list, choose **Actions for range_readout.py → Make main**, then **Compile** and **Run**. Selecting a file in the editor alone does not change what Run executes. Collect repeated batches with the gate blocked and open without changing position or aim. The readout prints raw attempts, including `None` for an unavailable echo. `RANGE_SAMPLE_COUNT` in `challenge.py` initially requests seven attempts per batch; the count is adjustable.
2. **Compare conditions.** Record each batch and count its positive, finite readings. Calculate their median by hand; mark the result unavailable when the count is below `MINIMUM_USABLE_RANGE_COUNT`. Compare the blocked and open medians and their variation across batches. If they overlap, inspect aim and reflecting surfaces and collect further measurements.
3. **Choose a threshold.** Set `BLOCKED_RANGE_THRESHOLD_MM` in `challenge.py` between the groups of blocked and open medians. Supplied `observed_gate()` in `mission_policy.py` reports blocked at or below that range. Record the measurement basis; the 550 mm starter value is a default.

## 2. Implement and check the range estimate

1. **Implement the estimate.** Reduce a batch of raw attempts to one range value. In `sensor_model.py`, implement `SensorModel.estimate_range(samples, minimum_usable)`. Keep positive finite numeric readings in millimeters; reject `None`, Boolean, zero, negative, and nonfinite values. Return their median, or `None` when fewer than `minimum_usable` remain. An unavailable estimate cannot mean open gate.
2. **Check sample batches.** Use **Test functions** (`component_checks.py`) to compare the method with supplied examples that include missing readings and an unusually large reading. These checks use fixed inputs, not your collected batches. `MINIMUM_USABLE_RANGE_COUNT` in `challenge.py` currently passes four; it is a configurable decision setting.
3. **Select the component.** In `course_setup.py`, set `USE_STUDENT_SENSOR_MODEL = True` after checking it. Keep the wheel-measurement methods completed in Robot Curling and reuse the other completed component files and robot settings from Mapped Route. Set their matching flags to `True`; `False` selects supplied versions. Supplied `main.py`, `mission_policy.py`, and `mission_steps.py` handle stopping, classification, path checks, and route sequencing.

## 3. Compare return routes and physical runs

1. **Compare virtual decisions.** Check whether the two observations lead to different return plans. Restore **Actions for main.py → Make main**, then **Compile**. With **Virtual XRP** selected, choose **Center gate blocked** and then **Center gate open** in **Monitor → World**, running each case. `world.json` defines the simulated obstacles; `main.py` infers the gate state from range samples. Calculate the median of the printed `stationary_range_samples_mm` and compare it with `range_estimate_mm`. Record `gate_blocked`, return path length, result, and return time when available. The outbound route is the same in both worlds.
2. **Record map settings.** `GRID_RESOLUTION_MM` and `CLEARANCE_MM` in `challenge.py` set the return grid and obstacle expansion; their defaults are 100 mm/cell and 95 mm. `main.py` changes the known map's `center_gate` feature from the range decision before calling the selected `GridPlanner`. Record these settings with the threshold; change them to test a stated reason.
3. **Run physical conditions.** Run with gate blocked and open, fixed during each run. The **Cruise speed** (mm/s) and **Turn rate** (rad/s) Monitor controls in `live_variables.py` start at 150 mm/s and 0.8 rad/s. `apply_navigation_controls()` in `robot_config.py` applies changes after the next robot sample; approach speed is 80% of cruise speed. Slider endpoints are configured limits. Use the same motion settings for a blocked/open comparison.
4. **Measure arrival.** Record the stop at observation, gate decision, return route, and arrival home. Measure final axle-midpoint position and heading against the home mark, or record an early stopping location. If using a front-center mark, account for its axle offset and final heading. Repeat as needed to assess variation and record measurement precision.

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
| <span class="supplied-file"><code>main.py</code> S</span> | Runs outbound route, measures the gate, and plans and follows the return. |
| <strong class="student-file"><code>sensor_model.py</code> *</strong> | Estimates range from a batch; also contains earlier wheel measurements. |
| <span class="supplied-file"><code>wheel_speed_controller.py</code> S</span> | Calculates motor commands from wheel-speed targets and measurements. |
| <span class="supplied-file"><code>differential_drive.py</code> S</span> | Converts forward speed and turn rate into wheel-speed targets. |
| <span class="supplied-file"><code>odometry.py</code> S</span> | Accumulates wheel increments to estimate position and heading. |
| <span class="supplied-file"><code>navigation_controller.py</code> S</span> | Uses estimated pose to reach ordered destinations. |
| <span class="supplied-file"><code>grid_planner.py</code> S</span> | Searches the occupancy grid for a connected free-cell path. |
| <strong class="config-file"><code>robot_config.py</code> †</strong> | Holds robot calibration and navigation settings. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | Loads geometry and sets range, map, and run settings. |
| <strong class="config-file"><code>course_setup.py</code> †</strong> | Selects component implementations. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Runs component input/output examples without driving. |
| <span class="supplied-file"><code>mission_policy.py</code> S</span> | Classifies an available range as blocked or open. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | Declares Monitor controls and publishes mission progress and result. |
| <span class="supplied-file"><code>mission_steps.py</code> S</span> | Follows routes and checks arrivals and cell paths. |
| <span class="supplied-file"><code>range_readout.py</code> S</span> | Prints raw stationary range attempts. |
| <strong class="config-file"><code>world.json</code> †</strong> | Defines gate worlds, geometry, start pose, and markers. |

</div>

## Parameters and functions

These are the settings and interfaces used above; see the API reference for full type and error behavior.

### Parameters

| Setting | Source and units | Effect |
| --- | --- | --- |
| `RANGE_SAMPLE_COUNT`, `MINIMUM_USABLE_RANGE_COUNT` | `challenge.py`; attempts, usable readings | Current defaults request seven attempts and require four usable readings; both are adjustable. |
| `BLOCKED_RANGE_THRESHOLD_MM` | `challenge.py`; mm | Estimated range at or below which the named gate is classified blocked. |
| `STATIONARY_SPEED_MM_S`, `STATIONARY_DURATION_S` | `challenge.py`; mm/s, s | Measured near-zero wheel-speed requirement before range collection. |
| `GRID_RESOLUTION_MM`, `CLEARANCE_MM` | `challenge.py`; mm/cell, mm | Sample return map and expand obstacles for clearance. |
| `MAXIMUM_GRID_CELLS` | `challenge.py`; cells | Planner memory/work limit checked by `main.py`. |
| Cruise speed, turn rate | Monitor controls in `live_variables.py`; mm/s, rad/s | Outbound and return motion, applied by `robot_config.py` after the next sample. |
| Approach speed, slowing distance, pose tolerances | `robot_config.py`; mm/s, mm, rad | Near-goal speed, slowing point, and accepted pose errors. |

### Functions and methods

| Function or method | Input | Return or effect |
| --- | --- | --- |
| `SensorModel.estimate_range(samples, minimum_usable)` | Range attempts in mm or `None`, usable-count setting | Median usable range in mm, or `None`. |
| `observed_gate(estimate_mm, threshold_mm)` | Estimated range and threshold in mm | `True` blocked, `False` open, `None` unavailable. |
| `follow_route(robot, navigation, state, goals)` | Robot, navigation, current state, ordered goals | Latest state and arrival or stop reason. |
| `GridPlanner.plan(grid, start, goal)` | Return grid and two `GridCell` endpoints | Connected `GridPath`, or `None`. |
