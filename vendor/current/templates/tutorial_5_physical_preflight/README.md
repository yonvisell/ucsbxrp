# Tutorial 5: Physical XRP deployment

Run one checked project first on the Virtual XRP and then on a physical XRP.
The project collects sensor records while repeatedly requesting `STOP_COMMAND`;
it never requests motion. This isolates project transfer, program execution,
telemetry, range, encoders, and USER-button input before a moving program is
deployed.

Edit only `student_work.py`.

## Exercise: summarize one stationary run

Complete:

```python
def preflight_report(states: list | tuple) -> dict:
```

`states` is a nonempty ordered collection of `RobotState` records. Raise
`ValueError` when it is empty. Otherwise use one loop to return a dictionary
with exactly these values:

- `"sample_count"`: number of states;
- `"elapsed_time_s"`: sum of `state.measurements.dt_s`;
- `"maximum_abs_wheel_position_mm"`: largest absolute left or right wheel
  position;
- `"usable_range_count"`: number of range values other than `None`;
- `"nearest_range_mm"`: smallest available range, or `None` when no range is
  available;
- `"button_was_pressed"`: `True` if any sample reports a pressed USER button.

Use named accumulators initialized before the loop. Check range with `is not
None` before comparing it. An unavailable range is not zero.

Select **Check exercises**. The checker supplies explicit `RobotState` values
and does not start either robot. `PASS` confirms all fields; `NOT COMPLETED`
means the placeholder remains; `INCORRECT` identifies the first differing
value.

## Rehearse on the Virtual XRP

1. Select **Virtual XRP**, open Monitor, and select **Compile**.
2. Select **Run**. The supplied `main.py` takes one initial state and 125
   scheduled samples, for approximately 2.5 seconds.
3. Press and release the virtual USER button during the run.
4. Confirm in Program output:
   - `sample_count: 126`;
   - `button_was_pressed: True`;
   - a small stationary wheel-position result.
5. Confirm in Monitor that the path remains stationary and the final left and
   right drive commands are zero.
6. Reset and run once more from the same world.

The virtual wall provides a predictable range target. A physical range can
differ or be unavailable because it depends on the actual surface in front of
the ultrasonic sensor.

## Run the same project on a physical XRP

1. If the robot has not been prepared for the current course release, open
   **Set up or Repair**, connect it by USB-C, and complete setup for the selected
   Wi-Fi network.
2. Keep this Tutorial 5 project open. Select **Physical XRP**. Join the robot
   hotspot first if setup chose hotspot mode; otherwise keep the computer on
   the same local network as the XRP.
3. Open Monitor and confirm that the physical XRP is connected.
4. Select **Compile**, then **Run**. Press and release the physical USER button
   during the approximately 2.5-second run.
5. Confirm `Stationary preflight complete` in Program output, physical data in
   Monitor, changing sensor fields, and final drive commands of zero.
6. Select **Reset**, then **Run** again. The same project should start without
   repeating setup.

If connection fails, follow the current System log message rather than changing
project code. A Virtual XRP pass checks the Python project; it does not verify
the physical network, course runtime, or sensor hardware.

## Why the loop contains no delay

`Robot.step(STOP_COMMAND, read_range=True)` maintains the sample schedule,
requests one sensor update, advances the course records, and publishes
telemetry. Do not add `sleep()` or `sleep_ms()`. An extra delay changes the
sample interval rather than merely slowing the display.

After virtual and physical runs both complete, the same project structure is
ready for the course challenges that request motion.
