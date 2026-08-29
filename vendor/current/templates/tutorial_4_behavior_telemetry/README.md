# Tutorial 4: behavior, controls, and telemetry

Run a complete measured behavior, adjust it during a later run, and inspect its
internal values in Monitor. The Virtual XRP approaches a wall, turns
approximately 90 degrees, and stops.

Use the **Virtual XRP** and open Monitor before running. First observe the
supplied baseline without editing. Then change one live control or edit only
`student_work.py`. The sampled loop and final stop remain supplied in `main.py`.

## Program phases

The behavior has three mutually exclusive phases:

- `APPROACH`: move forward while reading the range sensor;
- `TURN`: rotate after the wall is close; and
- `DONE`: request zero motion.

This is a finite-state machine: the current phase and new measurements determine
the next phase. Separating the phase transition from the motor command makes
each decision testable with explicit inputs.

## Walkthrough 1: phase transitions

Read:

```python
def next_phase(
    phase: str,
    range_mm: object,
    stop_distance_mm: float,
    turn_complete: bool,
) -> str:
```

`range_mm` is either a distance in millimeters or `None` when no valid range is
available. The broad `object` annotation and the adjacent explanation are used
because the XRP MicroPython runtime does not use Python's newer union syntax.

Required results:

- `APPROACH` remains active while range is unavailable or greater than the stop
  distance;
- `APPROACH` changes to `TURN` when range is at or below the stop distance;
- `TURN` remains active until `turn_complete` is `True`, then becomes `DONE`;
- `DONE` remains `DONE`.

Raise `ValueError` for an unknown phase or a nonpositive stop distance. Check
`range_mm is not None` before comparing it with a distance.

## Walkthrough 2: motion command for each phase

Read `command_for_phase(...) -> MotionCommand` and identify the three returned
commands.

- `APPROACH` returns positive forward speed and zero turn rate.
- `TURN` returns zero forward speed and positive turn rate for `"left"`, or
  negative turn rate for `"right"`.
- `DONE` returns zero forward speed and zero turn rate.

Raise `ValueError` for an unknown phase, nonpositive speed, nonpositive turn
rate, or a direction other than `"left"` or `"right"`.

`MotionCommand` expresses requested robot motion in millimeters per second and
radians per second. It does not expose raw motor drive values.

## Live parameters

The top of `student_work.py` declares five controls once:

```python
FORWARD_SPEED = live.number(
    "tutorial_forward_speed_mm_s",
    110.0,
    minimum=60.0,
    maximum=180.0,
    step=10.0,
    unit="mm/s",
    label="Forward speed",
)
```

`live.number`, `live.choice`, and `live.toggle` create the controls shown in
Monitor. Read the applied setting through `.value`; do not assign to it. Robot
applies pending changes at a sample boundary, so student code does not add
network handling or timing logic.

These adjustments last for the current run. Values that define a saved robot
or assignment remain in `robot_config.py` or the project task file.

## Walkthrough 3: watch values and plot signals

Read `publish_telemetry(state, phase) -> None` while the baseline runs.

Publish two current values with `live.watch(...)`:

- `phase`: the phase text;
- `range_mm`: the measured range or `"unavailable"`, with unit `"mm"`.

Publish two numerical signals with `live.plot(...)`:

- `wheel_distance_mm`: mean left/right wheel position, with unit `"mm"`;
- `heading_rad`: `state.pose.heading_rad`, with unit `"rad"`.

A watch shows the latest program state. A plot preserves a numerical value in
the run history and adds it as an optional plot signal. Telemetry reports what
the program is doing; it must not decide the next command.

Use `print(...)` for infrequent milestones or exceptions, not once per sample.
Monitor recording is the appropriate source for complete time histories.

## Check and run

1. Open Monitor and select **Run** with the Virtual XRP selected.
2. Observe the approach, range threshold, phase watch, turn, and final stop.
3. Change one live control and repeat from Reset. Compare the path and plots.
4. Trace that visible change through `next_phase`, `command_for_phase`, or
   `publish_telemetry`, then select **Check examples**.

The supplied loop calls `Robot.step()` at the measured sample rate and always
calls `robot.stop()` in `finally`. Do not add `sleep()` or `sleep_ms()`.

Continue with **Tutorial 5: Physical XRP deployment** after the behavior and
telemetry work in simulation.
