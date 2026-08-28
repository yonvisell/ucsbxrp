# Tutorial 5: physical XRP preflight

This final tutorial carries one checked UCSBXRP project from the Virtual XRP to
a physical XRP. The run requests only `STOP_COMMAND`, so it samples encoders,
range, and button state without requesting motion. Edit only `student_work.py`.
The supplied `main.py` runs a fixed number of samples and always sends the final
stop command.

## Exercise: summarize stationary evidence

Complete `preflight_report(states)`. `states` is a nonempty list or tuple of
`RobotState` records collected from one stationary run. Raise `ValueError` for
an empty collection. Otherwise return a dictionary with exactly these entries:

- `"sample_count"`: number of states;
- `"elapsed_time_s"`: sum of `state.measurements.dt_s`;
- `"maximum_abs_wheel_position_mm"`: largest absolute left or right wheel
  position in the collection;
- `"usable_range_count"`: number of range values that are not `None`;
- `"nearest_range_mm"`: smallest available range, or `None` if none are
  available; and
- `"button_was_pressed"`: `True` if any sample reports a pressed USER button.

Use a loop and named accumulators. A range value of `None` means unavailable;
do not replace it with zero. **Check exercises** supplies explicit
`RobotState` values and reports `PASS`, `NOT COMPLETED`, or `INCORRECT` without
starting either robot.

## Rehearse with the Virtual XRP

1. Select **Virtual XRP** and open Monitor.
2. Select **Check exercises**, then **Compile**.
3. Select **Run**. During the approximately 2.5-second run, press and release
   the XRP **USER** button once. The runner takes one initial state and 125
   scheduled samples.
4. Confirm `sample_count: 126`, `button_was_pressed: True`, a stationary path,
   and final drive command `0.00 / 0.00` in Monitor. On the Virtual XRP, use the
   Monitor's USER-button control.
5. Reset and run again. The result should be repeatable from the same world.

The virtual wall provides a range target. The program may report a different
range, or no usable range, on a physical bench because the real result depends
on the surface in front of the sensor.

## Deploy the same project to a physical XRP

Use a stable bench with the robot clear of loose objects. This tutorial does
not request motion, but keep **Stop** accessible throughout the run.

1. If the XRP has not been prepared for the current course, open
   **Setup and repair**, connect USB-C, install or repair the course runtime, and
   choose either the robot hotspot or an existing Wi-Fi network. Continue only
   after the setup page verifies the XRP service and opens the IDE handoff.
2. Return to this Tutorial 5 project. Select **Physical XRP** and the Wi-Fi
   connection configured by the setup wizard. If using the robot hotspot,
   first join that XRP network from the computer's Wi-Fi menu.
3. Open Monitor. Confirm that the physical target is connected, then select
   **Compile** and **Run**. Press and release the physical XRP **USER** button
   during the approximately 2.5-second run. Run sends the current project to
   the XRP and starts it.
4. Confirm that Program output reaches `Zero-motion preflight complete`,
   Monitor identifies physical data, the drive command remains
   `0.00 / 0.00`, and encoder, range, and button fields update.
5. Select **Reset**, then **Run** once more. An unchanged project should run
   again without repeating setup or repair.
6. Save the Program output or a short Monitor recording when the instructor
   requests deployment evidence.

If the physical target does not connect, use the message in System log to check
USB setup, computer Wi-Fi selection, robot connection, project compilation, and
Run in that order. A Virtual XRP pass checks the project but does not check the
physical connection.

## Why there is no explicit delay

`Robot.step(STOP_COMMAND, read_range=True)` maintains the absolute sample
schedule, reads the XRP, updates the course records, and publishes telemetry.
There is no `sleep()` or `sleep_ms()` in the loop. Adding one would change the
measurement interval rather than merely slowing the display.

After this zero-motion deployment succeeds, begin the course challenges with
the project, motion limits, and physical setup assigned by the instructor.
