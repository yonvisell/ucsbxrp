# Challenge 2 · Arena Line Circuit

Use the two floor sensors to follow the tape for one counterclockwise lap.
Drive through four intermediate bars and stop at the start/finish bar.
The supplied counter records **six entries: start, four intermediate bars,
finish**. Steering uses reflectance; completion uses bar detections, not position.

![Circuit 1: start/finish counts 1 and 6, with four intermediate tape bars counted 2 through 5.](course-assets/arena-line-circuit.svg)

*Circuit 1 is shown. Use the circuit assigned by your instructor; the other
virtual circuits have the same six-entry task.*

## 1. Prepare the Project

<div class="project-file-table">

| Your file | Work |
| --- | --- |
| [sensor_processor.py](sensor_processor.py) | Reuse your tested Challenge 1 class. In both `reset()` and `update()`, preserve `raw.reflectance` as `Measurements.reflectance`. |
| [differential_drive.py](differential_drive.py) | Reuse your tested Challenge 2.2 class, or implement `DifferentialDrive.wheel_speeds(command)` below. |
| [line_follower.py](line_follower.py) | Implement `LineFollower.update(reflectance, dt_s)` and its retained state; set cruise/P/I/D constants here. |
| [robot_setup.py](robot_setup.py) | Select completed classes with the three `USE_STUDENT_*` flags; retain this Project's setup code. |

</div>

The supplied [main.py](main.py) reads the sensors, counts bars, calls your follower,
then passes its `MotionCommand` to `Robot.step()`. Differential drive converts
that command to wheel speeds; supplied wheel control drives the motors and
returns the next measurement. Bar counting, stopping, recording and odometry
(position estimated from wheel travel) are supplied.

Select **Virtual XRP** and the assigned **World** in Monitor. Initially leave
all three selectors `False` for one supplied comparison lap: **Compile**, then
**Run**. This demonstrates the task; it does not test your implementation.

For Physical XRP, use **Open Floor** and the prepared 19 mm taped circuit.
Use the instructor-prepared motor/floor calibration in
[supplied_settings.py](supplied_settings.py); its thresholds are not PID tuning
parameters. Reflectance measurement is the separate **Challenge 2.1** exercise.
Before each lap, align both floor sensors over the start bar, facing along the
line, then select **Reset**. Physical Reset does not reposition the robot.

## 2. Convert body motion to wheel speeds

Use forward speed `command.forward_speed_mm_s` [mm/s], counterclockwise turn
rate `command.turn_rate_rad_s` [rad/s], and wheel separation
`self.config.track_width_mm` [mm]. Return `WheelSpeeds(left_mm_s, right_mm_s)`.

The wheel speeds' average must equal forward speed; their difference divided
by wheel separation must equal turn rate. Derive each wheel's speed from these
two relations. For a left turn, which wheel travels farther? Does your rotational
contribution use the distance from the axle midpoint to each wheel?

Check with a **100 mm** wheel separation: `MotionCommand(80, 0)` should produce
`WheelSpeeds(80, 80)`; `MotionCommand(100, 2)` should produce `WheelSpeeds(0, 200)`.
These are calculation examples, not dimensions to copy into `robot_setup.py`.

Select **Run code tests**. It calls student files regardless of the Run selectors;
`NOT IMPLEMENTED` for an unfinished class is expected. Once sensing and wheel
conversion pass, set `USE_STUDENT_SENSOR_PROCESSOR = True` and
`USE_STUDENT_DIFFERENTIAL_DRIVE = True`. Leave `USE_STUDENT_LINE_FOLLOWER = False`
until the following work is complete.

## 3. Develop steering in stages

`LineFollower.update(reflectance, dt_s)` receives paired sensor values and the
measured interval `dt_s` [s]. Black gives larger values; white gives smaller values.
Physical readings are corrected by the supplied calibration before this call.
Return `MotionCommand(forward_speed_mm_s, turn_rate_rad_s)`.

1. **Define signed error.** Store `reflectance.left - reflectance.right` in
   `self.line_error`. This dimensionless difference is not a distance. Positive
   error requires a positive (left) turn. Equal readings `(0.6, 0.6)` after
   `reset()` should give zero turn; `(0.8, 0.2)` should turn left and `(0.2, 0.8)`
   right.
2. **Begin with proportional steering.** Multiply error by
   `self.settings["kp_rad_s"]`. Limit the requested turn magnitude to
   `self.settings["maximum_turn_rate_rad_s"]`. A proportional controller responds
   to current error; it may alternate across the line.
3. **Reduce speed during large corrections.** Use
   `self.settings["cruise_speed_mm_s"]` as the upper bound. The supplied
   `turn_slowdown` specifies the fractional reduction at the turn limit; scale
   the reduction with the turn magnitude. Apply the `minimum_speed_mm_s` floor
   only up to cruise speed. A zero cruise request must return zero forward speed
   **and** zero turn.
4. **Add derivative action if needed.** Error change per second is
   `(self.line_error - self.last_error) / dt_s`; use zero when `dt_s == 0`.
   Multiply by `self.settings["kd_rad"]`, then update `self.last_error`.
   Derivative action responds to changing error and can reduce overshoot;
   excessive gain also amplifies rapid sensor changes. Keep integral gain zero
   for the comparisons below.

If you include integral action, accumulate `self.line_error * dt_s` in
`self.integral_error`, bound it by `±self.settings["integral_limit_s"]`, and
multiply by `self.settings["ki_rad_s2"]`. It is optional; a P or PD controller is
acceptable. Use measured `dt_s`, not an assumed 20 ms interval.

Store the actual P/I/D contributions before limiting their sum in
`self.p_term_rad_s`, `self.i_term_rad_s`, and `self.d_term_rad_s` [rad/s]. Use zero
for unused terms. The requested turn is their sum after the turn limit.

## 4. Cross bars and check the completed controller

Both readings at or above `self.settings["waypoint_dark_threshold"]` indicate
a transverse bar. The bar obscures lateral error: **continue the preceding
trajectory**, without integrating or differentiating its readings. Do not stop
at intermediate bars. Keep zero cruise as the highest-priority stop condition.
If cruise changes on a bar, scale forward speed and turn rate together to retain
curvature, while respecting the speed and turn limits.

In `reset()`, call `super().reset()` and initialize your additional history,
including a straight cruise command for the initial bar. Otherwise, what command
would be available if the first sample were already both-dark? On leaving a bar,
use the first ordinary-line error as derivative history so the transition does
not produce a derivative spike. Publish zero PID contributions while holding a
bar trajectory or paused.

Run **Run code tests** again. These checks establish signs, bounds and basic
reset behavior; a full lap additionally checks startup, bars and bends. Set
`USE_STUDENT_LINE_FOLLOWER = True` for your controller. **All three selectors must
be `True` for the student trials.** Compile after source changes, then Run.

When both corrected sensors lose the line, `main.py` requests zero motion
immediately and ends after **0.4 s** of continuous loss; it does not search.
Program output reports `result`, `waypoints`, and `elapsed_s`. A `complete`
result means six bar entries; confirm that the observed lap and finish agree.
`line_lost` means persistent loss; `reflectance_unavailable` means missing readings.
Select **Stop** to end an unsuccessful trial and record it as a manual stop.

## 5. Compare a small set of full-lap attempts

Use the same circuit, start, target and cruise speed. Retain supplied geometry,
motor calibration and thresholds. Tune only the active target's constants at
the top of [line_follower.py](line_follower.py): `CRUISE_SPEED_MM_S` [mm/s],
`P_GAIN_RAD_S` [rad/s], `I_GAIN_RAD_S2` [rad/s²] and `D_GAIN_RAD` [rad].
Monitor **Cruise speed** and **P gain** change only the current Run; save chosen
values in the file for the next Run. Keep settings fixed during each comparison.

1. Record a baseline attempt with `I_GAIN_RAD_S2 = 0` and your chosen P/D values;
   use the Project's starting values if you implemented both terms.
2. Change **P only**, keeping D and speed fixed. Compare the same bend: does the
   robot fail to turn enough, or does it swing across the line?
3. Keep the better P value and compare **one D change** at the same speed if
   derivative action is implemented. Does it reduce alternating error, or
   introduce rapid turn changes? If using P only, compare one further P value.
4. Repeat the selected configuration once. Retain failures as well as completed
   laps. Choose reliable tracking before attempting a higher speed.

## 6. Export and submit

After each attempt, open Monitor **Controls** and select **Export run data as CSV**
for the complete recording. Under **Plot signals**, select **Reflectance left**
(`reflectance_left`), **Reflectance right** (`reflectance_right`), **Line error**
(`line_error`), and **Requested turn rate** (`turn_rate_rad_s`).
Set **Time window** to **30 s**, then select **Export plots as SVG**. This image
shows the final 30 s, not an entire longer lap.

For the full lap and matching bend intervals, plot the CSV in MATLAB:
`program_reflectance_left`, `program_reflectance_right`, `program_line_error`,
and `requested_turn_rate_rad_s` against `acquired_at_s` [s]. Use rows with
`sample_kind = course` and one row per `acquisition_seq`; compare the same
`program_waypoints_reached` interval in both trials. Optional **Line P
contribution**, **Line I contribution**, and **Line D contribution** plots show
the actual terms [rad/s]; they start unchecked.

Reflectance plots show raw readings. With physical calibration, their difference
need not equal `line_error`. During `line_lost_stopping`, that error retains its
last value; inspect both raw sensors to interpret the loss.

Submit one report per pair containing:

- Your three component files and `robot_setup.py`, with both names, target,
  circuit and robot identification.
- A trial table: cruise/P/I/D settings, observed outcome, reported `waypoints`,
  `result` and `elapsed_s`. Label manual stops and leave unavailable results blank.
- The plot/CSV exports, a short explanation of your wheel conversion and steering
  rule, code-test results, and one comparison supported by the bend plots.
  Keep virtual results and physical observations distinct.

The remaining files are supplied: [lap_progress.py](lap_progress.py) counts bars;
[live_variables.py](live_variables.py) records signals and provides live controls;
[challenge.py](challenge.py) and [world.json](world.json) define the trial;
[component_checks.py](component_checks.py) runs the code tests. No edits to them
are required.
