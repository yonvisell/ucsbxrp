# Challenge 2 · Arena Line Circuit

Follow a closed tape line using the two floor reflectance sensors. Drive through
four intermediate transverse bars and stop on returning to the start/finish bar.
The supplied counter counts **six crossings: start, four intermediate bars,
finish**. It uses sensor readings, not estimated robot position. Do not stop at
intermediate bars or follow stored world coordinates.

Implement `DifferentialDrive.wheel_speeds()` and `LineFollower.update()`. Reuse your
completed `SensorProcessor` from Robot Curling; wheel-speed control is supplied.

## Prepare and inspect

1. Select **Virtual XRP** and one of the eight circuit worlds. Use the same world
   when comparing settings. For **Physical XRP**, use Open Floor and the prepared
   taped circuit. The track and transverse bars use 19 mm electrical tape; the
   bars cross the track approximately at right angles on its straight sections.
2. Place the robot with both floor sensors over the start bar and facing along the
   line. Reset before the trial. Physical Reset establishes a local odometry
   origin; it does not measure or move the robot to a floor position.
3. Check that `SensorProcessor` retains `raw.reflectance` in its returned
   measurements. Use **Run code tests**, then enable each completed component
   with its `USE_STUDENT_*` selector in `robot_setup.py`.

The supplied counter counts an entry when **both raw readings reach 0.80**.
It counts only once until the lighter reading remains below the supplied clearing
threshold for 0.04 s. A broad longitudinal tape strip can resemble a bar: report
ambiguous readings to the instructor instead of changing the supplied counter.
Physical floor calibration affects steering and line visibility; raw readings
remain available for the counter and Monitor plots. Virtual readings never use
physical floor calibration.

## Implement and tune

For axle-center forward speed `v`, counterclockwise turn rate `ω`, and wheel
separation `b`, return wheel speeds `v_L = v − ω b / 2` and `v_R = v + ω b / 2`,
in mm/s. Robot dimensions and units appear in `robot_setup.py`.

In `LineFollower.update(reflectance, dt_s)`, store left minus right as
`self.line_error`. A darker left sensor needs a positive turn request. Use the
measured interval `dt_s` in seconds for integral and derivative calculations.
The supplied `self.settings` dictionary contains cruise/PID values and operating
limits. Return a `MotionCommand` with forward speed in mm/s and turn rate in rad/s.

- Keep forward speed between zero and cruise; a minimum-speed setting must never
  override a lower cruise request. Zero cruise pauses motion.
- Limit accumulated error and requested turning using the supplied settings.
- When both sensors see the transverse bar, retain the preceding trajectory.
  Do not accumulate bar error or differentiate it. Resume without a derivative
  kick after leaving the bar. Clear additional history in `reset()`.
- Store the terms actually used by your controller in `self.p_term_rad_s`,
  `self.i_term_rad_s`, and `self.d_term_rad_s`, before limiting their sum. Unused
  terms, paused samples, and samples holding the bar trajectory use zero.

Tune the clearly labeled constants at the top of **`line_follower.py`**. Each
target has independent starting values. The constants initialize each Run;
Monitor **Cruise speed** and **P gain** temporarily override those values during
that Run. They do not rewrite your file. I and D remain source settings. Change
one setting at a time and record its value.

In Monitor, select **Line P contribution**, **Line I contribution**, and **Line D
contribution** when needed; they begin unchecked. Each has units rad/s. Compare
these terms with **Requested turn rate** to identify derivative spikes, accumulated
error, and saturation. Their sum can exceed the turn limit; the requested turn
is the limited result. The raw floor plots and `line_error` differ when physical
floor calibration is active.

## Run and interpret the result

The supplied loop reads the sensors, updates the counter, computes local steering,
then calls `robot.step()` for wheel feedback and the next measurement. Intermediate
crossings leave motion continuous. Crossing six requests a stop and ends the lap.

If both corrected floor readings fall below the visibility threshold, the program
requests zero motion immediately. A continuous **0.4 s** loss ends the run. This
interval allows a newly visible line to resume the loop while the robot slows;
it does not command a blind search. Missing floor readings also end the run.
Program output states the reason, crossing count, and elapsed time. IDE **Stop**
remains available during execution; Python exceptions also remove motor effort.

New physical student Projects contain generic motor defaults: speed-command gains
0.0025 s/mm for each wheel and maximum drive command 1.0. These are not measurements
of your robot. Reusing a Project transfers its physical calibration, including
straight-driving coefficients, without changing virtual calibration. The completed
instructor example retains the separately measured asymmetric motor/floor values
and 0.55 limit; those values are not universal recommendations. Starting command
and speed-command gain represent independent motor deadband and slope.

The corrected supplied physical follower requires the current course runtime;
an older supplied implementation is rejected before motion. Connect by USB and
use **Robot Setup → Update course runtime** when directed by the error. Website
updates alone do not replace code on a physical robot. No firmware reflash is
needed.

## Submit

Include names, robot/target, circuit, and settings. Show your wheel-speed conversion
and line-following rule; give the code-test results. Compare recorded laps using
elapsed time, observed versus reported bar
crossings, completion/stop reason, and labeled sensor/PID/turn plots through a bend.
Explain one observed failure or improvement using the measurements. Distinguish
Virtual XRP evidence from physical observations.

## Project files

**Implement (green):** assigned code. **Configure (amber):** adjust named settings
or selectors. **Supplied (gray):** inspection optional; normally read-only.
Protected supplied-file references are marked in red in the IDE's rendered handout.

<div class="project-file-table">

| File | Role and purpose |
| --- | --- |
| [line_follower.py](line_follower.py) | **Implement:** top-level cruise/PID constants, steering, and actual contribution values. |
| [differential_drive.py](differential_drive.py) | **Implement:** body motion to wheel-speed targets. |
| [sensor_processor.py](sensor_processor.py) | **Implement/reuse:** wheel measurements; preserve floor readings. |
| [robot_setup.py](robot_setup.py) | **Configure:** component selectors; robot dimensions and sample-period reference. |
| [main.py](main.py) | **Supplied:** control loop and explicit stopping decisions. |
| [supplied_settings.py](supplied_settings.py) | **Supplied:** motor/floor calibration and operating thresholds; no student adjustment needed. |
| [lap_progress.py](lap_progress.py) | **Supplied:** one count per tape-bar entry and confirmed clearing. |
| [live_variables.py](live_variables.py) | **Supplied:** live controls and cached telemetry handles. |
| [challenge.py](challenge.py) | **Supplied:** initial pose and line-loss interval. |
| [world.json](world.json) | **Supplied:** virtual circuits and Open Floor selection. |
| [component_checks.py](component_checks.py) | **Supplied:** motion-free component tests. |

</div>
