# Tutorial 5: Physical XRP deployment

Run one project first on the Virtual XRP and then on a physical XRP. The first
part collects stationary sensor records for 1 s. The second part requests a short,
low-speed straight motion and confirms that wheel position changes. This tests
project transfer, execution, telemetry, sensors, motors, encoders, and stopping
without solving a course challenge.

The supplied project is immediately runnable. Rehearse it on the Virtual XRP
before editing `student_work.py` or selecting the physical target. Near the top
of `main.py`, `ENABLE_SHORT_MOTION = False` selects stationary measurements only.
Set this constant to `True` before Run to add the short motion check. This is a
saved program setting: every Run includes motion while it remains `True`.
Restore `False` afterward and before changing targets.

## Walkthrough: summarize a sequence of robot states

Read:

```python
def preflight_report(states: object) -> dict:
```

`states` is a nonempty list or tuple of `RobotState` records. Use one loop to
return a dictionary containing:

- `"sample_count"`: number of states;
- `"elapsed_time_s"`: sum of `state.measurements.dt_s`;
- `"maximum_abs_wheel_position_mm"`: largest absolute left or right wheel
  position;
- `"usable_range_count"`: number of control states with range other than `None`,
  including retained readings; this is not the number of ultrasound attempts;
- `"nearest_range_mm"`: smallest available range, or `None` if no range is
  available; and
- `"button_was_pressed"`: `True` if any state reports a pressed USER button.

Raise `ValueError` for an empty collection. Initialize named accumulators before
the loop. Check `range_mm is not None` before comparing distances.

Each **Run** checks every report field before interacting with either XRP, so
one incorrect edit does not hide the others and an invalid report prevents
motion.

## Rehearse on the Virtual XRP

1. Select **Virtual XRP**, open Monitor, and select **Compile**.
2. Leave `ENABLE_SHORT_MOTION = False` in `main.py` and select **Run**. The program collects samples
   with `STOP_COMMAND`, prints the stationary report, and exits without motion.
3. In `main.py`, change the setting to `ENABLE_SHORT_MOTION = True`, select
   **Reset**, and select **Run** again. After the
   stationary report, the program requests 60 mm/s for 0.5 s of measured
   sample time, then stops. The final sample can exceed this limit by one
   sample interval.
4. Press and release the virtual USER button during the stopped portion if you
   want to verify that field.
5. Confirm the stationary report and `motion_wheel_travel_mm` in **Program
   output**. Confirm a short straight path and final zero command in Monitor.
6. Restore `ENABLE_SHORT_MOTION = False` in `main.py`. Run once more and confirm
   the stationary report without a motion result before changing targets.

## Run on a physical XRP

1. For an uncommissioned XRP, use **Robot Setup**: switch its power off,
   connect USB-C, then switch it on. For an already configured XRP, use
   **Wi-Fi setup → Test Wi-Fi**. The computer and robot normally use class Wi-Fi.
2. Keep this project open and select **Physical XRP**. The computer and XRP must
   use the network selected during setup.
3. Open Monitor, confirm that the physical XRP is connected, and check that
   `main.py` contains `ENABLE_SHORT_MOTION = False`. Select **Run** once to
   collect only the stationary report.
4. Place the robot where a short straight motion is possible. In `main.py`, set
   `ENABLE_SHORT_MOTION = True`, then select **Run**.
5. Confirm changing encoder and wheel-position values, positive
   `motion_wheel_travel_mm`, telemetry in Monitor, and a final zero command.
6. Restore `ENABLE_SHORT_MOTION = False` in `main.py` after the test. A later
   repetition does not require another setup operation; set the constant to
   `True` only when you intend another motion run.

If connection fails, use the current System log message. A Virtual XRP pass
checks the Python project; it does not verify the physical network or hardware.

## Trace `main.py`

1. `run_preflight()` runs the report checks. A failed check ends the program
   before robot construction.
2. `make_robot(ROBOT_CONFIG)` assembles the supplied sensor, wheel-control,
   drive, and odometry components. `sample_period_ms=10` schedules 100 Hz.
3. `collect_stationary_samples(robot)` starts from the selected world's pose,
   saves the first state, and calls `robot.step(STOP_COMMAND, read_range=True)`
   until 1 s has elapsed. It stops in `finally` and returns the saved states.
4. `preflight_report(states)` reads that collection and returns six named
   results. `run_preflight()` prints each result.
5. When `ENABLE_SHORT_MOTION` is `True`, `run_short_motion(robot)` starts a
   fresh measurement sequence, requests `MotionCommand(60.0, 0.0)` for 0.5 s,
   and stops in `finally`. The program subtracts starting wheel position
   from final wheel position to report this motion's travel.

Both durations use sample timestamps. Changing the control period changes
how many states are collected, while retaining the 1 s and 0.5 s limits.

## Why the loop contains no delay

`Robot.step(...)` calculates and applies the wheel commands, waits until
the next scheduled sample, reads sensors, updates state, and publishes telemetry. **Do not add
`sleep()` or `sleep_ms()` inside the loop.** An extra delay slows feedback and changes the time between motion commands.
The measurement timestamps still record the actual elapsed interval.

After both runs complete, you have used the same program structure required by
the course challenges.
