# Challenge 3 · Waypoint Courier

## Task

Visit the three destinations in order and finish facing the indicated direction. Use measured wheel travel to estimate the robot's axle-midpoint position and heading, then navigate from that estimate. Compare the reported final pose with an independent floor measurement.

![Starting pose, three destinations in visit order, and final heading.](course-assets/waypoint-courier.svg)

*Figure. The blue S dot and arrow indicate the starting axle pose and +x heading. Numbered orange dots show the three destinations in visit order; the left-pointing arrow at goal 3 shows its required final heading. No measured or planned trajectory is drawn. Coordinates come from `world.json` in millimeters.*

## 1. Implement and measure odometry

1. **Initialize pose.** Establish the estimate at a known starting pose. In `odometry.py`, implement `Odometry.reset(initial_pose)` to store and return that `Pose`. Make the `pose` property return the latest estimate. Position is the drive-axle midpoint in world millimeters; heading is positive counterclockwise from +x, in radians.
2. **Integrate wheel travel.** Convert each measured wheel increment into a change in pose. Implement `Odometry.update(left_increment_mm, right_increment_mm)` using signed travel since the previous sample and `self.config.track_width_mm`. Return and retain the new `Pose`. Unequal travel follows the wheel paths' exact constant-curvature arc; wrap heading to `[-π, π)`.
3. **Check known motions.** Run **Run code tests** (`component_checks.py`) without driving. For its straight, in-place turn, and arc inputs, record the wheel increments, predicted change in pose, and returned `Pose`. Compare the direction, units, and heading wrap. A square is an optional additional accumulation check; the route run below supplies the independent floor-pose comparison.

## 2. Implement and test ordered navigation

1. **Track goals.** Retain which destination is active across samples. In `navigation_controller.py`, implement `NavigationController.start(goals)` to save the ordered sequence and reset progress. Make `current_goal()` report the active goal or `None`, and `is_complete()` report whether every required position and heading has been reached. An empty route is complete immediately.
2. **Choose motion.** Turn pose error into the next motion request. Implement `update(pose)` to return a `MotionCommand` from the estimated `Pose`. Decide how to turn toward, approach, and accept each goal. `heading_rad=None` requires position only; the last goal also requires heading. Use `NavigationConfig` tolerances and motion settings. Return `STOP_COMMAND` after completion.
3. **Check and select.** Use **Run code tests** to examine distant, near, and wrong-final-heading poses. In `robot_setup.py`, set `USE_STUDENT_ODOMETRY` and `USE_STUDENT_NAVIGATION_CONTROLLER` to `True` after their checks pass so Run uses your methods. Reuse your completed sensing and differential-drive files from Arena Line Circuit, along with the same robot's measured settings. Set their matching flags to `True`; `False` selects the supplied versions. Wheel-speed control remains supplied by the library.

## 3. Run and measure the courier route

1. **Set motion controls.** The **Cruise speed** (mm/s) and **Turn rate** (rad/s) Monitor controls in `live_variables.py` start at 150 mm/s and 0.8 rad/s. `apply_navigation_controls()` in `robot_setup.py` applies changed values to the active controller after the next robot sample; approach speed follows cruise speed at 80%. Slider endpoints are configured control limits, not activity targets. Record values used; adjust other navigation settings in `robot_setup.py` when measurements support a change.
2. **Check the virtual route.** Inspect the start and ordered goals in `world.json`; `challenge.py` loads them as `INITIAL_POSE` and `ROUTE`. Run `main.py` on the Virtual XRP. Use the route trace, estimated heading, `goals_reached`, and Program output to locate overshoot, missed goals, or repeated turns. Revise the controller and repeat as needed before physical trials.
3. **Measure the physical result.** Run from the marked starting axle pose. Record visit order, missed destinations or contact, and final orientation. Measure final axle-midpoint position and heading on the floor, including reading precision, and compare them with `final_pose` in Program output. If using a front-center mark, measure its axle offset and account for heading. Repeat the selected motion settings three times to assess consistency.

## Save and plot each trial

If Monitor’s controls are collapsed, select **›** at its upper left to reach
the plot and export settings.

1. Before **Run**, record the world, selected student flags, calibration,
   sample period, and live-control values. Keep those values fixed during a
   comparison trial. Number every run, including incomplete runs.
2. After the run ends, use **Monitor → Export → Export run data as CSV** and
   **Export program output**. Select **Include code in ZIP** and **Export run
   data (ZIP)** to retain the code and settings used. Name exports by pair,
   challenge, target, and trial, for example `pair07_ch3_virtual_trial01.csv`.
   Wait for export completion and open the saved files to check their contents.
3. Load the CSV in MATLAB with the commands below. Keep the original CSV;
   filtering the table selects processed course samples for these plots.
   Virtual physics observations and raw acquisition rows remain in the file.
   Use the same axis limits when comparing settings. Put trial number and
   settings in each figure title or caption.

```matlab
T = readtable('pair07_ch3_virtual_trial01.csv', ...
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

```matlab
figure; plot(T.estimated_x_mm,T.estimated_y_mm);
axis equal; xlabel('Estimated x (mm)'); ylabel('Estimated y (mm)'); grid on;
hold on;
% Enter the ordered goal coordinates from this trial's world.json:
goal_x_mm = [400; 400; 0];
goal_y_mm = [0; 300; 300];
plot(goal_x_mm,goal_y_mm,'o');
legend('Estimated route','Goals','Location','best');
figure; plot(t,T.estimated_heading_rad);
xlabel('Time from first encoder acquisition (s)'); ylabel('Estimated heading (rad)'); grid on;
exportgraphics(gcf,'trial01_heading.png','Resolution',200);
```

Replace the example filename and both goal vectors with values from the
selected world; check their order before plotting. Keep equal x/y scale on
route plots. For physical runs, add measured final axle-midpoint x/y and heading
to the trial table; report position error in mm and wrapped heading error in
rad. Repeat the selected motion settings three times and include incomplete
routes. Do not label estimated pose as a floor measurement.

To inspect the sample timing, select **Monitor → Plot signals → Control period**.
The plot compares the measured interval between sensor samples with the
configured period, both in ms. Use measured elapsed time in calculations;
the arrival time of a telemetry message in the browser is not the sample time.

## Reading main.py

1. **Create robot and navigation objects.** `make_robot(ROBOT_CONFIG)`
   assembles the selected sensing, wheel-speed, drive-conversion, and odometry
   objects. `make_navigation_controller(NAVIGATION_CONFIG)` creates a
   separate route controller. The processor saves sensor samples, odometry saves the estimated pose,
   and navigation saves route progress. The settings records hold wheel
   dimensions, speed limits, and arrival tolerances.
2. **Start at the known pose.** `robot.start(INITIAL_POSE)` resets measurements
   and returns `RobotState(measurements, pose)`. `state.pose` is the estimated
   axle-midpoint `Pose`, with named x/y positions in mm and heading in rad.
   `navigation.start(ROUTE)` stores the ordered `NavigationGoal` records and
   resets its active-goal index.
3. **Request and apply one motion.** While the controller is incomplete,
   `apply_navigation_controls()` copies current Monitor settings into it.
   `navigation.update(state.pose)` selects a `MotionCommand` using the latest
   estimate. `robot.step(...)` converts it to wheel targets, applies motor
   feedback, measures wheel travel, and updates odometry. The returned state
   supplies the next pose. Neither the requested motion nor simulated truth
   replaces the wheel-derived pose in this loop.
4. **Check observed arrivals.** `count_reached_goals()` compares each new
   estimated pose with the next goal using current position/heading tolerances.
   Its count is separate from the navigation object's completion claim.
   Monitor receives that count and estimated heading. `step_count` counts
   updates for debugging; it is not elapsed time.
5. **Report and stop.** After controller completion, `main.py` checks that
   every required arrival was observed in order. It prints the count and
   final estimated pose, raises an error for incomplete arrival, and removes
   motor effort in `finally` on completion or error.

Optional `TARGET_LOCATION_KP`, `TARGET_LOCATION_KI`, and `TARGET_LOCATION_KD`
are defined at zero in `navigation_controller.py` for a student distance-to-speed
feedback rule. The supplied controller does not read them. The current
`update(pose)` method receives position and heading, with no time interval.
Keep `TARGET_LOCATION_KI` and `TARGET_LOCATION_KD` at zero for this challenge.

## Your report

Submit one report per pair with both names, robot identification, selected components, world, and trial settings. Label virtual results separately from physical measurements.

1. **Preliminary lab work:** give the odometry model, straight/turn/arc input-output checks, navigation checks, and reasoning behind calibration and controller choices. Include a square check if performed.
2. **Challenge data:** show the route trace and estimated heading, and tabulate requested, estimated, and measured final position and heading for physical runs. Include visit order and relevant settings.
3. **Challenge performance:** state which goals and final-heading requirement were reached, and quantify final position and heading errors using the axle midpoint.
4. **Reflection:** use the preliminary and route data to distinguish pose-estimation error from controller behavior. Identify one supported improvement and the measurement that would test it.

## Project files

<strong class="student-file">Blue *</strong>: code to implement. <strong class="config-file">Amber †</strong>: settings to adjust. <span class="supplied-file">Gray S</span>: code provided or completed in an earlier challenge. `main.py` is supplied; controlled experiments may edit it.

<div class="project-file-table">

| File | What it does |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Runs navigation and reports independently counted arrivals and final pose. |
| <span class="supplied-file"><code>route_progress.py</code> S</span> | Checks estimated-pose arrival at ordered goals using current tolerances. |
| <strong class="student-file"><code>odometry.py</code> *</strong> | Accumulates wheel increments to estimate position and heading. |
| <strong class="student-file"><code>navigation_controller.py</code> *</strong> | Uses estimated pose to reach ordered destinations. |
| <span class="supplied-file"><code>sensor_processor.py</code> S</span> | Converts encoder readings into wheel travel and speed; also contains range estimation. |
| <span class="supplied-file"><code>differential_drive.py</code> S</span> | Converts forward speed and turn rate into wheel-speed targets. |
| <strong class="config-file"><code>robot_setup.py</code> †</strong> | `sample_period_ms` — scheduled measurement interval in ms; 20 ms requests 50 Hz.<br>`wheel_diameter_mm` — wheel diameter in mm used to convert encoder counts to travel.<br>`encoder_counts_per_revolution` — encoder counts for one wheel revolution.<br>`track_width_mm` — wheel spacing in mm used for turning and odometry.<br>`left_start_command`, `right_start_command` — supplied motor commands for starting each wheel.<br>`left_speed_command_gain`, `right_speed_command_gain` — supplied motor-command coefficients per requested wheel speed.<br>`wheel_speed_kp` — supplied correction per wheel-speed error.<br>`wheel_speed_ki`, `wheel_speed_kd` — reserved settings; keep zero because the supplied controller does not use them.<br>`max_drive_command` — largest permitted absolute motor command.<br>`USE_STUDENT_SENSOR_PROCESSOR`, `USE_STUDENT_DIFFERENTIAL_DRIVE`, `USE_STUDENT_ODOMETRY`, `USE_STUDENT_NAVIGATION_CONTROLLER` — True uses each corresponding project class; False uses its supplied class.<br>`cruise_speed_mm_s` — forward speed in mm/s away from a goal.<br>`approach_speed_mm_s` — forward speed near a goal; 80% of the Cruise speed setting.<br>`slowdown_distance_mm` — distance in mm at which approach speed replaces cruise speed.<br>`turn_rate_rad_s` — maximum turning rate in rad/s.<br>`position_tolerance_mm` — distance error in mm accepted at a goal.<br>`heading_tolerance_rad` — heading error in rad accepted for alignment.<br>`realign_heading_rad` — heading error in rad that pauses forward travel for turning. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | `INITIAL_POSE` — starting pose read from the world.<br>`ROUTE` — world waypoint sequence in visit order. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | `CRUISE_SPEED` — Monitor Cruise speed setting in mm/s.<br>`TURN_RATE` — Monitor Turn rate limit in rad/s. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Runs component input/output examples without driving. |
| <strong class="config-file"><code>world.json</code> †</strong> | `default_world` — world used when none has been selected.<br>`bounds` — arena edges in mm.<br>`initial_pose` — starting position in mm and heading in rad.<br>`markers` — start, target, or waypoint locations in mm. |

</div>

## Functions and methods

Keep the template method names and arguments. Use measured `dt_s` or sample
timestamps for calculations involving time. Keep the supplied wheel-controller
settings in `robot_setup.py`. The API Reference gives the full record fields
and method requirements.



| Function or method | Input | Return or effect |
| --- | --- | --- |
| `Odometry.reset(initial_pose)` | Known `Pose` in mm and rad | Stores and returns starting `Pose`. |
| `Odometry.update(left_increment_mm, right_increment_mm)` | Signed wheel increments in mm | Updated estimated `Pose`. |
| `Odometry.pose` | Property read after reset | Latest estimated `Pose`. |
| `NavigationController.start(goals)` | Ordered `NavigationGoal` values | Starts at first goal; an empty route is complete. |
| `NavigationController.set_config(config)` | Complete `NavigationConfig` | Inherited method changes settings without restarting the route. |
| `NavigationController.update(pose)` | Estimated `Pose` | Next `MotionCommand` in mm/s and rad/s. |
| `NavigationController.current_goal()` | None | Active goal or `None`. |
| `NavigationController.is_complete()` | None | Boolean route-completion status. |
| `count_reached_goals(pose, route, reached_count, config)` | Estimated pose, ordered goals, previous count, current settings | Updated independently observed arrival count. |
