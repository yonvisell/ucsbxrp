# (Challenge 1) Motor Characterization

Observe how the two wheel speeds change when both motors receive the same
command. This supplied program runs three short motor-command intervals.

## 1. Run the supplied experiment

1. Open this Project from **New Project → Challenges**. Select **Virtual XRP**
   or your connected XRP. For a floor run, place the robot on a level surface
   with 2 m of clear space ahead and keep its wheels on the floor.
2. Open `experiment.py` to see the sequence. `EFFORTS` contains the motor
   commands `0.16`, `0.22`, and `0.28`. Each lasts 0.7 s, with 0.5 s at zero
   command before and after it. Keep these supplied values for the first run.
3. Select **Compile**, then **Run**. The program finishes after the sequence and
   prints `Motor characterization complete` in **Program output**. **Stop**
   ends a run early and removes motor effort.

## 2. Inspect the wheel response

1. Open **Monitor**. If its controls are collapsed, select **›** at the upper
   left. Under **Plot signals**, select **Motor effort**, **Left speed**, and
   **Right speed**. These three program signals show the command and its
   measured response. Motor effort is dimensionless; wheel speed is in mm/s.
2. For each command interval, compare the two wheel speeds near its end.
   Read one speed from each curve at the same time. Note any interval in which
   a wheel stays still or its speed continues to rise.
3. Find where the command returns to zero. Observe how long the wheels continue
   moving before their measured speeds return near zero. This is the response
   your Curling stopping rule must allow for.

## 3. Save the trial

1. Wait until the run shows **Run saved**. In **Monitor → Export**, select
   **Export run data as CSV**, then **Export plots as PNG**. The completion
   message gives each saved path, normally inside the Project's `exports`
   folder.
2. Use filenames containing your pair, target and trial, such as
   `pair07_virtual_motor_trial01`. Record the three commands and their durations
   with the plot. For a physical trial, also record the robot ID and battery
   condition. Keep virtual and physical trials separately labeled.
3. Record the left/right speed pair from each interval and one observation
   about movement after the zero command.

## Project files

<strong class="config-file">Amber †</strong>: settings for this experiment.
<span class="supplied-file">Gray S</span>: supplied program.

<div class="project-file-table">

| File | Parameters and purpose |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Applies the three command intervals, reads encoders and stops the motors when the sequence ends. |
| <strong class="config-file"><code>experiment.py</code> †</strong> | `EFFORTS`: commands sent to both motors, in order.<br>`EFFORT_DURATION_S`: time at each nonzero command, in s.<br>`ZERO_DURATION_S`: time at zero command before and after each interval, in s.<br>`MAXIMUM_WHEEL_TRAVEL_MM`: stops the experiment if either wheel's measured travel exceeds this value. |
| <strong class="config-file"><code>robot_setup.py</code> †</strong> | `sample_period_ms`: interval between encoder readings, in ms.<br>The wheel-controller settings in this file do not affect this experiment, which sends motor commands directly. |
| <span class="supplied-file"><code>live_variables.py</code> S</span> | Publishes the motor command and measured wheel speeds for Monitor. |
| <strong class="config-file"><code>world.json</code> †</strong> | `initial_pose`: starting position in mm and heading in rad in Virtual XRP.<br>`bounds` and `obstacles`: virtual arena edges and objects, in mm. |

</div>

<div class="main-walkthrough">

## What is main.py doing?

1. `XRPBot(ROBOT_CONFIG)` creates the object that reads encoders and sends
   commands to the motors. The supplied `SensorProcessor` converts those
   encoder readings into wheel travel and speed.
2. `bot.stop()` removes motor effort. `bot.reset_encoders()` clears the counts.
   `model.reset(bot.read())` reads the first sample and establishes zero travel.
3. The outer `for` loop takes one value from `EFFORTS`. The next loop applies
   zero command, that value, then zero again. `DriveCommand(command, command)`
   sends the same value to both wheels. This experiment sends motor commands
   directly, so wheel-speed feedback does not change them.
4. During each interval, the `while` loop waits for the next sample, reads
   encoder counts and calls `model.update()` to calculate wheel travel and
   speed. `publish_motor_values()` sends the calculated values to Monitor.
   Elapsed timestamps determine when the interval ends.
5. The travel check stops the experiment if either wheel exceeds
   `MAXIMUM_WHEEL_TRAVEL_MM`. The `finally` block removes motor effort on normal
   completion or a Python error. The app also removes motor effort when you
   select **Stop**.

</div>
