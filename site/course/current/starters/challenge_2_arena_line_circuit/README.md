# Challenge 2.3 · Arena Line Circuit

## Task

Program the XRP to follow the taped circuit along one counterclockwise lap. The
robot must negotiate the bends, drive through four intermediate waypoints (tape
bars), and stop when it returns to the start. The supplied code counts waypoints
as they are crossed, recording the start as **1**, the intermediate crossings as
**2–5**, and the finish as **6**. A completed lap must cross all six waypoints.
Complete this part (2.3) after completing parts **2.1** and **2.2**.

In part 2.1, you characterized and recorded the response of the left and right
IR reflectance sensors to white (arena floor) and black (tape) regions. Here,
in part 2.3, you implement a line following controller using those sensor data
and the differential drive controller you implemented in part 2.2.

![The XRP follows the circuit counterclockwise from the start through waypoints 2–5 and back to the finish.](course-assets/arena-line-circuit.svg)

*Figure 1. Circuit 1. The start and finish share one tape bar, crossed twice.*

## 1. Preliminaries: Import your components and retain your measurements

Prepare the following:

- Import [sensor_processor.py](sensor_processor.py), which you developed in
  Challenge 1, into this Project. In both `reset()` and `update()`,
  pass `raw.reflectance` unchanged into `Measurements.reflectance`, including
  `None` when readings are absent. The code tests in this part also check reflectance;
  the encoder tests in Challenge 1 do not.
- Import [differential_drive.py](differential_drive.py) from part 2.2.
- Have your reflectance data and plots from part 2.1 ready to calibrate the
  sensors for your line follower.
- Have your results and plots from part 2.2 ready. Copy your physical robot's
  wheel dimensions, starting commands, and speed command gains into the named
  constants in [settings.py](settings.py).

The results from parts 2.1 and 2.2 will help you determine whether a tracking
problem originates in sensing, differential drive, or the line following
controller. `settings.py` groups the numerical settings you will adjust;
`robot_setup.py` selects your component implementations.

## 2. Calculate steering rate ω from reflectance

Implement `LineFollower.update(reflectance, dt_s)` in
[line_follower.py](line_follower.py). Each call receives calibrated left and
right reflectance readings and the elapsed sample time, `dt_s` [s]. Return
`MotionCommand(forward_speed_mm_s, turn_rate_rad_s)`, using forward speed [mm/s]
and counterclockwise steering rate [rad/s]. The class is imported from `ucsb_xrp`.
Add brief comments explaining your calculations.

### 2.1 Calibrate the readings and calculate the steering error

For each physical sensor, use the highest white reading **W** and lowest black
reading **B** recorded in part 2.1. In `settings.py`:

- Set `LEFT_FLOOR_REFLECTANCE` and `RIGHT_FLOOR_REFLECTANCE` to the respective W values.
- Set `LEFT_LINE_VISIBLE_THRESHOLD` and `RIGHT_LINE_VISIBLE_THRESHOLD` to
  **T = W + 0.1(B − W)** for their respective sensors, as in part 2.1.

A sensor detects tape when its raw reading reaches its threshold T. Your
`LineFollower.update()` receives readings calibrated automatically using that
sensor's white-floor value W:

<p><em>r</em> = (<em>r</em><sub>raw</sub> − <em>W</em>)/(1 − <em>W</em>),
limited to 0–1.</p>

Here <em>r</em><sub>raw</sub> is the recorded sensor reading and <em>r</em> is its
calibrated value. White becomes approximately zero; black remains the larger
value. For Virtual XRP, retain the default calibration. Section 3 explains
how to handle waypoint bars.

![Top view of the XRP with tape beneath its left reflectance sensor and arrows showing a left turn.](course-assets/line-follower-steering.svg)

*Figure 2. A darker left sensor calls for a left turn; the right wheel moves faster.*

Calculate and store the dimensionless steering error:

<p><em>e</em> = <em>r</em><sub>L</sub> − <em>r</em><sub>R</sub>.</p>

Here <em>r</em><sub>L</sub> is `reflectance.left`, <em>r</em><sub>R</sub> is
`reflectance.right`, and <em>e</em> is `self.line_error`. Positive error calls
for positive steering rate, a left turn. The error measures the difference
between sensor readings, not distance from the tape. Both sensors can also give equal readings on white floor.

### 2.2 Calculate the PD\* steering contributions (\*PID without I)

Calculate the requested steering rate from

<p><em>ω</em> = <em>ω</em><sub>P</sub> + <em>ω</em><sub>D</sub>
= <em>K</em><sub>P</sub><em>e</em>
+ <em>K</em><sub>D</sub>(<em>e</em> − <em>e</em><sub>previous</sub>)/Δ<em>t</em>.</p>

Store the two steering contributions, ω<sub>P</sub> and ω<sub>D</sub>, in
`self.p` and `self.d`, respectively; both have units of **rad/s**. They appear
in Monitor as **P steering rate** and **D steering rate**. The gains are:

| Gain | Default in settings.py | Value used by your controller |
| --- | --- | --- |
| K<sub>P</sub> [rad/s] | `P_GAIN_RAD_S` | `self.settings["kp_rad_s"]` |
| K<sub>D</sub> [rad] | `D_GAIN_RAD` | `self.settings["kd_rad"]` |

Use `dt_s` for Δ<em>t</em> and `self.last_error` for the preceding error. Calculate
D before storing the new error in `self.last_error`; use D = 0 when `dt_s` is zero.
P turns in proportion to the current error. D responds to its rate of change:
when a positive error is decreasing, D opposes P and can reduce overshoot.

Limit the sum of steering contributions so that the magnitude of <em>ω</em>
is no greater than
`self.settings["maximum_turn_rate_rad_s"]`, set by `MAXIMUM_TURN_RATE_RAD_S`.
**Requested turn rate** shows this limited result.

Begin with **I = 0** and `self.i = 0`; a PD controller is sufficient.
If integral action is needed later, accumulate error as
<em>E</em> = ∑<em>e</em>Δ<em>t</em> in `self.integral_error`. Store the additional
steering contribution, <em>ω</em><sub>I</sub> = <em>K</em><sub>I</sub><em>E</em>,
in `self.i` and add it to P and D before applying the steering limit.
The gain <em>K</em><sub>I</sub> [rad/s²] is `self.settings["ki_rad_s2"]`,
set by `I_GAIN_RAD_S2`. **I steering rate** displays `self.i` in rad/s.

### 2.3 Reduce forward speed during strong turns

Use the value of <em>ω</em> from the preceding calculation to compute the
forward speed as:

<p><em>v</em> = <em>v</em><sub>cruise</sub>
(1 − <em>s</em>|<em>ω</em>|/<em>ω</em><sub>max</sub>).</p>

Here <em>v</em><sub>cruise</sub> is `self.settings["cruise_speed_mm_s"]`,
<em>s</em> is the slowdown factor, `self.settings["turn_slowdown"]`
(configured by `TURN_SLOWDOWN`),
and <em>ω</em><sub>max</sub> is the maximum steering rate above. Apply
`self.settings["minimum_speed_mm_s"]` as the minimum speed in a turn, without
exceeding the cruise speed. A zero cruise setting must produce zero speed and
zero steering rate. Return the resulting values in a `MotionCommand`.

## 3. Drive through the waypoint bars

When both sensors cross a tape bar, keep the preceding forward speed and
steering rate until the bar has passed:

1. In `reset()`, call `super().reset()` and store an initial command with cruise
   speed and zero steering rate. This drives straight across the starting bar.
2. In `update()`, if both readings reach `self.settings["waypoint_dark_threshold"]`,
   return the stored command. Leave `self.last_error` and `self.integral_error`
   unchanged and set
   `self.p = self.i = self.d = 0` while on the bar.
3. After leaving the bar, calculate steering from the new error with D = 0 for
   that first sample. Store the error for the next derivative calculation.
   After each ordinary update, store the resulting motion command.

Example with constant cruise speed 100 mm/s, K<sub>P</sub> = 1 rad/s, I = 0,
K<sub>D</sub> = 0.02 rad, slowdown factor 0.45, and maximum steering rate 1.4 rad/s.
The error is steady before the bar. These are selected samples from a 20 ms
control loop; intervening samples are omitted. Each line gives the time, the readings
received by `update()`, error, P/I/D contributions, and returned motion:

```text
t=1.00 s: rL=0.48, rR=0.20, e=0.28, p=0.28, i=0, d=0; v=91 mm/s, ω=0.28 rad/s (before bar)
t=1.02 s: rL=0.90, rR=0.90, e=0.00, p=0,    i=0, d=0; v=91 mm/s, ω=0.28 rad/s (on bar)
t=1.20 s: rL=0.90, rR=0.90, e=0.00, p=0,    i=0, d=0; v=91 mm/s, ω=0.28 rad/s (on bar)
t=1.22 s: rL=0.40, rR=0.20, e=0.20, p=0.20, i=0, d=0; v≈94 mm/s, ω=0.20 rad/s (after bar)
```

The zero contributions on the bar indicate that PID steering is suspended;
the returned command retains the preceding turn. Speeds v are in mm/s and
p, i, d, and ω are in rad/s. If cruise changes on a bar, scale the stored speed
and steering rate by the same factor to preserve the turn radius, reducing that
factor if necessary to respect the steering limit. Zero cruise stops motion.
Waypoint counting and stopping at six are automatic.

## 4. Tune the line following controller

Start with the target-specific P and D defaults in `settings.py`, I = 0, and a
cruise speed of 100 mm/s. If this Project has saved live settings, select
**Restore defaults** before the initial comparison. Use the measurements from
parts 2.1 and 2.2 to
resolve sensor bias or poor wheel-speed tracking before changing steering gains.

Place the physical robot with both sensors over the start bar, pointing along
the line; use **Reset** for Virtual XRP. Compile changed source, then Run.
Observe a straight section and a bend. In Monitor, compare **Reflectance left**,
**Reflectance right**, **Line error**, **Requested turn rate**, and the P and D
contributions over the interval where tracking deteriorates.

Choose one change based on your observations of the motion and on the plots:

| Observed motion and supporting data | Change to compare |
| --- | --- |
| The robot runs wide on a bend; tape is visible and steering remains below the limit. | Increase P for a stronger turn. If D is opposing most of P, reduce D instead. |
| The robot repeatedly overshoots the line with smooth alternating error. | Reduce P when the corrections are too large. If their strength is adequate but they persist too long, increase D modestly. |
| Steering changes sharply and D has rapid, large reversals. | Reduce D; check the reflectance traces for abrupt changes that D amplifies. |
| Steering stays at its limit through the failing bend. | Reduce cruise speed or increase `MAXIMUM_TURN_RATE_RAD_S` if the wheels can follow the resulting targets. Increasing P cannot raise a saturated steering rate. |
| Measured wheel speeds depart substantially from their targets, or white and black readings overlap. | Revisit the motor settings or sensor measurements from parts 2.2 or 2.1 before tuning PID. |

For a bend of cornering radius <em>R</em>, the required steering rate is
<em>|ω| = v/|R|</em>. You do not need to measure R: at the same speed, a tighter
bend requires more steering. If the requested steering rate is already at its
limit, increasing P cannot tighten the turn; reduce cruise speed instead.

Change one parameter at a time and use the same starting position.
Record the expected effect, perform a run, and examine the data.
Keep notes on the parameter values tested and their results.

The default program stops the motors when both raw sensor readings fall below
their respective visibility thresholds. It ends the run after 1.0 s if neither
sensor detects tape again. Set this interval with `MAXIMUM_LOST_LINE_S`, beside
`STOP_ON_LINE_LOSS` in `robot_setup.py`. At the normal finish, the output reports `complete`,
six waypoints, and elapsed time. Confirm that the observed circuit and finish
agree with that result.

## 5. Plot and compare your trials

After each trial, select **Export run data as CSV** in Monitor's **Controls**.
Export the selected sensor and steering plots using **Export plots as SVG** or
**Export plots as PNG**. The image covers the selected **Time window**; the CSV
contains the complete recording.

You can use this MATLAB code to plot your exported data. Replace the filename
with the name of your exported CSV:

```matlab
T = readtable('line_trial_01.csv', 'TextType', 'string');
T = T(T.sample_kind == "course", :);             % Select the program's control samples.
[~, i] = unique(T.acquisition_seq, 'stable');     % Select one row per acquired sample.
T = T(i, :);
t = T.acquired_at_s - T.acquired_at_s(1);         % Time from the first sample [s].

figure;
tiledlayout(3, 1);
nexttile;
plot(t, T.program_reflectance_left, t, T.program_reflectance_right);
ylabel('Reflectance'); legend('Left', 'Right'); grid on;
nexttile;
plot(t, T.program_line_error);
ylabel('Line error'); grid on;
nexttile;
plot(t, T.requested_turn_rate_rad_s);
ylabel('Turn rate [rad/s]'); xlabel('Time [s]'); grid on;
exportgraphics(gcf, 'line_trial_01.png', 'Resolution', 200);
```

The reflectance plots contain raw readings; the steering error uses the
calibrated readings defined in Section 2.1.

For steering comparisons, plot `program_omega_p_rad_s` and
`program_omega_d_rad_s`, the P and D steering rates. These signals are named
`omega_p_rad_s` and `omega_d_rad_s` in `live_variables.py`; CSV exports add
the `program_` prefix. For wheel-speed comparisons, plot
`left_wheel_speed_mm_s` and `right_wheel_speed_mm_s` against
`target_left_wheel_speed_mm_s` and `target_right_wheel_speed_mm_s`.

## Testing Your Code Implementations

**A. Run code tests.** Select **Run code tests** to execute checks of your
component methods without driving the robot. An unfinished `LineFollower`
will be reported as needing implementation. These checks use your component
files regardless of the selectors below.

**B. Test one component at a time.** The Project includes supplied implementations
of the sensor processor, differential drive, and line follower. In
[robot_setup.py](robot_setup.py), set one selector to `True` and the other two
to `False` to run with one of your components at a time. For example:

```python
USE_STUDENT_SENSOR_PROCESSOR = True
USE_STUDENT_DIFFERENTIAL_DRIVE = False
USE_STUDENT_LINE_FOLLOWER = False
```

`True` selects your Project file; `False` selects the supplied implementation.
Use this procedure to test your sensor processor and differential drive before
implementing the line follower, and to isolate a component when investigating
poor tracking. **On challenge day, all three selectors must be `True`.**

## Your report (part of your portfolio)

Submit one report per pair, including:

1. **Implementation.** Explain your calibrated steering error, PID contributions,
   speed reduction, and waypoint-bar behavior. Include your commented code.
2. **Trials.** Tabulate actual speed and P/I/D settings, observed outcome,
   waypoint count, and elapsed time. Include an initial trial, a comparison
   chosen from the evidence, and a repeat of the selected setting. Retain failed
   trials and identify manually stopped runs. Name the robot, circuit, and target
   mode for each trial.
3. **Plots and interpretation.** Show the sensor and steering plots for the
   compared interval. Explain your prediction, the observed change, and why the
   evidence supports your selected settings. State whether the robot completed
   the circuit repeatably.

Attach the CSV exports, figures, MATLAB script, code-test results, and a Project
ZIP containing your final files. Include both partners' names.

## Project files

<div class="project-file-table">

| File | Purpose |
| --- | --- |
| [line_follower.py](line_follower.py) | Implement steering and motion through waypoint bars. |
| [sensor_processor.py](sensor_processor.py) | Reuse your wheel measurements and paired IR readings from Challenge 1. |
| [differential_drive.py](differential_drive.py) | Reuse your motion-to-wheel-speed conversion from part 2.2. |
| [settings.py](settings.py) | Enter measured calibration and adjust steering defaults. |
| [robot_setup.py](robot_setup.py) | Select student or supplied components and optional recovery behavior. |
| [main.py](main.py), [lap_progress.py](lap_progress.py) | Supplied program, sensor calibration, crossing count, and stop decisions. |
| [supplied_settings.py](supplied_settings.py), [live_variables.py](live_variables.py) | Supplied operating settings, plots, and live controls. |
| [challenge.py](challenge.py), [world.json](world.json), [component_checks.py](component_checks.py) | Supplied circuit definition and component tests. |

</div>

## What is main.py doing?

The supplied [main.py](main.py) reads measurements, applies the live controls,
and asks `LineCircuit` in `lap_progress.py` for the next motion command.
`LineCircuit` calibrates reflectance, counts crossings, calls your line follower,
and decides when the lap ends. `Robot.step()` converts the command into wheel
speeds, drives the motors, and returns the next measurements. The program
publishes the plots and stops the motors when the run ends.

For a later extension that searches for the tape after leaving it, set
`STOP_ON_LINE_LOSS = False` in `robot_setup.py`. Your line follower will then
continue receiving white-floor readings and can choose a recovery motion.
