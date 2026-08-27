# Tutorial 4: behavior and telemetry

This project combines a measured finite-state behavior with adjustable values,
watch values, and plot signals. Edit only `student_work.py`. Use the **Virtual
XRP** and open Monitor before running.

The supplied runner approaches the wall, turns approximately 90 degrees, and
stops. Your functions decide the state transitions and motion commands and
publish selected intermediate values. The loop itself remains in `main.py` so
the sample scheduling and stopping behavior are not duplicated.

## Live controls already declared for you

The first part of `student_work.py` declares four controls:

- **Forward speed** and **Stop distance** use `live.number(...)`;
- **Turn direction** uses `live.choice(...)`; and
- **Run behavior** uses `live.toggle(...)`.

Each returned control has a `.value` property. The Monitor can update this
value while the program runs. The identifier, default, limits, units, and label
form the control's interface; leave them unchanged until the exercises pass.

## Exercise 1: state transitions

Complete `next_phase(phase, range_mm, stop_distance_mm, turn_complete)`.

- `APPROACH` remains active while range is unavailable or greater than the stop
  distance, and changes to `TURN` when range is at or below the threshold.
- `TURN` remains active until `turn_complete` is true, then changes to `DONE`.
- `DONE` remains `DONE`.
- An unknown phase or nonpositive stop distance raises `ValueError`.

The three phase names are mutually exclusive. Keeping the transition rule in a
pure function makes it testable with explicit inputs before the robot runs.

## Exercise 2: motion for each phase

Complete
`command_for_phase(phase, forward_speed_mm_s, turn_rate_rad_s, turn_direction)`.
Return a `MotionCommand` with:

- positive forward speed and zero turn rate for `APPROACH`;
- zero forward speed and positive yaw rate for a left `TURN`;
- zero forward speed and negative yaw rate for a right `TURN`; and
- zero speed and zero turn rate for `DONE`.

Reject unknown phases, nonpositive speed or turn-rate settings, and a turn
direction other than `"left"` or `"right"` with `ValueError`.

## Exercise 3: publish useful telemetry

Complete `publish_telemetry(state, phase)`. Publish:

- a watch value named `phase` containing the phase text;
- a watch value named `range_mm` containing the measured range or the text
  `"unavailable"`, with unit `"mm"`;
- a plot signal named `wheel_distance_mm` containing the mean of the left and
  right wheel positions, with unit `"mm"`; and
- a plot signal named `heading_rad` containing `state.pose.heading_rad`, with
  unit `"rad"`.

Use `live.watch(...)` for a current value that helps interpret program state.
Use `live.plot(...)` for a numeric value whose variation with time matters.
Telemetry reports the program; it must not determine the control command.

## Test and run

1. Select **Check exercises**. The check substitutes explicit phases,
   measurements, and a telemetry recorder without starting either robot.
2. Resolve all `NOT COMPLETED` and `INCORRECT` outcomes.
3. Select **Run** with the Virtual XRP selected.
4. In Monitor, adjust one control at a time. Observe the path, phase, range,
   wheel distance, and heading.
5. Reset and repeat a run before comparing two settings.
6. Use Monitor recording and export when a plot or trajectory is evidence for
   an engineering conclusion; Program output is intended for occasional
   milestones and errors, not one print per sample.

`Robot.step()` maintains the sample schedule and publishes the standard robot
telemetry. Do not add `sleep_ms()` to this sampled loop. The additional delay
would change encoder sample spacing, control response, odometry, and telemetry
timing rather than merely slowing the display.

After this tutorial, the course challenges apply the same cycle—measure,
decide, command, and update—through student-implemented course components.
