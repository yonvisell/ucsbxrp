# Challenge 1: Straight Run

## The challenge

Drive from the start line to the finish marker and use measured wheel travel to
stop. First make the stopping distance repeatable. Then finish as close as
possible to the assigned target time without finishing early.

The task values have one source:

- [`world.json`](world.json) defines the initial pose and finish marker.
- [`challenge.py`](challenge.py) loads `INITIAL_POSE`, calculates
  `TRAVEL_DISTANCE_MM`, and defines `TARGET_TIME_S` and the
  `MAX_RUN_TIME_S` run-step limit.

Use these names in your program. Do not copy their current numerical values
into another file. Record robot-specific calibration in
[`robot_setup.py`](robot_setup.py).

## What you implement

Implement two classes:

- [`sensor_processor.py`](sensor_processor.py): `SensorProcessor.reset()` establishes the
  encoder and time origins. `SensorProcessor.update()` converts each later raw
  sample into wheel position, newest wheel travel, elapsed time, and wheel-speed
  estimates. Use the encoder signs, wheel geometry, and speed-estimator setting
  in `self.config`.
- [`wheel_speed_controller.py`](wheel_speed_controller.py):
  `WheelSpeedController.update()` compares requested and measured wheel speeds
  and returns a limited `DriveCommand`. A zero speed request must produce an
  exact zero command for that wheel. Use the calibration, feedback gain, and
  command limit in `self.config`.

Leave `SensorProcessor.estimate_range()` unfinished; Challenge 5 introduces it.

## Project modules

| File | Role |
| --- | --- |
| [`sensor_processor.py`](sensor_processor.py) | Defines `SensorProcessor`, which converts encoder counts and time to physical measurements. |
| [`wheel_speed_controller.py`](wheel_speed_controller.py) | Defines `WheelSpeedController`, which converts wheel-speed error to a `DriveCommand`. |
| [`robot_setup.py`](robot_setup.py) | Holds robot calibration and settings, selects components, and constructs the robot. |
| [`main.py`](main.py) | Runs the straight-distance task and reports distance and elapsed time. |
| [`component_checks.py`](component_checks.py) | Calls the required `SensorProcessor` and `WheelSpeedController` methods without starting a robot. |

## Provided files and tools

- `StraightLineController` requests cruise speed, reduces speed near the
  finish, and stops at the assigned travel distance.
- The supplied `DifferentialDrive` and `Odometry` complete the robot loop until
  Challenge 2.
- `Robot` maintains the measured control cycle. `XRPBot` applies motor commands
  and reads the hardware or simulator.

## How the program runs

```text
finish distance + measured wheel travel
                 -> StraightLineController -> requested forward speed
                 -> DifferentialDrive       -> wheel-speed targets
encoder readings -> SensorProcessor             -> measured wheel speeds
targets + measured speeds
                 -> WheelSpeedController     -> motor commands
```

The loop ends when measured travel reaches `TRAVEL_DISTANCE_MM`. `main.py`
converts `MAX_RUN_TIME_S` to a maximum step count using the nominal sample
period. If the distance has not been reached by then, it reports the failure
and raises an error. The `finally` block in `main.py` calls
`robot.stop()` after normal completion or a Python exception. The target runtime
handles the IDE's **Stop** separately; forced termination can bypass Python cleanup.

## Check each component

Select **Test functions** in the IDE. The checks load `SensorProcessor` from
`sensor_processor.py` and `WheelSpeedController` from
`wheel_speed_controller.py`; they do not move either robot. For each class,
read its `USE`,
`INPUT`, and `EXPECT` lines before the result:

- `PASS` means the implemented behavior matched the stated examples.
- `NOT IMPLEMENTED` means the named method still needs to be written.
- `FAIL` means the method ran, but its result did not meet the stated
  requirement.

Fix every `NOT IMPLEMENTED` and `FAIL`, then run **Test functions** again. Set
the matching `USE_STUDENT_*` flag in `robot_setup.py` to `True` only after that
class passes its checks.

## Complete the challenge

1. Run the supplied classes on the virtual XRP. Locate requested wheel
   speed, measured wheel speed, drive command, and wheel travel in Monitor.
2. Select the `SensorProcessor` defined in `sensor_processor.py`. Verify that
   forward position increases, each
   increment contains only the newest wheel travel, and the speed estimate
   follows changes without reporting each encoder-count step as a speed spike.
3. Select the `WheelSpeedController` defined in
   `wheel_speed_controller.py`. Verify command limits and an exact zero command
   at the finish.
4. Compare repeated virtual runs using the reported distance, lateral,
   heading, and time errors. `timed_result` states explicitly whether a run
   finished early or satisfied the no-earlier-than-target rule.
5. For the physical XRP, first check wheel direction and Stop with the wheels
   clear. Then run the marked lane and record distance, elapsed time, requested
   and measured speed, and drive command.

## Reuse work in another challenge

Choose **Reuse code in a new project…** in the IDE. Review **Preserve**,
**Merge robot calibration** (if shown), **Replace for the new task**, **Add**,
and **Leave in the source project** (if shown) before creating the separate
Project. The current Project remains unchanged.
