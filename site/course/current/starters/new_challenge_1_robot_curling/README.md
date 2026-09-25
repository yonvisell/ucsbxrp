# Challenge 1 · Robot Curling

## Task

Drive 1000 mm along the lane and stop as close to the target as possible, in the
least time. Use the front center of the robot for both the starting mark and
final position measurement. Develop wheel-speed feedback and a stopping rule
based on measured distance.

## 1. Wheel measurements and motor calibration

Calculate wheel travel from encoder counts, and wheel speed from the change in
travel over each sampling interval. Account for forward and reverse motion.
Implement these calculations, then compare speed estimates from individual
samples with estimates averaged over several samples.

Measure each wheel's steady speed at several motor commands using the supplied
**Motor Characterization** demonstration.
Plot speed against command. Estimate the command needed to start each wheel
and the additional command needed per unit speed. Use these measurements and
your robot's wheel dimensions for its calibration. Note whether the wheels
were raised or driving on the floor.

## 2. Wheel-speed and stopping control

Develop feedback that adjusts each motor command according to the difference
between requested and measured wheel speed.

Next, develop a rule for requested forward speed as a function of distance
remaining. Decide when to slow down and when to stop. A zero speed request ends
the trial. The supplied program repeatedly calls your rule, records data, and
stops the motors when the trial ends.

Compare runs with and without wheel-speed feedback, using the same stopping
rule. Look for reduced speed error, oscillation, and motor commands that stay
at their limit.

## 3. Stopping trials

Use the Virtual XRP to compare stopping rules and settings. The **Cruise speed**
and **Slowing distance** sliders are available for your rule to use. Change one
setting at a time and keep it fixed during each comparison run.
The supplied slowing distance starts at 120 mm; adjust it from measured stopping
error rather than assuming that distance is suitable on the floor.

Test the selected settings on the floor. Repeat a run at least twice from the
same starting alignment, then test one change intended to improve performance.
Measure the distance from the front center to the target, note whether the robot
stopped short or beyond it, and record final heading. Compare these measurements
with the encoder distance remaining. The program also reports an estimate of
time in motion, calculated from wheel-speed measurements.

## Your report

Submit one report per pair, with both names and the robot used. Distinguish
virtual and physical trials and record the settings used.

1. **Measurements and calibration:** show your encoder calculations and motor
   calibration plots. How did averaging affect the speed estimate?
2. **Feedback:** describe your controller and plot requested and measured speeds
   with and without feedback. Did feedback reduce the error? Explain any
   oscillation or sustained command limit.
3. **Stopping:** describe your stopping rule and tabulate settings, motion time,
   measured stopping error, and heading for the floor trials. Which setting
   gave the best balance of speed, accuracy, and repeatability? What explains
   the difference between encoder distance and the position measured on the floor?

## Project files

<strong class="student-file">Blue *</strong>: code to implement.
<strong class="config-file">Amber †</strong>: settings to adjust.
<span class="supplied-file">Gray S</span>: code provided or completed in an earlier challenge.
`main.py` is supplied and normally unchanged; a controlled experiment may still edit it.

After checking each class you implement, set its matching `USE_STUDENT_*` flag
to `True` in `course_setup.py` before **Run**. `False` runs the
supplied implementation; enable and check new classes one at a time.
`speed_for_distance` is called directly by `main.py` and has no selector.

<div class="project-file-table">

| File | What it does |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Runs the straight trial using your stopping rule and records the result. |
| <strong class="student-file"><code>sensor_model.py</code> *</strong> | Converts encoder readings into wheel travel and speed; also contains range estimation. |
| <strong class="student-file"><code>wheel_speed_controller.py</code> *</strong> | Calculates left and right motor commands from wheel-speed targets and measurements. |
| <strong class="student-file"><code>stopping_controller.py</code> *</strong> | Contains your distance-based stopping rule. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | Declares the two Monitor controls and their starting values. |
| <strong class="config-file"><code>robot_config.py</code> †</strong> | Holds robot calibration and controller settings. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | Reads the start and target from world.json and calculates the travel distance. |
| <strong class="config-file"><code>course_setup.py</code> †</strong> | Creates the robot using the selected component implementations. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Runs input/output examples for the component methods without driving. |
| <strong class="config-file"><code>world.json</code> †</strong> | Defines arena geometry, start pose, tracks, obstacles, and named markers shared by the robot and Monitor. |

</div>

## Parameters and functions

The method templates and API specify inputs and outputs. The Guide explains
how to select your implementations and run a different project file.

![SensorModel template open in the IDE.](course-assets/method-template.jpg)

*Figure. The IDE Project file list has `sensor_model.py` selected; the editor
shows its class and unfinished method bodies.*

Replace unfinished method bodies while retaining their names and arguments.
Leave range estimation for Challenge 5.

### Parameters

| Setting | Source and units | Effect |
| --- | --- | --- |
| Cruise speed | Live control in `live_variables.py`; mm/s | Upper forward-speed choice available to the stopping function. |
| Slowing distance | Live control in `live_variables.py`; mm | Distance at which the stopping rule may begin reducing speed. |
| `wheel_speed_kp` | `robot_config.py`; s/mm | Feedback command per mm/s of wheel-speed error; zero removes feedback. |
| Motor start commands and speed gains | `robot_config.py`; dimensionless and s/mm | Map requested wheel speed to each motor's calibrated drive command. |
| `max_drive_command` | `robot_config.py`; dimensionless | Limits the absolute command sent to either wheel. |

Live controls show their applied values. Keep each setting fixed during a recorded comparison. `speed_for_distance` reads the controls through `.value`.

### Functions and methods

| Function or method | Input | Return or effect |
| --- | --- | --- |
| `SensorModel.reset(raw)` | First `RawSensors` sample: counts and ms | Starting `Measurements` with zero travel and speed. |
| `SensorModel.update(raw)` | Next chronological `RawSensors` sample | `Measurements`: wheel position/increment in mm, speed in mm/s, interval in s. |
| `WheelSpeedController.reset()` | None | Clears feedback state before a run. |
| `WheelSpeedController.update(target, measured)` | Two `WheelSpeeds` values in mm/s | `DriveCommand` with normalized left/right commands. |
| `speed_for_distance(remaining_mm)` | Measured remaining distance in mm | Forward speed in mm/s; zero requests the final stop. |
