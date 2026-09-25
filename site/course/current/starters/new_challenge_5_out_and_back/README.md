# Challenge 5 · Out-and-Back

## Task

Follow the outbound route, stop to determine whether the center gate is blocked,
and plan a return home. Use ultrasonic measurements to decide whether the return
can pass through the gate or needs a detour.

![Assigned outbound route, home, observation point, and center gate.](course-assets/out-and-back.svg)

*Figure. Blue H, 1, and 2 markers show home and the ordered outbound stops;
the orange O marker and left-pointing arrow show the stationary observation
pose and heading. The dashed teal line is the assigned outbound route. Dark
filled rectangles mark the fixed upper/lower walls and far reflector; the
orange dashed rectangle is the center gate whose occupancy is observed. No
return route is drawn. Dimensions come from `world.json` in millimeters.*

## 1. Ultrasonic measurements

On the physical course, place the robot at the observation point, facing the
gate. Use the supplied
`range_readout.py` program to collect readings while the robot is stationary.
Collect at least three batches with the gate blocked and three with it open,
keeping the robot's position and aim fixed. Each batch contains seven measurement
attempts; some may return no reading.

Compare the readings within and between the two conditions. Identify missing
readings and unusually large or small values. Determine whether the measurements
separate an open gate from a blocked one. If the groups overlap, examine the
sensor aim and reflecting surfaces before choosing a detection threshold.

## 2. Gate detection

Estimate range from a batch using the median of the positive, finite readings.
Ignore missing readings and other invalid values. Develop the calculation and compare its result with individual readings from your
measurements. Require at least four usable readings; fewer should give an
unavailable estimate, not an open-gate decision.

Choose a threshold between the blocked and open measurements. Run both virtual
worlds, **Center gate blocked** and **Center gate open**. Examine the measured
range, gate decision, and return route. The outbound route is the same in both
cases; the return must account for the observed gate state. The supplied program
stops if there are too few usable readings to decide.

## 3. Return trials

Run the physical mission with the gate blocked and with it open. Keep the gate
fixed during each run and use the same motion settings in both conditions.
Observe the stop at the measurement point, the chosen return route, and arrival
home. Repeat one condition to assess variation.

Measure the final distance from the robot's axle midpoint to the home position,
and record final heading. If you measure a front-center mark, convert it to
axle position as in Waypoint Courier. For a run that stops early, identify where
it stopped and compare the observations with Program output.

## Your report

Submit one report per pair, with both names, robot identification, and trial
settings. Distinguish virtual and physical results.

1. **Range measurements:** tabulate the readings and median for each blocked
   and open batch, including the number of usable readings. How much did they
   vary? Explain your threshold and the separation between the two conditions.
2. **Gate decision:** explain your median calculation and show how it handles
   missing readings and an unusually large reading. Did each virtual case
   produce the expected decision and route?
3. **Return:** show the two physical return routes and tabulate gate condition,
   estimated range, decision, return time, completion or stopping reason, and
   measured home error. If a run failed, did the problem begin with the range
   measurement, the gate decision, the planned path, or the robot's motion?
   What evidence supports that explanation?

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
| <span class="supplied-file"><code>main.py</code> S</span> | Runs the outbound route, measures the gate, and plans and follows the return. |
| <strong class="student-file"><code>sensor_model.py</code> *</strong> | Estimates range from a batch; also contains the wheel measurements from earlier challenges. |
| <span class="supplied-file"><code>wheel_speed_controller.py</code> S</span> | Calculates left and right motor commands from wheel-speed targets and measurements. |
| <span class="supplied-file"><code>differential_drive.py</code> S</span> | Converts forward speed and turn rate into left and right wheel-speed targets. |
| <span class="supplied-file"><code>odometry.py</code> S</span> | Accumulates wheel increments to estimate position and heading. |
| <span class="supplied-file"><code>navigation_controller.py</code> S</span> | Uses estimated pose to reach an ordered set of destinations. |
| <span class="supplied-file"><code>grid_planner.py</code> S</span> | Searches the occupancy grid for a connected path of free cells. |
| <strong class="config-file"><code>robot_config.py</code> †</strong> | Holds robot calibration and controller settings. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | Loads the course geometry and holds trial settings and run limits. |
| <strong class="config-file"><code>course_setup.py</code> †</strong> | Creates the robot using the selected component implementations. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Runs input/output examples for the component methods without driving. |
| <span class="supplied-file"><code>mission_policy.py</code> S</span> | Compares the estimated range with the gate threshold; preserves an unavailable reading. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | Declares Monitor controls and their starting values; publishes mission phase, progress, and result. |
| <span class="supplied-file"><code>mission_steps.py</code> S</span> | Follows route segments, checks arrival, and checks that a returned cell path is connected and free. |
| <span class="supplied-file"><code>range_readout.py</code> S</span> | Prints seven raw ultrasonic measurement attempts while the robot is stopped. |
| <strong class="config-file"><code>world.json</code> †</strong> | Defines arena geometry, start pose, tracks, obstacles, and named markers shared by the robot and Monitor. |

</div>

## Parameters and functions

Reuse the completed components from the preceding challenge. The method templates and API specify inputs and outputs. The Guide explains
how to select your implementations and run a different project file.

### Parameters

| Setting | Source and units | Effect |
| --- | --- | --- |
| `RANGE_SAMPLE_COUNT`, `MINIMUM_USABLE_RANGE_COUNT` | `challenge.py`; attempts/readings | Seven attempts are requested; at least four usable values are required. |
| `BLOCKED_RANGE_THRESHOLD_MM` | `challenge.py`; mm | Separates observed blocked and open gate cases. |
| `STATIONARY_SPEED_MM_S`, `STATIONARY_DURATION_S` | `challenge.py`; mm/s and s | Require measured near-zero wheel speed before range sampling. |
| `GRID_RESOLUTION_MM`, `CLEARANCE_MM` | `challenge.py`; mm/cell and mm | Sample the selected return map with obstacle clearance. |
| `MAXIMUM_GRID_CELLS` | `challenge.py`; cells | Bounds planner memory/work on the XRP. |
| Cruise speed and turn rate | Live controls declared in `live_variables.py`; mm/s and rad/s | Adjust outbound and return motion from 80–220 mm/s and 0.4–1.6 rad/s. |
| Approach speed, slowing distance, and navigation tolerances | `robot_config.py`; mm/s, mm, rad | Approach at 80% of selected cruise speed within 120 mm of each goal; set accepted pose errors. |

Keep the range threshold and two motion controls fixed while comparing the
blocked and open worlds. Changed motion controls take effect after the next
robot sample.
`world.json` selects the observed virtual gate case; the program infers it from
range samples.

### Functions and methods

| Function or method | Input | Return or effect |
| --- | --- | --- |
| `SensorModel.estimate_range(samples, minimum_usable)` | Range attempts in mm or `None`, minimum usable count | Median usable range in mm, or `None`. |
| `observed_gate(estimate_mm, threshold_mm)` | Estimated range and threshold in mm | `True` blocked, `False` open, or `None` unavailable. |
| `follow_route(robot, navigation, state, goals)` | Current state and ordered goals | Last state plus arrival or stop reason. |
| `GridPlanner.plan(grid, start, goal)` | Return grid and `GridCell` endpoints | Connected `GridPath`, or `None`. |
