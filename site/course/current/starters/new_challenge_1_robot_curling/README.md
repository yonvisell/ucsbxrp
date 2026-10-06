# Challenge 1 · Robot Curling

## Task

Drive forward and stop at the target, 1.3–2.3 m ahead along the longer axis
of the arena. The library supplies wheel-speed control. The challenge awards
points for distance and time.

![The robot's front is aligned with the start line; distance d extends to the target.](course-assets/curling-distance-measurement.svg)

The trial / run automatically stops after a maximum time of 2 minutes.

Add brief comments to your code as you write it, to improve readability for instructors and to help you during your individual code review / walkthrough at the Challenge.

## 1. Calculate wheel distance and speed

The stopping controller sets forward speed from the remaining distance.
`SensorProcessor` calculates wheel distance and speed from encoder values.
You will complete it in `sensor_processor.py`, then implement and tune the
stopping controller in `stopping_controller.py`. The steps follow below.
Leave `estimate_range` for Challenge 5.

### 1.1. Implement reset in sensor_processor.py to initialize wheel distance

`raw` is one `RawSensors` record: it contains the sample time, left/right
encoder counts, and any range, button, and floor-sensor readings. For example,
`raw.time_ms` is the sample's timestamp.

1. **Add the method and its stored variables.** Inside the `SensorProcessor`
   class, replace the existing `reset` method, including its
   `raise NotImplementedError(...)` line, with this first fragment:

   ```python
       def reset(self, raw):
           self.initial_raw = raw
           self.previous_raw = raw
           self.left_speed_mm_s = 0.0
           self.right_speed_mm_s = 0.0
   ```

   `self.initial_raw` holds the first sensor record so `update` can calculate
   distance from the starting counts. `self.previous_raw` holds the preceding
   record so `update` can calculate changes between samples. They initially
   refer to the same record. The two speed variables start at zero.
   Variables stored on `self` remain available when the next method runs.

2. **Create the initial Measurements record.** Add this continuation immediately
   below the four assignments, at the same indentation as those assignments:

   ```python
           return Measurements(
               time_ms=raw.time_ms,
               dt_s=0.0,
               left_position_mm=0.0,
               right_position_mm=0.0,
               left_increment_mm=0.0,
               right_increment_mm=0.0,
               left_speed_mm_s=0.0,
               right_speed_mm_s=0.0,
               range_mm=raw.range_mm,
               button_pressed=raw.button_pressed,
               reflectance=raw.reflectance,
           )
   ```

   `Measurements` groups named fields in one record. Each name before `=` selects
   a field, and the value after `=` supplies its contents. The wheel positions,
   increments, speeds, and time interval start at zero; the other fields retain
   the sensor readings. `return` passes this record to `robot.start()`, which
   stores it in `state.measurements`.

### 1.2. Implement update in sensor_processor.py to update wheel distance

`update` receives a new `raw` record each time the robot acquires an encoder
sample. Complete the method by incorporating the following calculations in
`update(raw)`:

1. **Calculate total wheel distance.** For each wheel, subtract its count in
   `self.initial_raw` from its current count. Multiply by its encoder sign
   in `self.config`, then convert counts to wheel travel using wheel circumference and
   encoder counts per revolution. Forward rotation must produce positive distance.
2. **Calculate the latest wheel increment.** Repeat the count subtraction using
   `self.previous_raw`. These increments describe this interval only; leave them
   unsmoothed because odometry uses them to calculate motion.
3. **Calculate elapsed time.** Import `elapsed_time_s` from `ucsb_xrp` and call it
   with the current timestamp followed by the preceding timestamp. Store the
   result as `dt_s`. Use these measured times, not `sample_period_ms`.
4. **Calculate wheel speed.** Divide each increment by `dt_s`.
   Combine the result with preceding estimates or recent samples to reduce
   jumps from individual encoder counts. Use
   `self.config.wheel_speed_filter_time_constant_ms` to set the response time.
   If `dt_s` is not positive, use zero for the interval and retain the preceding
   speed estimates instead of dividing. If you store additional samples, also
   initialize their storage in `reset`.
5. **Update the stored variables.** Assign the current `raw` to
   `self.previous_raw` and retain the new speed estimates on `self`.
   Keep `self.initial_raw` unchanged.
6. **Create the updated Measurements record.** Use the field names shown in
   `reset`, now supplying the calculated interval, wheel positions, increments,
   and speeds. Copy the timestamp, range, button, and reflectance from `raw`.
   Pass this record back with `return Measurements(...)` so `robot.step()` can
   use the new values.

### 1.3. Run the integrated tests to validate your code

In the IDE's **Project** panel, select **Run code tests**. The tests call your
`SensorProcessor` with known counts and timestamps without moving either robot.
The IDE opens the **Program output** tab below the editor. Look for the
`PASS · SensorProcessor` or `FAIL · SensorProcessor` line there; `NOT IMPLEMENTED`
means a method still contains its stub. For a failure, use the `INPUT`, `EXPECT`,
and the error detail on the `FAIL` line to locate the error, then edit and run
the tests again.

The checks cover initialization, distance, speed response, unequal sample
intervals, and different wheel dimensions and encoder signs.

### 1.4. Select your SensorProcessor for robot runs

After the tests pass, open `robot_setup.py` and change
`USE_STUDENT_SENSOR_PROCESSOR = False` to
`USE_STUDENT_SENSOR_PROCESSOR = True`. **Run** will then use your calculations
for wheel-speed control and stopping distance. **Run code tests** always checks
your file, regardless of this setting. Keep the supplied wheel-controller settings.

## 2. Implement and tune the stopping controller

Near the target, implement a **PID controller** to minimize the remaining
distance. The key tradeoff is between travel time and stopping accuracy.

### 2.1. Implement speed_for_distance

In `stopping_controller.py`, replace the stub in
`speed_for_distance(remaining_mm)`. The input is target distance minus mean
left/right wheel travel. Positive values mean distance remains; negative values
mean the measured travel has passed the target. Return a finite, nonnegative
forward speed. Implement the following stop, cruise, and approach calculations
in that order.

### 2.2. Set the stopping threshold

Set `STOP_DISTANCE_MM` above the function. At the start of the function, return
`0.0` to command zero speed when `remaining_mm <= STOP_DISTANCE_MM`.
`main.py` retains the first zero-speed command for the rest of the run.

### 2.3. Calculate cruise and approach speeds

After the stop check, read `CRUISE_SPEED_MM_S.value` and
`SLOWDOWN_DISTANCE_MM.value`. Return the cruise speed while `remaining_mm`
exceeds the slowing distance. Otherwise, calculate the approach speed using
the PID form:

<p><em>v</em> = K<sub>P</sub> <em>e</em> + K<sub>I</sub> ∫ <em>e</em> dt + K<sub>D</sub> d<em>e</em>/dt</p>

Here, `e` is `remaining_mm`, `v` is the speed command, and `t` is time.
The terms use current error, accumulated error, and error rate.
For this challenge, initially, start with just the proportional term:

`speed_mm_s = TARGET_LOCATION_KP * remaining_mm`

Limit that speed to the interval from zero to `CRUISE_SPEED_MM_S.value`, then
return it. Your PID constants may be stored in `TARGET_LOCATION_KP`,
`TARGET_LOCATION_KI`, and `TARGET_LOCATION_KD`. These are the equation's
K<sub>P</sub>, K<sub>I</sub>, and K<sub>D</sub>; the template declares them above
the function. Start with `TARGET_LOCATION_KP = 1.0` (1/seconds) and set
`TARGET_LOCATION_KI` and `TARGET_LOCATION_KD` initially to zero.

You may implement other stopping controller algorithms than are described here.
Ensure you tune and test systematically.

### 2.4. Compare performance for different gain settings

Select several controller configurations to compare: different gain settings,
different stopping algorithms, or both. For the initial proportional controller,
vary `TARGET_LOCATION_KP`. A larger gain commands a higher approach speed until
the cruise-speed limit is reached. Compare travel time and final remaining
distance using the plots in Section 4. In your report, give the tuning values
and describe the experiments and their outcomes.

## 3. Run and record stopping trials

1. **Check the start and target.** The Project's `world.json` defines the
   **Straight run** world. `initial_pose` sets the start, and the marker named
   `finish` sets the target. `challenge.py` calculates the trial distance from
   these positions. To change the distance for a virtual trial, set the
   `finish` marker's `x_mm` to the starting `x_mm` plus the desired travel
   distance. Keep its `y_mm` equal to `initial_pose.y_mm`.
2. **Run your controller on Virtual XRP.** Open `main.py` in the Project panel
   and choose **Actions for main.py → Make main** if it is not marked **main**.
   Select **Virtual XRP**, then **Compile** and **Run**. In Monitor, select
   **›** at the upper left if its controls are collapsed. Observe **Remaining
   distance** and **Requested speed**. **Virtual distance** shows the simulated
   robot's straight-line distance from its starting position.
3. **Enter the trial settings and stopping result in your trial table.** Assign
   a trial number and list the target distance, controller algorithm, and its
   parameter values. For the proportional controller, include cruise speed,
   slowing distance, `TARGET_LOCATION_KP`, and `STOP_DISTANCE_MM`. From
   **Program output**, copy the stopping reason, motion time, and `remaining_mm`.
   Positive remaining distance means a short stop; negative means the measured
   travel exceeded the target.
4. **Save the trial files.** After **Run saved** appears, select
   **Monitor → Export → Export distance trial as CSV**. The completion message
   gives the saved path. Rename the file `trial01.csv`, using the trial number
   from your table. It contains `time_s`, `remaining_mm`, and
   `requested_speed_mm_s`. Also select **Export program output** and export a
   run ZIP with **Include code in ZIP** enabled. Use the same trial number in
   the filenames to associate the data with its code and settings.
5. **Collect trials for comparison.** Record at least three trials for use in
   your reports, including the controller configurations you compare in
   Section 4. Save the files listed above for each trial.
6. **Add floor measurements for physical trials.** Align the robot's front
   with the start line. After the run, use a tape measure to find its final
   longitudinal error—positive beyond the target, negative short—and lateral
   error. Enter these and the final heading in the trial table. Use the front
   center as the distance reference.

## 4. Plot and compare controller performance in MATLAB

### 4.1. Plot remaining distance and requested speed

In MATLAB, set **Current Folder** to the folder containing `trial01.csv` and run:

```matlab
T = readtable('trial01.csv'); figure;
subplot(2,1,1); plot(T.time_s,T.remaining_mm); yline(0,'--'); grid on; ylabel('Remaining distance (mm)');
subplot(2,1,2); plot(T.time_s,T.requested_speed_mm_s); grid on; ylabel('Requested speed (mm/s)'); xlabel('Time (s)');
exportgraphics(gcf,'trial01.png','Resolution',200);
```

Repeat for the other trials, changing the input CSV and output image filenames.
Label each figure with its trial number, controller algorithm, and parameter
values. Use the same axis limits when comparing plots.

### 4.2. Compare stopping controllers

For each controller configuration tested, identify when speed begins to
decrease, when the controller commands zero, and the final remaining distance
on its plot. Compare these with the motion time and stopping result in your
trial table. Explain how the parameter or algorithm changes affected travel
time and stopping accuracy.

## Your report (part of your portfolio)

Submit one report per pair with both names at top. Include these items in order.
See further guidance in syllabus.

1. **Implementation:** explain your encoder-to-distance and speed calculations,
   the variables retained by `SensorProcessor`, and each stopping controller
   you tested. Give the expected and observed code-test results.
2. **Figures:** include the MATLAB panels for the controller configurations
   compared in Section 4, labeled with trial numbers and parameter values.
3. **Trial table:** list trial number, virtual/physical target, `d`, controller
   algorithm, parameter values, stopping reason, reported time, and final
   encoder remaining distance. Include at least three trials. For physical
   trials, add robot ID, longitudinal/lateral errors, and heading.
4. **Experiments and comparison:** describe your tuning experiments and their
   outcomes. Use the figures and trial table to compare the controllers and
   explain the effect of the changes you made.

Include a descriptive reflection on what your tests showed and how that evidence
informed your controller revision. Attach the CSVs, Program output, MATLAB script,
and code/settings ZIPs. Report actual values, including unsuccessful trials.

## Project files


<strong class="student-file">Blue *</strong>: code to implement.
<strong class="config-file">Amber †</strong>: settings to adjust.
<span class="supplied-file">Gray S</span>: code provided or completed earlier.
`main.py` is supplied and does not need to be edited. The UCSBXRP library
already incorporates the low-level motor-speed control loop: it adjusts motor
effort so measured wheel speed follows commanded wheel speed. Motor effort is
the motor input; wheel speed is the measured output.

**Run code tests**
checks your measurement methods regardless of the sensing flag; **Run** uses
the selected processor. `speed_for_distance` is called directly and has no
selector.

<div class="project-file-table">

| File | What it does |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Shows the straight control loop, calls your stopping controller, latches the first zero-speed command, prints the measured outcome, ends the trial at 120 s if needed, and stops the motors on exit. |
| <strong class="student-file"><code>sensor_processor.py</code> *</strong> | Converts encoder readings into wheel travel and speed; also contains later range estimation. |
| <strong class="student-file"><code>stopping_controller.py</code> *</strong> | Contains your distance-based stopping controller.<br>`TARGET_LOCATION_KP` — proportional gain.<br>`TARGET_LOCATION_KI`, `TARGET_LOCATION_KD` — integral/derivative gains; initially zero.<br>`STOP_DISTANCE_MM` — remaining distance at which to command zero speed. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | `CRUISE_SPEED_MM_S` — Monitor Cruise speed setting; read .value in your stopping controller.<br>`SLOWDOWN_DISTANCE_MM` — Monitor Slowing distance setting; read .value in your stopping controller. |
| <strong class="config-file"><code>robot_setup.py</code> †</strong> | `sample_period_ms` — scheduled measurement interval.<br>`wheel_diameter_mm` — wheel diameter used to convert encoder counts to travel.<br>`encoder_counts_per_revolution` — encoder counts for one wheel revolution.<br>`track_width_mm` — wheel spacing used for turning and odometry.<br>`left_start_command`, `right_start_command` — supplied motor commands for starting each wheel.<br>`left_speed_command_gain`, `right_speed_command_gain` — supplied motor-command coefficients per requested wheel speed.<br>`wheel_speed_kp` — supplied correction per wheel-speed error.<br>`wheel_speed_ki`, `wheel_speed_kd` — reserved settings; keep zero because the supplied controller does not use them.<br>`max_drive_command` — largest permitted absolute motor command.<br>`USE_STUDENT_SENSOR_PROCESSOR` — True uses your wheel measurements; False uses supplied measurements. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | `TRAVEL_DISTANCE_MM` — requested wheel travel, calculated from the start and finish.<br>`STATIONARY_SPEED_MM_S` — maximum absolute wheel speed counted as stopped.<br>`STATIONARY_DURATION_S` — consecutive stopped interval required to confirm rest.<br>`MAXIMUM_RUN_TIME_S` — maximum trial time; ends the run when reached. |
| <span class="supplied-file"><code>motion_timer.py</code> S</span> | Computes estimated motion time and continuous rest from measured wheel speeds without choosing or applying a command. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Checks component methods without driving. |
| <strong class="config-file"><code>world.json</code> †</strong> | `default_world` — world used when none has been selected.<br>`bounds` — arena edges.<br>`initial_pose` — starting position and heading.<br>`markers` — start, target, or waypoint locations. |

</div>


## Functions and methods

Keep the template method names and arguments. The API Reference defines the
record fields used by `SensorProcessor`. Keep the stopping-controller gains
and distance threshold together in `stopping_controller.py`; they are separate
from the supplied wheel-speed settings in `robot_setup.py`.

| Method or function | Input | Return or effect |
| --- | --- | --- |
| `SensorProcessor.reset(raw)` | First `RawSensors` sample | Zeroed `Measurements` and retained count/time origin. |
| `SensorProcessor.update(raw)` | Next `RawSensors` sample | Wheel positions, increments, speeds, and elapsed interval. |
| `speed_for_distance(remaining_mm)` | Measured remaining distance | Forward speed; zero commands the final stop. |

<div class="main-walkthrough">

## What is main.py doing?


The supplied file runs the stopping controller in a repeated measurement-and-command loop.
`main.py` chooses a speed request and observes the result. The component
objects created by `make_robot()` carry out wheel measurement and control.

### A. The imports provide functions, classes, and settings

`from challenge import ...` reads the start pose, target distance, stopping
thresholds, and run limit from `challenge.py`. That file reads `world.json`.
`from stopping_controller import speed_for_distance` selects your stopping controller. The other imports provide the timer, Monitor signals, robot setup,
and the `MotionCommand` record. Importing a name lets this file use a function,
class, or value defined in another file.

![Numbered main.py statements that create the robot and read its first state.](course-assets/curling-main-setup.svg)

*Figure 1. The robot object contains the selected components. The returned state
contains separate measurement and pose records.*

### B. make_robot constructs the robot and its components

```python
robot = make_robot(ROBOT_CONFIG)
```

`ROBOT_CONFIG` is a record of wheel dimensions, sample timing, and motor settings.
`make_robot()` in `robot_setup.py` constructs `Robot` with an `XRPBot`, a
`SensorProcessor`, a `WheelSpeedController`, a `DifferentialDrive`, and an
`Odometry`. The sensing flag chooses your `SensorProcessor` or the supplied processor.
Wheel-speed control, drive conversion, and odometry use supplied library classes.

A **class** defines the operations and saved data for a component. An **object**
is one instance of that class: `SensorProcessor(ROBOT_CONFIG)` creates one
processor with its own stored counts and timestamps. `robot` refers to the assembled
`Robot` object. Calling `robot.step(command)` calls that object's `step` method.
`self` inside a component method refers to that component object; a value stored
as `self.previous_raw` remains available at the next call.

### C. robot.start initializes the run and its measurements

```python
state = robot.start(INITIAL_POSE)
first = state.measurements
initial_position_mm = (first.left_position_mm + first.right_position_mm) / 2.0
```

`start()` resets encoders, stored wheel measurements and controller values,
and the estimated pose.
It returns a `RobotState` record containing `measurements` and `pose`.
`first` refers to its initial `Measurements` record. Records group named values:
`first.time_ms` is time, `first.left_position_mm` is left wheel position,
and `state.pose.heading_rad` is estimated heading. The dot selects
a field. The mean initial wheel position is saved so later travel is measured
relative to the start, even if a processor uses a nonzero position origin.
The next call, `publish_curling_trial(TRAVEL_DISTANCE_MM, initial_position_mm)`,
saves this trial's fixed distance and measurement origin for the CSV export.

`MotionTimer(...)` creates a separate timer object using that initial timestamp.
`travel_mm = 0.0` initializes traveled distance; `stop_requested = False` records
that your stopping controller has not yet requested its final stop.

![Numbered main.py statements that choose and apply the next motion request.](course-assets/curling-main-request.svg)

*Figure 2. The student function selects speed; Robot.step applies the request
and returns the next measurements.*

### D. The loop calculates the next speed request

```python
remaining_mm = TRAVEL_DISTANCE_MM - travel_mm
speed_mm_s = 0.0 if stop_requested else speed_for_distance(remaining_mm)
command = MotionCommand(speed_mm_s, 0.0)
```

Each `while True` iteration calculates remaining distance and calls your stopping controller.
After the first zero-speed command, the conditional expression keeps speed at zero
without calling your controller again. `MotionCommand` stores forward speed
and turn rate; `0.0` requests no turn. Its constructor rejects invalid
numeric values. The following check rejects negative speed, and the next line
saves whether any zero-speed command has occurred.

### E. robot.step applies the request and supplies updated measurements

```python
state = robot.step(command)
measured = state.measurements
travel_mm = (measured.left_position_mm + measured.right_position_mm) / 2.0 - initial_position_mm
```

Inside `step()`, `DifferentialDrive` converts the motion request to left/right
`WheelSpeeds`. `WheelSpeedController` compares those targets with the latest
measured speeds and returns a `DriveCommand`. `XRPBot` applies the command to
the two motors. `Robot` waits for the scheduled sample, reads encoder counts,
and passes the new `RawSensors` record to `SensorProcessor.update()`. The
returned `Measurements` contains new positions, increments, speeds, and actual
`dt_s`. `Odometry` updates `Pose` from the increments. `step()` returns a new
`RobotState` and publishes telemetry to Monitor. The same calls operate on
simulated hardware when **Virtual XRP** is selected.

For each wheel, the supplied controller maps a nonzero target speed to a motor
command using that wheel's starting-command and speed coefficients. It adds
`wheel_speed_kp * (target_speed - measured_speed)` and limits the result to
`max_drive_command`. A zero target requests zero motor effort. These operations
use the settings in `robot_setup.py`; your stopping controller chooses the speed.

`main.py` saves this returned state, computes mean wheel travel from it, and
recomputes remaining distance. It does not use the requested speed as a
measurement of distance.

![Numbered main.py statements that measure time and enforce the 120 s limit.](course-assets/curling-main-stop.svg)

*Figure 3. The run-time limit removes motor effort and records the cutoff
outcome. These are source excerpts, with inline comments omitted for fit.*

### F. The timer checks for rest and the loop enforces the run limit

`timer.update(measured, stop_requested)` checks both measured wheel speeds.
After your distance threshold commands zero speed, the timer uses
`STATIONARY_SPEED_MM_S` and `STATIONARY_DURATION_S` from `challenge.py` to
confirm that both wheels have stopped. Then `timer.stop_confirmed` becomes
`True`. These supplied settings govern motion/rest detection and reporting; they do
not set your distance threshold or select the speed command. Renewed movement restarts that rest
interval. The timer reports the interval from first detected motion to the
first rest sample after final movement; it excludes the rest-confirmation wait.

The next `if` checks elapsed sample time since `start()`. At 120 s it calls
`robot.stop()`, fixes the reported time at 120 s, publishes the cutoff values,
and exits the loop with `reason = "time_limit"`. Otherwise,
`publish_curling_values()` sends remaining distance, requested speed, and motion
time to Monitor. A confirmed normal stop exits with `stationary`; a zero-speed command
before detected movement exits with `no_motion`.

### G. The program prints the outcome and stops the motors

The final `print()` writes the reason, time, and remaining distance to Program
output. On normal completion, the run limit, or a Python exception, `finally` calls
`robot.stop()` to apply zero motor effort. The IDE **Stop** control interrupts
the running program and requests a stop through the target service; an
interruption may prevent Python from executing `finally`. Your stopping
controller chooses the stopping distance.

</div>
