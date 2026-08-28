# Tutorial 5: Physical XRP deployment

Run one project first on the Virtual XRP and then on a physical XRP. The first
part collects stationary sensor records. The second part requests a short,
low-speed straight motion and confirms that wheel position changes. This tests
project transfer, execution, telemetry, sensors, motors, encoders, and stopping
without solving a course challenge.

Edit only `student_work.py`.

## Exercise: summarize a sequence of robot states

Complete:

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

Select **Check exercises**. Program output checks each report field separately,
so one incorrect calculation does not hide the others. `NOT COMPLETED` means
the placeholder remains; `INCORRECT` identifies a result that differs.

## Rehearse on the Virtual XRP

1. Select **Virtual XRP**, open Monitor, and select **Compile**.
2. Select **Run**. The program first collects samples with `STOP_COMMAND`, then requests
   60 mm/s for 25 samples (approximately 0.5 seconds), and finally stops.
3. Press and release the virtual USER button during the stopped portion if you
   want to verify that field.
4. Confirm the stationary report and `motion_wheel_travel_mm` in **Program
   output**. Confirm a short straight path and final zero command in Monitor.
5. Reset and repeat once.

## Run on a physical XRP

1. If needed, open **Set up or Repair**, attach the XRP by USB-C, and prepare it
   for the selected Wi-Fi network.
2. Keep this project open and select **Physical XRP**. The computer and XRP must
   use the network selected during setup.
3. Open Monitor and confirm that the physical XRP is connected.
4. Place the robot where a short straight motion is possible, then select
   **Compile** and **Run**.
5. Confirm changing encoder and wheel-position values, positive
   `motion_wheel_travel_mm`, telemetry in Monitor, and a final zero command.
6. Select **Reset**, then **Run** again. Repeating a project should not require
   another setup operation.

If connection fails, use the current System log message. A Virtual XRP pass
checks the Python project; it does not verify the physical network or hardware.

## Why the loop contains no delay

`Robot.step(...)` already waits for the next scheduled sample, applies the
command, reads sensors, updates state, and publishes telemetry. **Do not add
`sleep()` or `sleep_ms()` inside the loop.** An extra delay makes the measured
sample interval incorrect and changes the controller and odometry results.

After both runs complete, you have used the same program structure required by
the course challenges.
