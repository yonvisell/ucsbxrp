# Challenge 2 · Arena Line Circuit

## Task

Follow the dark tape line for one counterclockwise lap, pass four checkpoints
in order, and stop at the start/finish bar. Use the two floor sensors for local
steering, the wheel measurements developed in Robot Curling, and the
supplied library wheel-speed controller. Complete the sensor measurements and method checks before lap trials.
`main.py` manages the lap and stops after completion or persistent line loss;
your controller chooses the motion on each sensor sample.

![Tape circuit with start and finish bar, four checkpoints, and travel direction.](course-assets/arena-line-circuit.svg)

*Figure. Circuit 1 in the 3048 × 1219.2 mm arena. The dark loop is the floor
track and the wide crossbar is the start/finish bar. The blue region and dot
mark the start and axle pose; numbered dots mark the ordered checkpoint
regions; arrows show counterclockwise travel. Monitor's World menu offers
seven other circuits, also defined in `world.json`.*

## 1. Measure the floor sensors

1. **Measure reflectance.** Establish how the two sensors distinguish the floor,
   line, and finish bar. In the file list, open **Actions for
   experiment_reflectance_readout.py → Make main**, then **Compile** and **Run** with the
   robot stationary at its normal sensor height. Selecting a file in the
   editor alone does not change what Run executes. The readout prints ten left/right reading
   pairs. Place the sensors over bare floor, centered on the narrow tape,
   displaced to either side, and over the wide finish bar. Repeat placements
   and record the range of both readings. Values near 0 indicate a light
   surface; values near 1 indicate a dark surface.
2. **Set detection thresholds.** Use the paired readings to choose
   `LINE_VISIBLE_THRESHOLD` and `FINISH_THRESHOLD` in `robot_setup.py`.
   The first is compared with the darker of the two sensors; the second is
   compared with the lighter sensor when recognizing the wide bar. Check
   whether the observed line, lost-line,
   and finish-bar cases separate under those comparisons. If they overlap,
   inspect sensor height, tape width, and lighting before choosing thresholds.
   The supplied values are starting defaults for a particular setup.

## 2. Convert motion requests to wheel speeds

1. **Implement wheel-speed conversion.** Calculate wheel-speed targets for a
   requested forward speed and turn rate. In `differential_drive.py`, implement
   `DifferentialDrive.wheel_speeds(command)`. Read axle-center forward speed
   in mm/s, counterclockwise turn rate in rad/s, and
   `self.config.track_width_mm`; return left/right `WheelSpeeds` in mm/s.
   Measure the center-to-center spacing of the driven wheels at the floor
   as an initial `track_width_mm` estimate in `robot_setup.py`.
   Account for straight motion, rotation in place, and simultaneous forward
   motion and turning. A positive turn rate requires the right target speed
   to exceed the left.
2. **Check motion cases.** Use **Run code tests** to run defined input/output
   examples for straight, in-place, and combined motion. Set
   `USE_STUDENT_DIFFERENTIAL_DRIVE = True` in `robot_setup.py` to use your
   class during a run.
3. **Reuse wheel measurements.** Copy the completed `sensor_processor.py`
   from Robot Curling into this project and set
   `USE_STUDENT_SENSOR_PROCESSOR = True` in `robot_setup.py`. Keep this
   project's line-following settings and supplied library wheel controller.
   Transfer the same robot's geometry settings if physical measurements
   changed them.
   `component_checks.py` also checks that `SensorProcessor` preserves floor readings
   in `Measurements`.

## 3. Build local line following

1. **Implement line following.** Use differences in the floor readings to
   correct the robot’s displacement from the line. In `line_follower.py`, implement
   `LineFollower.update(reflectance, dt_s)`. Read normalized
   `reflectance.left` and `.right` and interval `dt_s`; return a
   `MotionCommand` with forward speed in mm/s and turn rate in rad/s. Record
   left minus right as `self.line_error`. A darker left reading needs a positive
   turn request; a darker right reading needs a negative one.
2. **Apply follower settings.** Use `self.settings` for your chosen feedback
   law. While following, keep speed between `minimum_speed_mm_s` and
   `cruise_speed_mm_s`; bound turn rate by `maximum_turn_rate_rad_s`. The
   inherited `reset()` sets the preceding error and accumulated error to zero before a run.
3. **Connect the live controls.** Adjust travel speed and steering response
   without rewriting the controller. The Monitor **Cruise speed** control is a
   forward-speed setting in mm/s. **P gain** is `kp_rad_s`, the proportional
   coefficient that converts dimensionless left-minus-right sensor error
   into a turn-rate contribution
   in rad/s. `live_variables.py` declares both controls;
   `apply_line_controls()` in `robot_setup.py` copies their current values
   into `follower.settings` before each sensor update. Make your controller
   use those entries so changes affect the next motion request. The supplied
   settings also contain a derivative term; P gain changes only the
   proportional term. Choose whether additional terms or turn-dependent speed
   reduction improve tracking. The initial values are adjustable defaults.
4. **Check steering responses.** Use the corresponding **Run code tests**
   examples to check centered, left-dark, and right-dark readings, output
   bounds, and reset behavior. Then select
   `USE_STUDENT_LINE_FOLLOWER = True` in `robot_setup.py`. Restore **Actions for
   main.py → Make main**, then **Compile** and **Run**. Inspect sensor readings, `line_error`,
   and requested turn rate through a straight segment and a bend, using the
   Virtual XRP if useful. Revise the controller if it oscillates, cuts a bend,
   or loses the line.

## 4. Run the challenge

1. **Compare lap settings.** Determine how speed and steering gain affect lap
   completion and time. Start consistently in the marked start region.
   Compare settings by changing one of Cruise speed or P gain at a time.
   Record incomplete runs as well as full laps. Observe where the robot
   crosses each physical checkpoint and whether it stops at the bar or after
   losing the line.
2. **Record lap outcomes.** Record each run's settings, elapsed time, stopping
   reason, and reported checkpoint count. The count comes from estimated
   position entering ordered regions, while the finish bar is detected by
   both floor sensors. Compare the reported count with observations on the
   floor; a count mismatch
   and a tracking failure need different explanations.

## Save and plot each trial

If Monitor’s controls are collapsed, select **›** at its upper left to reach
the plot and export settings.

1. Before **Run**, record the world, selected student flags, calibration,
   sample period, and live-control values. Keep those values fixed during a
   comparison trial. Number every run, including incomplete runs.
2. After the run ends, use **Monitor → Export → Export run data as CSV** and
   **Export program output**. Select **Include code in ZIP** and **Export run
   data (ZIP)** to retain the code and settings used. Name exports by pair,
   challenge, target, and trial, for example `pair07_ch2_virtual_trial01.csv`.
   Wait for export completion and open the saved files to check their contents.
3. Load the CSV in MATLAB with the commands below. Keep the original CSV;
   filtering the table selects processed course samples for these plots.
   Virtual physics observations and raw acquisition rows remain in the file.
   Use the same axis limits when comparing settings. Put trial number and
   settings in each figure title or caption.

```matlab
T = readtable('pair07_ch2_virtual_trial01.csv', ...
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
figure;
subplot(2,1,1);
plot(t,T.program_reflectance_left,t,T.program_reflectance_right);
xlabel('Time from first encoder acquisition (s)'); ylabel('Reflectance (0 light, 1 dark)');
legend('Left','Right','Location','best'); ylim([0 1]); grid on;
subplot(2,1,2); plot(t,T.requested_turn_rate_rad_s);
xlabel('Time from first encoder acquisition (s)'); ylabel('Requested turn rate (rad/s)'); grid on;
figure; plot(t,T.program_line_error);
xlabel('Time from first encoder acquisition (s)'); ylabel('Left minus right reflectance'); grid on;
exportgraphics(gcf,'trial01_line_error.png','Resolution',200);
```

Replace the filename above with the line trial CSV. Include a full-lap view and
an enlarged bend interval using `xlim([start_s end_s])`. Report settings,
checkpoint count, reason, and elapsed time for each trial; repeat the selected
settings three times. Keep the finish confirmation at 0.08 s of measured time
when changing `sample_period_ms`.

To inspect the sample timing, select **Monitor → Plot signals → Control period**.
The plot compares the measured interval between sensor samples with the
configured period, both in ms. Use measured elapsed time in calculations;
the arrival time of a telemetry message in the browser is not the sample time.

## Reading main.py

1. **Create the objects.** Imports bring in the world start/checkpoints,
   detection thresholds, and selected component constructors.
   `robot = make_robot(ROBOT_CONFIG)` assembles the same measurement and
   motor-control objects used in Challenge 1. `follower` is a separate
   `LineFollower` object; `reset()` sets its preceding error and accumulated error to zero.
   `lap = LapProgress()` stores ordered checkpoint progress and finish-bar
   and line-loss durations.
2. **Read the first floor sample.**
   `robot.start(INITIAL_POSE, read_reflectance=True)` resets the robot and
   returns `state`. `state.measurements.reflectance` contains named `left`
   and `right` readings. Both are normalized: 0 is light, 1 is dark.
3. **Check progress and line visibility.** Each loop copies the current live
   settings to `follower`, then reads the latest floor values. Missing readings
   end the trial. The smaller reading must meet `FINISH_THRESHOLD` to count
   a wide bar. `lap.update()` counts checkpoints from `state.pose`; after
   leaving the start and passing every checkpoint, it confirms the finish
   bar for `FINISH_CONFIRM_TIME_S` (0.08 s) of measured elapsed time.
4. **Choose motion.** `lap.observe_line()` checks whether either sensor sees
   the line and accumulates actual `dt_s` while both lose it. While the line
   is absent, `STOP_COMMAND` requests zero motion; persistent loss ends the
   trial. Otherwise, `follower.update(readings, dt_s)` returns forward speed
   and turn rate in a `MotionCommand`. Use `dt_s` for error integrals and
   derivatives so changing control frequency does not change their units.
5. **Apply and repeat.** `publish_line_values()` sends readings, line error,
   turn request, and checkpoint count to Monitor.
   `robot.step(command, read_reflectance=True)` applies wheel-speed feedback,
   obtains the next encoder/floor sample, and returns the next `RobotState`.
   The loop repeats with that state. Completion or line loss prints its
   reason and elapsed time; `finally` removes motor effort after normal completion or a Python exception.
   IDE **Stop** also requests a stop through the target service; it may
   interrupt Python before `finally` executes.

## Your report

Submit one report per pair with both names and the robot used. Distinguish
virtual from physical results.

1. **Preliminary lab work:** tabulate paired floor readings at each placement,
   justify the detection thresholds, give the wheel-speed conversion and the
   implemented line-following rule, and show the checks used to select them.
2. **Challenge data:** include labeled sensor and requested-turn plots through
   a bend and a table of settings, completion or stopping reason, observed and
   reported checkpoints, and elapsed time for the compared laps.
3. **Challenge performance:** compare reliable completion and speed across
   the recorded trials; if no lap completed, identify where runs ended.
4. **Reflection:** explain any line loss, overshoot, or checkpoint-count
   mismatch from the measurements, and justify one specific improvement.

## Project files

<strong class="student-file">Blue *</strong>: code to implement.
<strong class="config-file">Amber †</strong>: settings to adjust.
<span class="supplied-file">Gray S</span>: code provided or completed earlier.
`main.py` is supplied and normally unchanged; a controlled experiment may
still edit it. **Run code tests** checks project files regardless of the
`USE_STUDENT_*` flags. **Run** uses the classes selected in `robot_setup.py`;
turn on and check each new class separately.

<div class="project-file-table">

| File | What it does |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Runs line following and stops at lap completion or persistent line loss. |
| <strong class="student-file"><code>differential_drive.py</code> *</strong> | Converts forward speed and turn rate into left/right wheel-speed targets. |
| <strong class="student-file"><code>line_follower.py</code> *</strong> | Uses paired floor readings to request forward speed and turn rate. |
| <span class="supplied-file"><code>sensor_processor.py</code> S</span> | Completed wheel measurement component; preserves floor readings. |
| <strong class="config-file"><code>robot_setup.py</code> †</strong> | `sample_period_ms` — scheduled measurement interval in ms; 20 ms requests 50 Hz.<br>`wheel_diameter_mm` — wheel diameter in mm used to convert encoder counts to travel.<br>`encoder_counts_per_revolution` — encoder counts for one wheel revolution.<br>`track_width_mm` — wheel spacing in mm used for turning and odometry.<br>`left_start_command`, `right_start_command` — supplied motor commands for starting each wheel.<br>`left_speed_command_gain`, `right_speed_command_gain` — supplied motor-command coefficients per requested wheel speed.<br>`wheel_speed_kp` — supplied correction per wheel-speed error.<br>`wheel_speed_ki`, `wheel_speed_kd` — reserved settings; keep zero because the supplied controller does not use them.<br>`max_drive_command` — largest permitted absolute motor command.<br>`USE_STUDENT_SENSOR_PROCESSOR`, `USE_STUDENT_DIFFERENTIAL_DRIVE`, `USE_STUDENT_LINE_FOLLOWER` — True uses the corresponding project class; False uses the supplied class.<br>`cruise_speed_mm_s`, `minimum_speed_mm_s` — upper and lower forward-speed settings in mm/s.<br>`kp_rad_s` — turn-rate coefficient for left-minus-right reflectance.<br>`ki_rad_s2` — coefficient for reflectance error accumulated over time.<br>`kd_rad` — coefficient for how quickly reflectance error changes.<br>`integral_limit_s` — limit on accumulated reflectance error.<br>`maximum_turn_rate_rad_s` — largest absolute steering rate in rad/s.<br>`turn_slowdown` — fraction of cruise speed removed at the maximum steering rate.<br>`LINE_VISIBLE_THRESHOLD` — minimum reading at either floor sensor for line detection.<br>`FINISH_THRESHOLD` — minimum reading at both floor sensors for the finish bar.<br>`FINISH_CONFIRM_TIME_S` — continuous finish-bar interval in s after all checkpoints. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | `INITIAL_POSE` — starting pose read from the selected world.<br>`CHECKPOINTS_MM` — ordered checkpoint positions read from the world.<br>`CHECKPOINT_TOLERANCE_MM` — radius in mm accepted around each checkpoint.<br>`MAXIMUM_LOST_LINE_S` — continuous lost-line interval in s that ends the run. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Checks component methods without driving. |
| <span class="supplied-file"><code>lap_progress.py</code> S</span> | Counts ordered checkpoints from estimated position and confirms the finish bar. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | `CRUISE_SPEED` — Monitor Cruise speed setting in mm/s.<br>`P_GAIN` — Monitor P gain setting: turning correction per left-minus-right reflectance. |
| <span class="supplied-file"><code>experiment_reflectance_readout.py</code> S</span> | Prints ten stationary left/right floor-sensor pairs. |
| <strong class="config-file"><code>world.json</code> †</strong> | `default_world` — world used when none has been selected.<br>`bounds` — arena edges in mm.<br>`initial_pose` — starting position in mm and heading in rad.<br>`markers` — start, target, or waypoint locations in mm.<br>`tracks` — tape-line paths and widths in mm. |

</div>

## Functions and methods

Keep the template method names and arguments. Use measured `dt_s` or sample
timestamps for calculations involving time. Keep the supplied wheel-controller
settings in `robot_setup.py`. The API Reference gives the full record fields
and method requirements.



| Function or method | Input | Return or effect |
| --- | --- | --- |
| `DifferentialDrive.wheel_speeds(command)` | `MotionCommand` in mm/s and rad/s | Left/right `WheelSpeeds` in mm/s. |
| `LineFollower.update(reflectance, dt_s)` | Paired `ReflectanceReadings`, interval in s | `MotionCommand` in mm/s and rad/s. |
| `LineFollower.reset()` | None | Sets preceding and accumulated errors to zero; inherited from `LineFollowerBase`. |
| `LapProgress.observe_line(readings, dt_s, threshold)` | Paired readings, interval, threshold | Visibility Boolean; updates retained line-loss duration. |
| `LapProgress.update(pose, on_finish, dt_s, confirm_time_s)` | Estimated `Pose`, finish detection, measured interval and confirmation time in s | `True` after four ordered checkpoints and confirmed finish-bar return. |
