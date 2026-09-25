# Challenge 2 · Arena Line Circuit

## Task

Follow the dark tape line for one counterclockwise lap, pass four checkpoints
in order, and stop at the start/finish bar. Use the two floor sensors for local
steering and the wheel measurements and speed control developed in Robot
Curling. Complete the sensor measurements and method checks before lap trials.
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
   reflectance_readout.py → Make main**, then **Compile** and **Run** with the
   robot stationary at its normal sensor height. Selecting a file in the
   editor alone does not change what Run executes. The readout prints ten left/right reading
   pairs. Place the sensors over bare floor, centered on the narrow tape,
   displaced to either side, and over the wide finish bar. Repeat placements
   and record the range of both readings. Values near 0 indicate a light
   surface; values near 1 indicate a dark surface.
2. **Set detection thresholds.** Use the paired readings to choose
   `LINE_VISIBLE_THRESHOLD` and `FINISH_THRESHOLD` in `robot_config.py`.
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
   as an initial `track_width_mm` estimate in `robot_config.py`.
   Account for straight motion, rotation in place, and simultaneous forward
   motion and turning. A positive turn rate requires the right target speed
   to exceed the left.
2. **Check motion cases.** Use **Test functions** to run defined input/output
   examples for straight, in-place, and combined motion. Set
   `USE_STUDENT_DIFFERENTIAL_DRIVE = True` in `course_setup.py` to use your
   class during a run.
3. **Reuse wheel control.** Copy the completed `sensor_model.py` and
   `wheel_speed_controller.py` from Robot Curling into the files of the same
   names in this project. Copy your measured calibration values into
   `robot_config.py`, keeping the line-following settings. Select the two
   classes with their matching flags in `course_setup.py`.
   `component_checks.py` also checks that `SensorModel` preserves floor readings
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
   inherited `reset()` clears feedback history before a run.
3. **Connect the live controls.** Adjust travel speed and steering response
   without rewriting the controller. The Monitor **Cruise speed** control is a
   forward-speed setting in mm/s. **P gain** is `kp_rad_s`, the proportional
   coefficient that converts dimensionless left-minus-right sensor error
   into a turn-rate contribution
   in rad/s. `live_variables.py` declares both controls;
   `apply_line_controls()` in `robot_config.py` copies their current values
   into `follower.settings` before each sensor update. Make your controller
   use those entries so changes affect the next motion request. The supplied
   settings also contain a derivative term; P gain changes only the
   proportional term. Choose whether additional terms or turn-dependent speed
   reduction improve tracking. The initial values are adjustable defaults.
4. **Check steering responses.** Use the corresponding **Test functions**
   examples to check centered, left-dark, and right-dark readings, output
   bounds, and reset behavior. Then select
   `USE_STUDENT_LINE_FOLLOWER = True` in `course_setup.py`. Restore **Actions for
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
still edit it. **Test functions** checks project files regardless of the
`USE_STUDENT_*` flags. **Run** uses the classes selected in `course_setup.py`;
turn on and check each new class separately.

<div class="project-file-table">

| File | What it does |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Runs line following and stops at lap completion or persistent line loss. |
| <strong class="student-file"><code>differential_drive.py</code> *</strong> | Converts forward speed and turn rate into left/right wheel-speed targets. |
| <strong class="student-file"><code>line_follower.py</code> *</strong> | Uses paired floor readings to request forward speed and turn rate. |
| <span class="supplied-file"><code>sensor_model.py</code> S</span> | Completed wheel measurement component; preserves floor readings. |
| <span class="supplied-file"><code>wheel_speed_controller.py</code> S</span> | Completed wheel-speed feedback component. |
| <strong class="config-file"><code>robot_config.py</code> †</strong> | Holds robot calibration, line thresholds, follower settings, and live control application. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | Loads course geometry and holds checkpoint and line-loss settings. |
| <strong class="config-file"><code>course_setup.py</code> †</strong> | Selects component implementations and creates the robot and follower. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Checks component methods without driving. |
| <span class="supplied-file"><code>lap_progress.py</code> S</span> | Counts ordered checkpoints from estimated position and confirms the finish bar. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | Declares controls and publishes sensor, steering, and lap values. |
| <span class="supplied-file"><code>reflectance_readout.py</code> S</span> | Prints ten stationary left/right floor-sensor pairs. |
| <strong class="config-file"><code>world.json</code> †</strong> | Defines arena geometry, start pose, tracks, obstacles, and markers. |

</div>

## Parameters and functions

Keep the method names and arguments in the templates. The API Reference gives
full field definitions; the Guide explains project-file selection.

### Parameters

| Setting | Location and units | Use |
| --- | --- | --- |
| Cruise speed | `live_variables.py`; mm/s | Copied to `follower.settings["cruise_speed_mm_s"]` each sample. |
| P gain | `live_variables.py`; rad/s per unit reflectance difference | Copied to `follower.settings["kp_rad_s"]` each sample. |
| `maximum_turn_rate_rad_s` | `robot_config.py`; rad/s | Limits requested turning. |
| `LINE_VISIBLE_THRESHOLD` | `robot_config.py`; normalized reflectance | Minimum reading at either sensor for visible line. |
| `FINISH_THRESHOLD` | `robot_config.py`; normalized reflectance | Minimum reading at both sensors for the wide bar. |
| `CHECKPOINT_TOLERANCE_MM` | `challenge.py`; mm | Radius of each ordered estimated-position region. |
| `MAXIMUM_LOST_LINE_S` | `challenge.py`; s | Stops a run after persistent line loss; the robot requests zero motion during that interval. |

Live controls show their applied values. Keep a setting fixed during a
recorded comparison; `apply_line_controls()` copies slider values to the
follower settings at each sample boundary.

### Functions and methods

| Function or method | Input | Return or effect |
| --- | --- | --- |
| `DifferentialDrive.wheel_speeds(command)` | `MotionCommand` in mm/s and rad/s | Left/right `WheelSpeeds` in mm/s. |
| `LineFollower.update(reflectance, dt_s)` | Paired `ReflectanceReadings`, interval in s | `MotionCommand` in mm/s and rad/s. |
| `LineFollower.reset()` | None | Clears retained error state; inherited from `LineFollowerBase`. |
| `LapProgress.observe_line(readings, dt_s, threshold)` | Paired readings, interval, threshold | Visibility Boolean; updates retained line-loss duration. |
| `LapProgress.update(pose, on_finish, confirm_samples)` | Estimated `Pose`, finish detection, sample count | `True` after four ordered checkpoints and confirmed finish-bar return. |
