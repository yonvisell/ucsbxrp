# Challenge 1 · Robot Curling

## Task

Drive 1000 mm along the lane and stop the front center of the robot as close
to the target as possible, in the least time. Align that same point with the
start mark. Develop wheel measurements, wheel-speed feedback, and a
stopping rule based on measured distance. Complete the measurements and
method checks before target trials. The supplied `main.py` shows the sample
loop, calls your stopping rule with measured remaining distance, requests the
returned straight speed, and stops after confirming wheel rest. Your rule
chooses when to slow and request zero speed.

## 1. Measure the wheels

1. **Measure motor response.** Determine how each wheel’s speed depends on
   motor command. Open the **Motor Characterization**
   demonstration. Use the Virtual XRP to inspect it if useful, then measure
   the physical robot. Record motor command, steady left and right wheel
   speed, battery condition, and whether the wheels were raised or on the
   floor.
2. **Calibrate each wheel.** Obtain a starting estimate of the command needed
   for a requested wheel speed. Plot steady speed against command for each wheel.
   Estimate the command needed to start motion and the additional command per
   mm/s. Enter the separate left/right start commands and speed gains in
   `robot_setup.py`; its initial numbers are example virtual settings.
   Measure the driven-wheel diameter and enter `wheel_diameter_mm` there.
   `encoder_counts_per_revolution` is the encoder count for one complete wheel
   revolution; retain the supplied 585 unless your encoder specification differs.
3. **Implement wheel measurements.** Convert encoder readings into distances
   and speeds for feedback and odometry. In `sensor_processor.py`, implement
   `SensorProcessor.reset(raw)` and `SensorProcessor.update(raw)`. Use encoder counts,
   configured signs, wheel diameter, counts per revolution, and timestamps
   to return a `Measurements` record with wheel positions and latest increments
   in mm, speed estimates in
   mm/s, and `dt_s` in seconds. Reset establishes zero travel and speed.
   Keep increments unsmoothed, estimate speed from recent samples, and
   preserve the raw range, button, and reflectance fields. `estimate_range`
   is for a later challenge.
4. **Check encoder outputs.** Select **Test functions** to run defined
   input/output examples for each component method. Compare calculated travel
   with a measured wheel rotation and compare single-sample and averaged
   speed estimates. Check forward and reverse counts. Set
   `USE_STUDENT_SENSOR_PROCESSOR = True` in `robot_setup.py` to use this class
   during a run.

## 2. Control wheel speed

1. **Implement motor feedback.** Correct differences between requested and
   measured wheel speeds. In `wheel_speed_controller.py`, implement
   `WheelSpeedController.update(target, measured)`. For each wheel, use its
   requested and measured speed to return a normalized `DriveCommand`. Use
   the motor calibration in `robot_setup.py`, return zero command for a zero
   target, and respect `max_drive_command`. If your controller retains history,
   clear it in `reset()`.
2. **Check command outputs.** Use the corresponding **Test functions** examples
   for positive, negative, and zero speed requests. Check that increasing
   speed error changes the command as intended without exceeding the limit.
   Set `USE_STUDENT_WHEEL_SPEED_CONTROLLER = True` in `robot_setup.py` to
   use this class during a run.

## 3. Develop and test the stopping rule

1. **Implement the stopping rule.** Choose the speed needed to approach the
   target and stop. In `stopping_controller.py`, implement
   `speed_for_distance(remaining_mm)`. The input is target distance minus
   measured mean wheel travel, in mm. Return a finite, nonnegative next
   forward-speed request in mm/s; zero makes the final stop request. Decide
   how speed depends on remaining distance and when to request zero.
2. **Connect the live controls.** Make the speed and slowing distance adjustable
   while observing the run. The Monitor **Cruise speed** control sets
   `CRUISE_SPEED_MM_S.value` in `live_variables.py`, in mm/s. Use it in your
   function as the chosen upper travel speed. **Slowing distance** sets
   `SLOWDOWN_DISTANCE_MM.value`, in mm; use it to define where your rule
   changes its speed request. Both values are read when the function is
   called, so a slider change affects the next decision. Their starting
   values are adjustable defaults, not measured stopping distances.
3. **Compare feedback settings.** Assess how feedback changes speed error and
   oscillation. With the same calibration and stopping
   rule, compare requested and measured wheel speeds in repeated runs of
   `main.py`.
   Change `wheel_speed_kp` in `robot_setup.py` to compare feedback settings;
   zero removes its proportional correction. Record speed error, oscillation,
   and sustained command limiting to justify the value you use.
4. **Inspect the approach.** During these preparation runs, inspect plotted
   remaining distance and requested speed as the robot approaches the target.
   The Virtual XRP can help you revise the rule before floor runs. Change one
   setting at a time. Check where the rule requests slowing and zero, and
   whether wheel speed continues after the zero request.

## 4. Run the challenge

1. **Compare floor runs.** Run the selected rule on the floor. Keep starting
   position and alignment consistent, change one setting at a time, and
   retain runs that stop short, overshoot, or fail to move.
2. **Measure the outcome.** For each run, record settings, stopping reason,
   estimated motion time, signed encoder `remaining_mm`, front-center
   distance from the target (short or beyond), and final heading. Compare
   repeated results before choosing a change intended to improve accuracy
   and time.

## Your report

Submit one report per pair with both names and the robot used. Distinguish
virtual from physical results.

1. **Preliminary lab work:** show encoder conversion and motor calibration
   measurements, the implemented feedback and stopping decisions, and the
   evidence used to choose calibration and settings.
2. **Challenge data:** provide labeled speed and remaining-distance plots and
   a table of settings, stopping reason, motion time, signed floor error, and
   final heading for the runs compared.
3. **Challenge performance:** identify the run that best balances target
   accuracy, time, and repeatability, using measured values.
4. **Reflection:** explain differences between encoder remaining distance and
   floor position, and how speed estimation, wheel-speed feedback, or the
   stopping rule affected the outcome. Justify a specific improvement from
   your data.

## Project files

<strong class="student-file">Blue *</strong>: code to implement.
<strong class="config-file">Amber †</strong>: settings to adjust.
<span class="supplied-file">Gray S</span>: code provided or completed earlier.
`main.py` is supplied and normally unchanged; a controlled experiment may
still edit it. **Test functions** checks the project files regardless of the
`USE_STUDENT_*` flags. **Run** uses the classes selected in `robot_setup.py`;
`speed_for_distance` is called directly and has no selector. After its first
zero request, `main.py` keeps requesting zero until the measured wheel speeds
stay below 5 mm/s for 0.3 s. `motion_timer.py` calculates motion time and
confirms that rest interval from the measurements; it does not command motion.

<div class="project-file-table">

| File | What it does |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Shows the straight control loop, calls your stopping rule, latches the first zero request, prints the measured outcome, and stops the motors on exit. |
| <strong class="student-file"><code>sensor_processor.py</code> *</strong> | Converts encoder readings into wheel travel and speed; also contains later range estimation. |
| <strong class="student-file"><code>wheel_speed_controller.py</code> *</strong> | Calculates left and right motor commands from target and measured wheel speeds. |
| <strong class="student-file"><code>stopping_controller.py</code> *</strong> | Contains your distance-based stopping rule. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | Declares Cruise speed and Slowing distance controls and publishes the remaining-distance, requested-speed, and motion-time signals. |
| <strong class="config-file"><code>robot_setup.py</code> †</strong> | Holds robot calibration and settings, selects components, and constructs the robot. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | Reads the start and target from `world.json`, calculates travel distance, and sets the measured-rest thresholds. |
| <span class="supplied-file"><code>motion_timer.py</code> S</span> | Computes estimated motion time and continuous rest from measured wheel speeds without choosing or applying a command. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Checks component methods without driving. |
| <strong class="config-file"><code>world.json</code> †</strong> | Defines arena geometry, start pose, tracks, obstacles, and markers. |

</div>

## Parameters and functions

Keep the method names and arguments in the templates. The API Reference gives
the full field definitions; the Guide explains project-file selection.

![SensorProcessor template open in the IDE.](course-assets/method-template.jpg)

*Figure. `sensor_processor.py` is selected in the IDE Project file list, with its
class and unfinished method bodies open in the editor.*

### Parameters

| Setting | Source and units | Effect |
| --- | --- | --- |
| Cruise speed | Monitor control declared in `live_variables.py`; mm/s | Chosen upper travel speed available to `speed_for_distance`. |
| Slowing distance | Monitor control declared in `live_variables.py`; mm | Chosen distance at which the stopping rule can begin reducing speed. |
| `wheel_speed_kp` | `robot_setup.py`; s/mm | Proportional motor-command change per mm/s of wheel-speed error; zero removes that correction. |
| Left/right start commands and speed gains | `robot_setup.py`; dimensionless and s/mm | Map each requested wheel speed to its calibrated motor command. |
| `max_drive_command` | `robot_setup.py`; dimensionless | Limits the absolute command sent to either wheel. |

Live controls show their applied values. Keep a setting fixed during a
recorded comparison; `speed_for_distance` reads the controls through `.value`.

### Functions and methods

| Function or method | Input | Return or effect |
| --- | --- | --- |
| `SensorProcessor.reset(raw)` | First `RawSensors` sample: encoder counts and ms | `Measurements` with zero travel, speed, and interval. |
| `SensorProcessor.update(raw)` | Next chronological `RawSensors` sample | `Measurements` with wheel position/increment in mm, speed in mm/s, and interval in s. |
| `WheelSpeedController.reset()` | None | Clears retained feedback state. |
| `WheelSpeedController.update(target, measured)` | Two `WheelSpeeds` values in mm/s | Bounded normalized left/right `DriveCommand`. |
| `speed_for_distance(remaining_mm)` | Measured remaining distance in mm | Forward speed in mm/s; zero requests the final stop. |
| `MotionTimer.update(measurements, stop_requested)` | Latest `Measurements` and whether your rule has requested zero | Updates `motion_time_s`, `moved`, and `stop_confirmed`; returns no command. |
