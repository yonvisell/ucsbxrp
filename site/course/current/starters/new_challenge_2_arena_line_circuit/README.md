# Challenge 2 · Arena Line Circuit

## Task

Follow the tape line for one complete counterclockwise lap, then stop at the
start/finish bar. Develop a line-following controller using the two floor
sensors and the wheel-speed control from Robot Curling. Compare how speed and
feedback settings affect completion of the circuit.

![Tape circuit with start and finish bar, four checkpoints, and travel direction.](course-assets/arena-line-circuit.svg)

*Figure. Circuit 1 in the 3048 × 1219.2 mm arena: the dark closed line is the
floor track; the wider crossbar marks start and finish. The blue rectangle and
dot mark the start region and axle pose, numbered dots mark ordered odometry
checkpoint regions, and teal arrows show counterclockwise travel. The seven
other circuits are selected as worlds in `world.json`.*

The checkpoint count advances when estimated position reaches each named region
in order. The count can differ from what is observed on the floor. The finish
bar is detected by the two floor sensors.

## 1. Floor-sensor measurements

Measure both sensors over bare floor, centered on the narrow tape, displaced
to either side of the tape, and over the wide finish bar. Use the supplied
`reflectance_readout.py` program with the robot stationary at its normal height.
The readings range from 0 for light to 1 for dark, with intermediate values.
Repeat the placements to see how much the readings vary.

Use these measurements to distinguish three situations: following the line,
losing the line, and crossing the finish bar. Choose the line-detection and
finish-detection thresholds from your measurements. If the situations give
similar readings, examine sensor placement, lighting, and tape width.

## 2. Line-following control

Derive the left and right wheel speeds needed for a requested forward speed
and turn rate. Check the equations for straight motion, rotation in place,
and a moving turn.

Develop a controller that uses the difference between the floor-sensor readings
to keep the robot following the line. Use the measured left and right offsets
to determine the direction of correction. For the supplied sensor convention,
a darker left reading requires positive (counterclockwise) turn rate and a darker right reading
requires negative turn rate. Decide how strongly to correct an offset and
whether to reduce speed during a turn.

Run the controller on the Virtual XRP. Observe straight sections and bends,
and compare the sensor readings with the requested turn rate. Revise the
controller if the robot oscillates, cuts a bend, or loses the line.

## 3. Circuit trials

Compare two settings using the **Cruise speed** or **P gain** slider in Monitor.
Change one control at a time. Run the
complete virtual circuit for each setting. If a run stops early, retain it in
your comparison. The supplied program stops when it detects line loss or
completion of the lap. Program output reports the stopping reason, checkpoint
count, and elapsed time.

Use the selected settings for two physical laps from the start/finish bar.
Observe passage through the four checkpoints, any loss of the line, and the
final stop. Compare your observations with the checkpoint count: that count
uses estimated robot position, so a counting error can differ from a
line-following error.

## Your report

Submit one report per pair, with both names, robot identification, and the
settings for each trial. Distinguish virtual and physical results.

1. **Sensing:** tabulate the paired readings at each placement and explain the
   two detection thresholds. Which placements were hardest to distinguish?
2. **Control:** give the wheel-speed equations and explain your line-following
   rule. Plot both sensor readings and requested turn rate through a bend.
   How did the controller respond as the robot moved across the line?
3. **Laps:** tabulate the setting, completion or stopping reason, observed
   checkpoints, reported checkpoint count, and lap time. Where did tracking
   break down? Which setting gave the best combination of reliable completion
   and speed, and what in the measurements explains that result?

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
| <span class="supplied-file"><code>main.py</code> S</span> | Runs line following and stops at lap completion or line loss. |
| <strong class="student-file"><code>differential_drive.py</code> *</strong> | Converts forward speed and turn rate into left and right wheel-speed targets. |
| <strong class="student-file"><code>line_follower.py</code> *</strong> | Uses the floor-sensor readings to calculate forward speed and turn rate. |
| <span class="supplied-file"><code>sensor_model.py</code> S</span> | Converts encoder readings into wheel travel and speed; also contains range estimation. |
| <span class="supplied-file"><code>wheel_speed_controller.py</code> S</span> | Calculates left and right motor commands from wheel-speed targets and measurements. |
| <strong class="config-file"><code>robot_config.py</code> †</strong> | Holds robot calibration, controller settings, and live control application. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | Loads the course geometry and holds named trial settings. |
| <strong class="config-file"><code>course_setup.py</code> †</strong> | Creates the robot using the selected component implementations. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Runs input/output examples for the component methods without driving. |
| <span class="supplied-file"><code>lap_progress.py</code> S</span> | Counts checkpoints from estimated position and recognizes the return across the finish bar. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | Declares Monitor controls and their starting values; publishes current sensor, steering, and lap values. |
| <span class="supplied-file"><code>reflectance_readout.py</code> S</span> | Prints ten left/right floor-sensor pairs while the robot is stopped. |
| <strong class="config-file"><code>world.json</code> †</strong> | Defines arena geometry, start pose, tracks, obstacles, and named markers shared by the robot and Monitor. |

</div>

## Parameters and functions

Reuse the completed components from the preceding challenge. The method templates and API specify inputs and outputs. The Guide explains
how to select your implementations and run a different project file.

### Parameters

| Setting | Source and units | Effect |
| --- | --- | --- |
| Cruise speed | Live control in `live_variables.py`; mm/s | Forward-speed setting passed to `LineFollower`. |
| P gain | Live control in `live_variables.py`; rad/s per unit reflectance difference | Changes turning response to a left/right line error. |
| `maximum_turn_rate_rad_s` | `robot_config.py`; rad/s | Caps the requested turn rate. |
| `LINE_VISIBLE_THRESHOLD` | `robot_config.py`; normalized reflectance | Minimum dark reading at either sensor before following continues. |
| `FINISH_THRESHOLD` | `robot_config.py`; normalized reflectance | Minimum reading at both sensors for the wide finish bar. |
| `CHECKPOINT_TOLERANCE_MM` | `challenge.py`; mm | Region radius for each ordered odometry checkpoint. |
| `MAXIMUM_LOST_LINE_S` | `challenge.py`; s | Stops a physical run after persistent line loss; the robot requests zero motion during that interval. |

Live controls show their applied values. Keep each setting fixed during a recorded comparison. The supplied program applies the sliders at each sample boundary.

### Functions and methods

| Function or method | Input | Return or effect |
| --- | --- | --- |
| `DifferentialDrive.wheel_speeds(command)` | `MotionCommand` in mm/s and rad/s | Left/right `WheelSpeeds` in mm/s. |
| `LineFollower.update(reflectance, dt_s)` | Paired normalized `ReflectanceReadings`, sample interval in s | `MotionCommand` in mm/s and rad/s. |
| `LineFollower.reset()` | None | Clears retained error state; inherited from `LineFollowerBase`. |
| `LapProgress.observe_line(readings, dt_s, threshold)` | Paired readings and interval in s | Visibility Boolean; updates the retained `lost_line_s` duration. |
| `LapProgress.update(pose, on_finish, confirm_samples)` | Estimated `Pose`, finish detection, sample count | `True` after four ordered checkpoints and a confirmed finish-bar crossing. |
