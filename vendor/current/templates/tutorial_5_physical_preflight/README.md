# Tutorial 5: Physical XRP deployment

Run one project first on the Virtual XRP and then on a physical XRP. The first
part collects stationary sensor records. The second part requests a short,
low-speed straight motion and confirms that wheel position changes. This tests
project transfer, execution, telemetry, sensors, motors, encoders, and stopping
without solving a course challenge.

The supplied project is immediately runnable. Rehearse it on the Virtual XRP
before editing `student_work.py` or selecting the physical target. The
**Enable short motion** live control defaults off; no motor motion follows the
stationary report until you explicitly enable it for a later Run.

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
- `"usable_range_count"`: number of range values other than `None`;
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
2. Select **Run** with **Enable short motion** off. The program collects samples
   with `STOP_COMMAND`, prints the stationary report, and exits without motion.
3. Set **Enable short motion** on, Reset, and select **Run** again. After the
   stationary report, the program requests 60 mm/s for 25 samples
   (approximately 0.5 seconds), then stops.
4. Press and release the virtual USER button during the stopped portion if you
   want to verify that field.
5. Confirm the stationary report and `motion_wheel_travel_mm` in **Program
   output**. Confirm a short straight path and final zero command in Monitor.
6. Set **Enable short motion** off before changing targets.

## Run on a physical XRP

1. If needed, open **Set up or Repair**, attach the XRP by USB-C, and prepare it
   for the selected Wi-Fi network.
2. Keep this project open and select **Physical XRP**. The computer and XRP must
   use the network selected during setup.
3. Open Monitor and confirm that the physical XRP is connected and **Enable
   short motion** is off. Select **Run** once to collect only the stationary
   report.
4. Place the robot where a short straight motion is possible. Set **Enable short
   motion** on, then select **Run** deliberately.
5. Confirm changing encoder and wheel-position values, positive
   `motion_wheel_travel_mm`, telemetry in Monitor, and a final zero command.
6. Set **Enable short motion** off after the test. A later repetition does not
   require another setup operation, but it does require deliberately enabling
   motion again.

If connection fails, use the current System log message. A Virtual XRP pass
checks the Python project; it does not verify the physical network or hardware.

## Why the loop contains no delay

`Robot.step(...)` already waits for the next scheduled sample, applies the
command, reads sensors, updates state, and publishes telemetry. **Do not add
`sleep()` or `sleep_ms()` inside the loop.** An extra delay makes the measured
sample interval incorrect and changes the controller and odometry results.

After both runs complete, you have used the same program structure required by
the course challenges.
