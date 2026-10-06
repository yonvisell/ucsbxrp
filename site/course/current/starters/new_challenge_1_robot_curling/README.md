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

`raw` is one `RawSensors` record: it contains the sample time in ms, left/right
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
   in `self.config`, then convert counts to mm using wheel circumference and
   encoder counts per revolution. Forward rotation must produce positive distance.
2. **Calculate the latest wheel increment.** Repeat the count subtraction using
   `self.previous_raw`. These increments describe this interval only; leave them
   unsmoothed because odometry uses them to calculate motion.
3. **Calculate elapsed time.** Import `elapsed_time_s` from `ucsb_xrp` and call it
   with the current timestamp followed by the preceding timestamp. Store the
   result as `dt_s`. Use these measured times, not `sample_period_ms`.
4. **Calculate wheel speed.** Divide each increment by `dt_s` to obtain mm/s.
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

1. **Implement the distance-to-speed calculation.** In `stopping_controller.py`,
   replace the stub in `speed_for_distance(remaining_mm)`. Its input is target
   distance minus mean left/right wheel distance from the start, in mm.
   Positive values mean distance remains; negative values mean the measured
   travel has passed the target. Your calculation must produce a finite,
   nonnegative forward-speed request in mm/s. Return that value from the
   function with `return`. Zero requests the final stop.
2. **Use the two adjustable parameters in your calculation.** Access
   `CRUISE_SPEED_MM_S.value` for the speed before slowing and
   `SLOWDOWN_DISTANCE_MM.value` for the distance over which to slow. Include
   both in your function so Monitor's **Cruise speed** and **Slowing distance**
   controls affect the next trial. Leave `TARGET_LOCATION_KI` and
   `TARGET_LOCATION_KD` at zero; accumulated-error and error-rate terms are not
   required. `TARGET_LOCATION_KP` is available if your controller uses a
   proportional distance coefficient.
3. **Account for the program's stop condition.** After the first zero request,
   `main.py` keeps requesting zero and waits until both measured wheel speeds
   stay within ±5 mm/s for 0.3 s. The reported motion time excludes that final
   confirmation interval.

## 3. Run and record stopping trials

1. **Use the supplied lane for the first virtual trial.** If the instructor
   assigns a different distance, move the `finish` marker in `world.json`
   that distance ahead of `initial_pose` along the lane. World distances use mm:
   2.0 m is 2000 mm. `challenge.py` calculates the target distance from those positions.
2. **Run your controller on Virtual XRP.** Open `main.py` in the Project
   panel and choose **Actions for main.py → Make main** if it is not marked
   **main**. Select **Virtual XRP**, then **Compile** and **Run**. Record trial number,
   target distance, cruise speed, and slowing distance. Keep the controls fixed
   during each run. In Monitor, select **›** at the upper left if its controls
   are collapsed. Observe **Remaining distance** and **Requested speed**.
   **Virtual distance** shows the simulated robot's straight-line distance from
   its starting position, in mm.
3. **Record the outcome.** In **Program output**, copy the stopping reason,
   motion time, and `remaining_mm`. Positive remaining distance means a short
   stop; negative means the measured travel exceeded the target. Include
   unsuccessful and no-motion trials. A time-limit trial reports 120 s and the
   distance at termination.
4. **Export the trial.** After **Run saved** appears, select
   **Monitor → Export → Export distance trial as CSV**. The completion message
   gives the path, normally in your Project's `exports` folder. Rename the file
   `trial01.csv`, using a different trial number each time. It contains
   `time_s`, `remaining_mm`, and `requested_speed_mm_s`.
5. **Compare controller settings.** Change one parameter or one calculation at
   a time and test at least two settings. Repeat the selected setting three
   times. For each run, save its CSV, **Export program output**, and export a
   run ZIP with **Include code in ZIP** enabled to retain the controller and settings.
6. **Record floor measurements for physical trials.** Align the robot's front
   with the start line. Use a tape measure to record its final longitudinal
   error—positive beyond the target, negative short—and lateral error. Record
   its final heading too. Use the front center as the distance reference;
   encoder distance does not replace the floor measurement.

## 4. Plot the stopping response in MATLAB

Plot remaining distance and requested speed to see when your controller slows
and stops the robot. In MATLAB, set **Current Folder** to the CSV folder and run:

```matlab
T = readtable('trial01.csv'); figure;
subplot(2,1,1); plot(T.time_s,T.remaining_mm); yline(0,'--'); grid on; ylabel('Remaining distance (mm)');
subplot(2,1,2); plot(T.time_s,T.requested_speed_mm_s); grid on; ylabel('Requested speed (mm/s)'); xlabel('Time (s)');
exportgraphics(gcf,'trial01.png','Resolution',200);
```

Time starts at the run's first encoder acquisition. Locate the first speed
reduction and zero request; compare the final remaining distance with Program
output. Use these observations to explain a short stop or overshoot and select
your next change. Identify the trial and settings in each figure's caption and
use the same axis limits when comparing trials.

## Your report (part of your portfolio)

Submit one report per pair with both names at top. Include these items in order.
See further guidance in syllabus.

1. **Implementation:** explain your encoder-to-distance and speed calculations,
   the variables retained by `SensorProcessor`, and the stopping controller.
   Give the expected and observed code-test results.
2. **Figures:** include the MATLAB panels for each controller setting. Identify
   slowing, the zero request, and final remaining distance on one trial.
3. **Trial table:** list trial number, virtual/physical target, `d`, cruise speed,
   slowing distance, stopping reason, reported time, and encoder remaining
   distance. Include all three repeats. For physical trials, add robot ID,
   longitudinal/lateral errors, and heading.
4. **Controller revision:** identify one change, predict its effect, and compare
   the recorded results before and after it using the figures and trial table.

Include a descriptive reflection on what your tests showed and how that evidence
informed your controller revision. Attach the CSVs, Program output, MATLAB script,
and code/settings ZIPs. Report actual values, including unsuccessful trials.

## Project files


<strong class="student-file">Blue *</strong>: code to implement.
<strong class="config-file">Amber †</strong>: settings to adjust.
<span class="supplied-file">Gray S</span>: code provided or completed earlier.
`main.py` and the library wheel controller are supplied. **Run code tests**
checks your measurement methods regardless of the sensing flag; **Run** uses
the selected processor. `speed_for_distance` is called directly and has no
selector.

<div class="project-file-table">

| File | What it does |
| --- | --- |
| <span class="supplied-file"><code>main.py</code> S</span> | Shows the straight control loop, calls your stopping controller, latches the first zero request, prints the measured outcome, ends the trial at 120 s if needed, and stops the motors on exit. |
| <strong class="student-file"><code>sensor_processor.py</code> *</strong> | Converts encoder readings into wheel travel and speed; also contains later range estimation. |
| <strong class="student-file"><code>stopping_controller.py</code> *</strong> | Contains your distance-based stopping controller. |
| <strong class="config-file"><code>live_variables.py</code> †</strong> | `CRUISE_SPEED_MM_S` — Monitor Cruise speed setting in mm/s; read .value in your stopping controller.<br>`SLOWDOWN_DISTANCE_MM` — Monitor Slowing distance setting in mm; read .value in your stopping controller. |
| <strong class="config-file"><code>robot_setup.py</code> †</strong> | `sample_period_ms` — scheduled measurement interval in ms; 10 ms requests 100 Hz.<br>`wheel_diameter_mm` — wheel diameter in mm used to convert encoder counts to travel.<br>`encoder_counts_per_revolution` — encoder counts for one wheel revolution.<br>`track_width_mm` — wheel spacing in mm used for turning and odometry.<br>`left_start_command`, `right_start_command` — supplied motor commands for starting each wheel.<br>`left_speed_command_gain`, `right_speed_command_gain` — supplied motor-command coefficients per requested wheel speed.<br>`wheel_speed_kp` — supplied correction per wheel-speed error.<br>`wheel_speed_ki`, `wheel_speed_kd` — reserved settings; keep zero because the supplied controller does not use them.<br>`max_drive_command` — largest permitted absolute motor command.<br>`USE_STUDENT_SENSOR_PROCESSOR` — True uses your wheel measurements; False uses supplied measurements. |
| <strong class="config-file"><code>challenge.py</code> †</strong> | `TRAVEL_DISTANCE_MM` — requested wheel travel in mm, calculated from the start and finish.<br>`STATIONARY_SPEED_MM_S` — maximum absolute wheel speed in mm/s counted as stopped.<br>`STATIONARY_DURATION_S` — consecutive stopped interval in s required to confirm rest.<br>`MAXIMUM_RUN_TIME_S` — maximum trial time in s; 120 ends the run. |
| <span class="supplied-file"><code>motion_timer.py</code> S</span> | Computes estimated motion time and continuous rest from measured wheel speeds without choosing or applying a command. |
| <span class="supplied-file"><code>component_checks.py</code> S</span> | Checks component methods without driving. |
| <strong class="config-file"><code>world.json</code> †</strong> | `default_world` — world used when none has been selected.<br>`bounds` — arena edges in mm.<br>`initial_pose` — starting position in mm and heading in rad.<br>`markers` — start, target, or waypoint locations in mm. |

</div>


## Functions and methods

Keep the template method names and arguments. The API Reference defines the
record fields used by `SensorProcessor`. Optional `TARGET_LOCATION_KP`,
`TARGET_LOCATION_KI`, and `TARGET_LOCATION_KD` belong to your stopping controller;
keep them at zero unless your stopping controller explicitly uses them.

| Method or function | Input | Return or effect |
| --- | --- | --- |
| `SensorProcessor.reset(raw)` | First `RawSensors` sample | Zeroed `Measurements` and retained count/time origin. |
| `SensorProcessor.update(raw)` | Next `RawSensors` sample | Wheel positions/increments in mm, speeds in mm/s, and elapsed interval in s. |
| `speed_for_distance(remaining_mm)` | Measured remaining distance in mm | Forward speed in mm/s; zero requests the final stop. |

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
`first.time_ms` is time in ms, `first.left_position_mm` is left wheel position
in mm, and `state.pose.heading_rad` is estimated heading in rad. The dot selects
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
After the first zero request, the conditional expression keeps speed at zero
without calling the rule again. `MotionCommand` stores forward speed in mm/s
and turn rate in rad/s; `0.0` requests no turn. Its constructor rejects invalid
numeric values. The following check rejects negative speed, and the next line
saves whether any zero request has occurred.

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
Absolute wheel speeds above 5 mm/s count as motion. After a zero request, both
speeds must stay within ±5 mm/s for 0.3 consecutive seconds before
`timer.stop_confirmed` becomes `True`. Renewed movement restarts that rest
interval. The timer reports the interval from first detected motion to the
first rest sample after final movement; it excludes the rest-confirmation wait.

The next `if` checks elapsed sample time since `start()`. At 120 s it calls
`robot.stop()`, fixes the reported time at 120 s, publishes the cutoff values,
and exits the loop with `reason = "time_limit"`. Otherwise,
`publish_curling_values()` sends remaining distance, requested speed, and motion
time to Monitor. A confirmed normal stop exits with `stationary`; a zero request
before detected movement exits with `no_motion`.

### G. The program prints the outcome and stops the motors

The final `print()` writes the reason, time, and remaining distance to Program
output. On normal completion, the run limit, or a Python exception, `finally` calls
`robot.stop()` to apply zero motor effort. The IDE **Stop** control interrupts
the running program and requests a stop through the target service; an
interruption may prevent Python from executing `finally`. Your stopping
controller chooses the stopping distance.

</div>
