# Tutorial 4: behavior and live measurements

Run a complete Virtual XRP behavior: approach the marked wall, turn about 90°,
and stop. Its next command depends on a range reading, a retained phase, and
estimated heading. You will change one live value while observing the phase
watch and two plots, then trace that visible change to a line of Python.

Open Monitor beside the IDE and **Run the supplied project before editing**.
Program output should show three `PASS` checks, then the final pose. The path
should approach the wall and turn. Reset before each comparison so both runs
start from the same pose. The supplied `main.py` owns the sampled loop and final
motor stop; edit `student_work.py` only when exploring a function.

## Project files and the data path

| File | Role |
| --- | --- |
| `student_work.py` | Runnable phase, command, and publication functions to read and edit. |
| `live_variables.py` | Supplied Monitor control declarations for speed, distance, direction, and Run behavior. |
| `main.py` | Supplied measured approach/turn sequence and motor cleanup. |
| `exercise_checks.py` | Supplied input/output examples that run before motion. |
| `course_setup.py`, `robot_config.py` | Supplied robot assembly and settings. |
| `world.json` | Supplied arena, wall, and start pose shown in Monitor. |

`Robot.step(command, read_range=True)` takes the next sample while approaching.
The returned `RobotState` contains `state.measurements.range_mm` and
`state.pose.heading_rad`. The program passes those values to `next_phase`,
passes the chosen phase to `command_for_phase`, publishes the same state to
Monitor, and then requests the next sample. This is the complete
**measure → decide → command → publish** cycle.

## 1. Predict a phase transition

There are three phase names: `APPROACH`, `TURN`, and `DONE`. The current phase
and new readings determine the next one.

| Current phase | New evidence | Next phase |
| --- | --- | --- |
| `APPROACH` | Range 300 mm, stop distance 260 mm | `APPROACH` |
| `APPROACH` | Range 260 mm, stop distance 260 mm | `TURN` |
| `APPROACH` | Range `None` | `APPROACH` for that one decision |
| `TURN` | Heading change 1.50 rad, below π/2 | `TURN` |
| `TURN` | Heading change 1.60 rad, above π/2 | `DONE` |
| `DONE` | Any later reading | `DONE` |

`None` means no usable range measurement, not zero distance. The function
checks `range_mm is not None` before comparing distances. Six consecutive
unavailable readings cause the supplied runner to stop with a fault, rather
than drive toward an unseen wall. `next_phase` itself stays a small,
input/output function that can be checked without starting a robot.

`turn_start_heading_rad` is reset when the phase first changes to `TURN`.
Later heading changes are measured relative to that start, not relative to
the original arena heading. The code uses `wrap_angle_rad` for the `−π`/`π`
boundary. Predict which phase you would choose for a heading change of 1.50
rad, then compare it with the table before running.

## 2. Predict a motion command

`command_for_phase(...)` returns a `MotionCommand` with named
`forward_speed_mm_s` and `turn_rate_rad_s` fields.

| Phase | Forward speed | Turn rate |
| --- | --- | --- |
| `APPROACH` | Positive live speed | 0 |
| `TURN`, left | 0 | Positive live turn rate |
| `TURN`, right | 0 | Negative live turn rate |
| `DONE` | 0 | 0 |

Positive turn is counterclockwise. At a selected speed of 110 mm/s and turn
rate of 0.8 rad/s, a left-turn command is `MotionCommand(0.0, 0.8)`, not a
request to drive forward while turning. The function rejects invalid phase,
speed, rate, or direction inputs before constructing a command. These are
requested robot motions; the supplied wheel controller determines bounded
motor effort.

## 3. Change one live control and compare evidence

`live_variables.py` declares speed, stopping distance, turn rate,
direction, and a Run behavior toggle. They appear under Monitor controls.
Read current values through `.value`; the robot applies a changed control at
a sample boundary. Changing a slider during a run does not rewrite the saved
project file.

1. Run the baseline with `STOP_DISTANCE = 260 mm`. In Monitor, note the
   approach path, the range near the phase change, and the final heading.
2. Reset. Set Stop distance to 340 mm and Run. Predict an earlier turn, farther
   from the wall, before inspecting the path. Compare the `range_mm` watch at
   the transition and the two paths. Keep speed and turn rate fixed.
3. Reset. Restore 260 mm, choose `right`, and Run. Predict the sign of the
   heading change. Compare the heading plot and final pose with the left run.
4. Restore `left`. If you change `next_phase` or `command_for_phase` in
   `student_work.py`, Run again and read the first differing check before
   interpreting the path.

The Run behavior toggle can request `DONE` and zero motion at the next sampled
decision. The IDE **Stop** action interrupts the run separately.

## 4. Connect telemetry to its source

`publish_telemetry(state, phase)` sends the current `phase` and `range_mm` to
`live.watch(...)`. A watch shows the latest value; unavailable range appears
as text. It sends two numerical values to `live.plot(...)`:

- `wheel_distance_mm`: mean left/right wheel position in mm;
- `heading_rad`: estimated heading in rad.

For left and right positions 140 and 160 mm, the plotted mean is 150 mm. That
number is a computed wheel-position value, not a separate floor measurement.
The plot retains samples in the recorded run; the watch shows current status.
Publication does not choose a command. Use a `print(...)` for a rare milestone
or exception, not once per sample.

The runner stops if approach wheel travel reaches 500 mm without a valid phase
change, if six consecutive range readings are unavailable, or if a turn fails
to reach π/2 within 5 s. Those limits are fault stops; normal approach and turn
end from range and heading measurements. `robot.stop()` in `finally` covers
normal completion and Python exceptions. `Robot.step()` already schedules
samples; do not add `sleep()` to the loop. This virtual run does not establish
physical stopping distance or sensor calibration.

Continue to **Tutorial 5: Physical XRP deployment** after you can connect a
visible path, phase transition, and plotted signal to the source measurements.
